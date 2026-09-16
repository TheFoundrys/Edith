import assert from "node:assert/strict";
import test from "node:test";
import { extractJsonFromAiContent } from "@/lib/ai/parse-json-content";

const optGptSample = `


\`\`\`json
{
  "title": "Planets Quiz",
  "description": "Test your knowledge about planets and their features.",
  "questions": [
    {
      "question": {
        "prompt": "What is the largest mountain on Mercury?",
        "options": ["Crater", "Mantle plume", "Valley", "Hill of Mauna Kea"],
        "correctIndex": 2
      }
    }
  ]
}
\`\`\``;

test("extractJsonFromAiContent strips markdown fences", () => {
  const parsed = extractJsonFromAiContent(optGptSample) as {
    title?: string;
    questions?: unknown[];
  };
  assert.equal(parsed.title, "Planets Quiz");
  assert.equal(parsed.questions?.length, 1);
});

test("extractJsonFromAiContent parses bare JSON", () => {
  const parsed = extractJsonFromAiContent('{"title":"Quiz"}') as { title?: string };
  assert.equal(parsed.title, "Quiz");
});
