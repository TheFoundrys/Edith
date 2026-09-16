import { getAiAdapterForOrg } from "@/lib/ai";
import { quizDraftToMcqQuestions } from "@/lib/assessments/course-mcq-ai";
import type { McqQuestion } from "@/lib/assessments/mcq-types";

export async function generateMcqQuestionsWithAi(input: {
  organizationId: string;
  programName: string;
  programSummary?: string | null;
  syllabusOutline?: string | null;
  topic: string;
  questionCount: number;
  difficulty?: "intro" | "intermediate" | "advanced";
}) {
  const adapter = await getAiAdapterForOrg(input.organizationId);
  const count = Math.min(Math.max(input.questionCount, 3), 20);
  const draft = await adapter.generateQuizDraft({
    programName: input.programName,
    programSummary: input.programSummary,
    syllabusOutline: input.syllabusOutline,
    topic: input.topic,
    questionCount: count,
    difficulty: input.difficulty ?? "intro",
  });
  const questions = quizDraftToMcqQuestions(draft);
  if (questions.length === 0) {
    throw new Error("AI returned no valid questions.");
  }
  return {
    provider: adapter.provider,
    title: draft.title,
    description: draft.description,
    questions,
  };
}
