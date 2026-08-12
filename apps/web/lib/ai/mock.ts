import type {
  AiGenerateAssignmentInput,
  AiGenerateQuizInput,
  AiPort,
  AiTutorInput,
  AiTutorReply,
  AssignmentDraft,
  QuizDraft,
} from "@/lib/ai/types";

function topicLabel(input: { topic?: string | null; programName: string }) {
  return input.topic?.trim() || input.programName;
}

export class MockAiAdapter implements AiPort {
  readonly provider = "mock";

  async generateAssignmentDraft(
    input: AiGenerateAssignmentInput,
  ): Promise<AssignmentDraft> {
    const topic = topicLabel(input);
    const level = input.difficulty ?? "intro";
    return {
      title: `${topic}: applied reflection`,
      description: [
        `Write a practical reflection on ${topic} (${level} level).`,
        "",
        "Include:",
        "1. What problem you are solving",
        "2. The approach or tools you would use",
        "3. One risk or limitation and how you would mitigate it",
        "",
        input.syllabusOutline
          ? `Reference course themes where relevant:\n${input.syllabusOutline.slice(0, 600)}`
          : "Draw on concepts from the published course outline.",
        "",
        "Aim for 250–400 words.",
      ].join("\n"),
      dueInDays: 14,
    };
  }

  async generateQuizDraft(input: AiGenerateQuizInput): Promise<QuizDraft> {
    const topic = topicLabel(input);
    const count = Math.min(Math.max(input.questionCount ?? 5, 3), 10);
    const questions = Array.from({ length: count }, (_, i) => {
      const n = i + 1;
      return {
        prompt: `Q${n}. Which statement best describes ${topic}?`,
        options: [
          `A core concept of ${topic} applied correctly`,
          `An unrelated marketing claim`,
          `A deprecated practice with no relevance`,
          `A random numeric constant`,
        ],
        correctIndex: 0,
        explanation: `The first option aligns with ${topic} fundamentals (${input.difficulty ?? "intro"}).`,
      };
    });

    return {
      title: `${topic} knowledge check`,
      description: `Auto-drafted quiz for ${input.programName}. Review answers before publishing.`,
      questions,
    };
  }

  async tutorReply(input: AiTutorInput): Promise<AiTutorReply> {
    const lastUser =
      [...input.messages].reverse().find((m) => m.role === "user")?.content ??
      "";
    const lesson = input.lessonTitle || "this activity";
    const course = input.programName;
    const snippet = (input.lessonContentExcerpt || input.lessonSummary || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 280);

    return {
      reply: [
        `Looking at **${lesson}** in ${course}:`,
        "",
        snippet
          ? `From the course material: “${snippet}${snippet.length >= 280 ? "…" : ""}”`
          : "I don’t have lesson body text yet — ask about the module outline or wait for content to be published.",
        "",
        lastUser
          ? `On your question (“${lastUser.slice(0, 160)}${lastUser.length > 160 ? "…" : ""}”): focus on the ideas above and how they connect to ${input.moduleTitle || "this module"}.`
          : "Ask anything about this lesson and I’ll answer using the course details.",
        "",
        input.syllabusOutline
          ? `_Course outline context is loaded from the published syllabus._`
          : "",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }
}
