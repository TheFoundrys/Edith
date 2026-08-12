import type {
  AiGenerateAssignmentInput,
  AiGenerateQuizInput,
  AiPort,
  AiTutorInput,
  AiTutorReply,
  AssignmentDraft,
  QuizDraft,
  QuizQuestionDraft,
} from "@/lib/ai/types";

type OpenAiConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

async function chatJson<T>(
  config: OpenAiConfig,
  system: string,
  user: string,
): Promise<T> {
  const res = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI provider error (${res.status}): ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI provider returned an empty response.");
  return JSON.parse(content) as T;
}

function normalizeAssignment(raw: Partial<AssignmentDraft>): AssignmentDraft {
  return {
    title: String(raw.title ?? "Untitled assignment").slice(0, 120),
    description: String(raw.description ?? ""),
    dueInDays:
      typeof raw.dueInDays === "number" && raw.dueInDays > 0
        ? Math.min(raw.dueInDays, 90)
        : 14,
  };
}

function normalizeQuiz(raw: Partial<QuizDraft>): QuizDraft {
  const questions = Array.isArray(raw.questions) ? raw.questions : [];
  const normalized: QuizQuestionDraft[] = questions.slice(0, 12).map((q) => {
    const options = Array.isArray(q.options)
      ? q.options.map((o) => String(o)).filter(Boolean).slice(0, 6)
      : [];
    while (options.length < 2) options.push(`Option ${options.length + 1}`);
    const correctIndex =
      typeof q.correctIndex === "number" &&
      q.correctIndex >= 0 &&
      q.correctIndex < options.length
        ? q.correctIndex
        : 0;
    return {
      prompt: String(q.prompt ?? "Untitled question"),
      options,
      correctIndex,
      explanation: q.explanation ? String(q.explanation) : undefined,
    };
  });

  if (normalized.length === 0) {
    normalized.push({
      prompt: "Placeholder question — edit before publishing",
      options: ["Correct", "Incorrect"],
      correctIndex: 0,
    });
  }

  return {
    title: String(raw.title ?? "Untitled quiz").slice(0, 120),
    description: String(raw.description ?? ""),
    questions: normalized,
  };
}

export class OpenAiCompatibleAdapter implements AiPort {
  readonly provider = "openai-compatible";

  constructor(private readonly config: OpenAiConfig) {}

  async generateAssignmentDraft(
    input: AiGenerateAssignmentInput,
  ): Promise<AssignmentDraft> {
    const raw = await chatJson<Partial<AssignmentDraft>>(
      this.config,
      "You are an instructional designer. Return JSON only with keys: title, description, dueInDays (number or null).",
      JSON.stringify({
        task: "Draft a student assignment",
        programName: input.programName,
        programSummary: input.programSummary,
        syllabusOutline: input.syllabusOutline,
        topic: input.topic,
        difficulty: input.difficulty ?? "intro",
      }),
    );
    return normalizeAssignment(raw);
  }

  async generateQuizDraft(input: AiGenerateQuizInput): Promise<QuizDraft> {
    const count = Math.min(Math.max(input.questionCount ?? 5, 3), 10);
    const raw = await chatJson<Partial<QuizDraft>>(
      this.config,
      `You are an assessment designer. Return JSON only with keys: title, description, questions[]. Each question needs prompt, options (4 strings), correctIndex (0-based), optional explanation. Exactly ${count} questions.`,
      JSON.stringify({
        task: "Draft a multiple-choice quiz",
        programName: input.programName,
        programSummary: input.programSummary,
        syllabusOutline: input.syllabusOutline,
        topic: input.topic,
        difficulty: input.difficulty ?? "intro",
        questionCount: count,
      }),
    );
    return normalizeQuiz(raw);
  }

  async tutorReply(input: AiTutorInput): Promise<AiTutorReply> {
    const history = input.messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const res = await fetch(
      `${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: [
                "You are a helpful course tutor for enrolled students.",
                "Answer only using the provided course and lesson details.",
                "If the answer is not in the material, say what is missing and suggest what to re-read.",
                "Keep replies concise (under ~180 words). Use plain language.",
                "",
                "Course context (JSON):",
                JSON.stringify({
                  programName: input.programName,
                  programSummary: input.programSummary,
                  syllabusOutline: input.syllabusOutline,
                  moduleTitle: input.moduleTitle,
                  moduleSummary: input.moduleSummary,
                  lessonTitle: input.lessonTitle,
                  lessonSummary: input.lessonSummary,
                  lessonContentType: input.lessonContentType,
                  lessonContentExcerpt: input.lessonContentExcerpt,
                }),
              ].join("\n"),
            },
            ...history,
          ],
        }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`AI provider error (${res.status}): ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data.choices?.[0]?.message?.content?.trim();
    if (!reply) throw new Error("AI provider returned an empty tutor reply.");
    return { reply };
  }
}
