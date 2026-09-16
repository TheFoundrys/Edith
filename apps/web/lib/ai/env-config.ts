/** Normalize OptGPT / Ollama base URL for OpenAI-compatible /v1/chat/completions. */
export function normalizeOpenAiCompatibleBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/v1")) return trimmed;
  return `${trimmed}/v1`;
}

/** Read OptGPT / Ollama defaults from env (server-only). */
export function getEnvAiPluginConfig(): Record<string, string> | null {
  const baseUrlRaw =
    process.env.OPTGPT_URL?.trim() ||
    process.env.OLLAMA_BASE_URL?.trim() ||
    process.env.OLLAMA_URL?.trim();
  const model =
    process.env.OPTGPT_MODEL?.trim() ||
    process.env.OLLAMA_MODEL?.trim() ||
    process.env.MODEL_NAME?.trim();

  if (!baseUrlRaw || !model) return null;

  const apiKey =
    process.env.OPTGPT_API_KEY?.trim() ||
    process.env.OLLAMA_API_KEY?.trim() ||
    "ollama";

  return {
    baseUrl: normalizeOpenAiCompatibleBaseUrl(baseUrlRaw),
    model,
    apiKey,
  };
}

export function hasEnvAiPluginConfig(): boolean {
  return getEnvAiPluginConfig() != null;
}
