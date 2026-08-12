import type { AiPlugin } from "@/lib/ai/types";
import { MockAiAdapter } from "@/lib/ai/mock";

export const mockAiPlugin: AiPlugin = {
  manifest: {
    id: "mock",
    name: "Mock (offline)",
    description:
      "Deterministic local drafts for development. No API key or network required.",
    fields: [],
  },
  create: () => new MockAiAdapter(),
};
