/** Strip markdown fences and parse JSON from LLM chat content. */
export function extractJsonFromAiContent(content: string): unknown {
  let text = content.trim();
  if (!text) {
    throw new SyntaxError("AI returned empty content.");
  }

  const fence = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence) {
    text = fence[1]!.trim();
  }

  try {
    return JSON.parse(text);
  } catch {
    const objectStart = text.indexOf("{");
    const objectEnd = text.lastIndexOf("}");
    if (objectStart >= 0 && objectEnd > objectStart) {
      return JSON.parse(text.slice(objectStart, objectEnd + 1));
    }

    const arrayStart = text.indexOf("[");
    const arrayEnd = text.lastIndexOf("]");
    if (arrayStart >= 0 && arrayEnd > arrayStart) {
      return JSON.parse(text.slice(arrayStart, arrayEnd + 1));
    }

    throw new SyntaxError("Unexpected token in AI JSON response.");
  }
}
