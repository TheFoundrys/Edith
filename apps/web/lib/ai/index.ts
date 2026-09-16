import "server-only";

import { getEnvAiPluginConfig } from "@/lib/ai/env-config";
import {
  createAiPort,
  DEFAULT_AI_PLUGIN_ID,
  getAiPlugin,
  listAiPlugins,
} from "@/lib/ai/plugins/registry";
import type { AiPort } from "@/lib/ai/types";
import { prisma } from "@/lib/db";
import { isCompassDatabase, isMissingPrismaTable } from "@/lib/db/profile";
import { decryptConfig } from "@/lib/security/encrypted-config";

export type OrgAiPluginState = {
  pluginId: string;
  enabled: boolean;
  config: Record<string, string>;
  providerLabel: string;
};

function parseConfig(configJson: string): Record<string, string> {
  const raw = decryptConfig(configJson) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string") out[k] = v;
    else if (v != null) out[k] = String(v);
  }
  return out;
}

const OPENAI_COMPATIBLE_PLUGIN_ID = "openai-compatible";

function isCompleteOpenAiConfig(config: Record<string, string>) {
  return Boolean(config.baseUrl?.trim() && config.model?.trim());
}

function envAiPluginState(): OrgAiPluginState | null {
  const config = getEnvAiPluginConfig();
  if (!config) return null;
  const plugin = getAiPlugin(OPENAI_COMPATIBLE_PLUGIN_ID);
  return {
    pluginId: OPENAI_COMPATIBLE_PLUGIN_ID,
    enabled: true,
    config,
    providerLabel: plugin?.manifest.name ?? "OptGPT / Ollama (env)",
  };
}

function defaultAiPluginState(): OrgAiPluginState {
  return envAiPluginState() ?? {
    pluginId: DEFAULT_AI_PLUGIN_ID,
    enabled: true,
    config: {},
    providerLabel:
      getAiPlugin(DEFAULT_AI_PLUGIN_ID)?.manifest.name ?? DEFAULT_AI_PLUGIN_ID,
  };
}

function mergeOpenAiConfig(
  stored: Record<string, string>,
  env: Record<string, string>,
): Record<string, string> {
  return {
    apiKey: stored.apiKey?.trim() || env.apiKey,
    baseUrl: stored.baseUrl?.trim() || env.baseUrl,
    model: stored.model?.trim() || env.model,
  };
}

export async function getOrgAiPluginState(
  organizationId: string,
): Promise<OrgAiPluginState> {
  if (isCompassDatabase()) return defaultAiPluginState();

  try {
    const row = await prisma.aiPluginSetting.findUnique({
      where: { organizationId },
    });
    const envState = envAiPluginState();
    const storedConfig = parseConfig(row?.configJson ?? "{}");
    const pluginId = row?.pluginId || envState?.pluginId || DEFAULT_AI_PLUGIN_ID;

    if (
      pluginId === OPENAI_COMPATIBLE_PLUGIN_ID &&
      isCompleteOpenAiConfig(storedConfig)
    ) {
      const plugin = getAiPlugin(pluginId);
      return {
        pluginId,
        enabled: row?.enabled ?? true,
        config: storedConfig,
        providerLabel: plugin?.manifest.name ?? pluginId,
      };
    }

    if (envState) {
      const plugin = getAiPlugin(envState.pluginId);
      return {
        pluginId: envState.pluginId,
        enabled: row?.enabled ?? envState.enabled,
        config: mergeOpenAiConfig(storedConfig, envState.config),
        providerLabel: plugin?.manifest.name ?? envState.providerLabel,
      };
    }

    const plugin = getAiPlugin(pluginId);
    return {
      pluginId,
      enabled: row?.enabled ?? true,
      config: storedConfig,
      providerLabel: plugin?.manifest.name ?? pluginId,
    };
  } catch (error) {
    if (isMissingPrismaTable(error, "AiPluginSetting")) {
      return defaultAiPluginState();
    }
    throw error;
  }
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
