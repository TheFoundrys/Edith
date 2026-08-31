"use server";

import { revalidatePath } from "next/cache";
import {
  DEFAULT_AI_PLUGIN_ID,
  getAiPlugin,
  getOrgAiPluginState,
  listAiPlugins,
} from "@/lib/ai";
import { requireCapability } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  decryptConfig,
  encryptConfig,
} from "@/lib/security/encrypted-config";
import { recordAudit } from "@/lib/audit";

export async function getAiPluginAdminState() {
  const session = await requireCapability("manageAiPlugins");
  const plugins = listAiPlugins();
  const state = await getOrgAiPluginState(session.user.organizationId);
  const plugin = getAiPlugin(state.pluginId);
  const secretKeys = new Set(
    plugin?.manifest.fields
      .filter((field) => field.type === "password")
      .map((field) => field.key) ?? [],
  );
  return {
    plugins,
    state: {
      ...state,
      config: Object.fromEntries(
        Object.entries(state.config).filter(([key]) => !secretKeys.has(key)),
      ),
      configuredSecretKeys: [...secretKeys].filter(
        (key) => Boolean(state.config[key]),
      ),
    },
  };
}

export async function saveAiPluginSettings(input: {
  pluginId: string;
  enabled: boolean;
  config: Record<string, string>;
}) {
  const session = await requireCapability("manageAiPlugins");
  const plugin = getAiPlugin(input.pluginId);
  if (!plugin) return { error: "Unknown AI plugin." };

  // Keep previous secrets if the password field is left blank on save.
  const existing = await prisma.aiPluginSetting.findUnique({
    where: { organizationId: session.user.organizationId },
  });
  let previous: Record<string, string> = {};
  try {
    previous = existing?.configJson
      ? decryptConfig(existing.configJson)
      : {};
  } catch {
    previous = {};
  }

  const merged: Record<string, string> = {};
  for (const field of plugin.manifest.fields) {
    const next = input.config[field.key]?.trim() ?? "";
    if (field.type === "password" && !next && previous[field.key]) {
      merged[field.key] = previous[field.key];
    } else {
      merged[field.key] = next;
    }
  }
  for (const field of plugin.manifest.fields) {
    if (field.required && !merged[field.key]?.trim()) {
      return { error: `${field.label} is required for ${plugin.manifest.name}.` };
    }
  }

  let encryptedConfig: string;
  try {
    encryptedConfig = encryptConfig(merged);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "AI configuration encryption failed.",
    };
  }

  await prisma.aiPluginSetting.upsert({
    where: { organizationId: session.user.organizationId },
    create: {
      organizationId: session.user.organizationId,
      pluginId: input.pluginId || DEFAULT_AI_PLUGIN_ID,
      enabled: input.enabled,
      configJson: encryptedConfig,
    },
    update: {
      pluginId: input.pluginId || DEFAULT_AI_PLUGIN_ID,
      enabled: input.enabled,
      configJson: encryptedConfig,
    },
  });
  await recordAudit({
    organizationId: session.user.organizationId,
    actor: session.user,
    action: "AI_PLUGIN_SETTINGS_UPDATED",
    entityType: "AiPluginSetting",
    targetResource: input.pluginId,
    metadata: { pluginId: input.pluginId, enabled: input.enabled },
  });

  revalidatePath("/admin/plugins/ai");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/quizzes");
  return { ok: true as const };
}

export async function testAiPluginConnection() {
  const session = await requireCapability("manageAiPlugins");
  try {
    const { getAiAdapterForOrg } = await import("@/lib/ai");
    const adapter = await getAiAdapterForOrg(session.user.organizationId);
    const draft = await adapter.generateAssignmentDraft({
      programName: "Connection test",
      topic: "plugin health check",
      difficulty: "intro",
    });
    return {
      ok: true as const,
      provider: adapter.provider,
      sampleTitle: draft.title,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Connection test failed.",
    };
  }
}
