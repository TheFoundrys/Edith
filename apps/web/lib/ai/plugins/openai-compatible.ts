import { OpenAiCompatibleAdapter } from "@/lib/ai/openai";
import type { AiPlugin } from "@/lib/ai/types";

export const openAiCompatiblePlugin: AiPlugin = {
  manifest: {
    id: "openai-compatible",
    name: "OpenAI-compatible",
    description:
      "Any OpenAI Chat Completions API (OpenAI, Azure OpenAI proxy, Ollama, Groq, etc.). Configure base URL, model, and API key in Admin → AI plugins.",
    fields: [
      {
        key: "apiKey",
        label: "API key",
        type: "password",
        required: true,
        placeholder: "sk-… or provider token",
      },
      {
        key: "baseUrl",
        label: "Base URL",
        type: "url",
        required: true,
        placeholder: "https://api.openai.com/v1",
        help: "Must include the /v1 path for OpenAI-compatible servers.",
      },
      {
        key: "model",
        label: "Model",
        type: "text",
        required: true,
        placeholder: "gpt-4o-mini",
      },
    ],
  },
  create: (config) => {
    const apiKey = config.apiKey?.trim();
    const baseUrl = config.baseUrl?.trim();
    const model = config.model?.trim();
    if (!apiKey) {
      throw new Error("API key is required for the OpenAI-compatible plugin.");
    }
    if (!baseUrl) {
      throw new Error("Base URL is required for the OpenAI-compatible plugin.");
    }
    if (!model) {
      throw new Error("Model is required for the OpenAI-compatible plugin.");
    }
    return new OpenAiCompatibleAdapter({ apiKey, baseUrl, model });
  },
};
