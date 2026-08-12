import { mockAiPlugin } from "@/lib/ai/plugins/mock";
import { openAiCompatiblePlugin } from "@/lib/ai/plugins/openai-compatible";
import type { AiPlugin, AiPluginManifest, AiPort } from "@/lib/ai/types";

/**
 * Register AI provider plugins here. Admins enable/configure them in the UI —
 * nothing is selected via environment variables.
 */
const REGISTERED_PLUGINS: AiPlugin[] = [mockAiPlugin, openAiCompatiblePlugin];

const byId = new Map(REGISTERED_PLUGINS.map((p) => [p.manifest.id, p]));

export function listAiPlugins(): AiPluginManifest[] {
  return REGISTERED_PLUGINS.map((p) => p.manifest);
}

export function getAiPlugin(pluginId: string): AiPlugin | undefined {
  return byId.get(pluginId);
}

export function createAiPort(
  pluginId: string,
  config: Record<string, string>,
): AiPort {
  const plugin = getAiPlugin(pluginId) ?? mockAiPlugin;
  return plugin.create(config);
}

export const DEFAULT_AI_PLUGIN_ID = mockAiPlugin.manifest.id;
