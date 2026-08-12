import {
  createAiPort,
  DEFAULT_AI_PLUGIN_ID,
  getAiPlugin,
  listAiPlugins,
} from "@/lib/ai/plugins/registry";
import type { AiPort } from "@/lib/ai/types";
import { prisma } from "@/lib/db";

export type OrgAiPluginState = {
  pluginId: string;
  enabled: boolean;
  config: Record<string, string>;
  providerLabel: string;
};

function parseConfig(configJson: string): Record<string, string> {
  try {
    const raw = JSON.parse(configJson) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") out[k] = v;
      else if (v != null) out[k] = String(v);
    }
    return out;
  } catch {
    return {};
  }
}

export async function getOrgAiPluginState(
  organizationId: string,
): Promise<OrgAiPluginState> {
  const row = await prisma.aiPluginSetting.findUnique({
    where: { organizationId },
  });
  const pluginId = row?.pluginId || DEFAULT_AI_PLUGIN_ID;
  const plugin = getAiPlugin(pluginId);
  return {
    pluginId,
    enabled: row?.enabled ?? true,
    config: parseConfig(row?.configJson ?? "{}"),
    providerLabel: plugin?.manifest.name ?? pluginId,
  };
}

/** Resolve the active AI port for an organization from DB plugin settings. */
export async function getAiAdapterForOrg(
  organizationId: string,
): Promise<AiPort> {
  const state = await getOrgAiPluginState(organizationId);
  if (!state.enabled) {
    throw new Error(
      "AI plugins are disabled for this organization. Enable one under Admin → AI plugins.",
    );
  }
  return createAiPort(state.pluginId, state.config);
}

/** @deprecated Prefer getAiAdapterForOrg — kept only for type re-exports. */
export async function getAiAdapter(organizationId: string): Promise<AiPort> {
  return getAiAdapterForOrg(organizationId);
}

export { listAiPlugins, getAiPlugin, DEFAULT_AI_PLUGIN_ID };

export type {
  AssignmentDraft,
  QuizDraft,
  QuizQuestionDraft,
  AiGenerateAssignmentInput,
  AiGenerateQuizInput,
  AiTutorInput,
  AiTutorMessage,
  AiTutorReply,
  AiPluginManifest,
  AiPort,
} from "@/lib/ai/types";
