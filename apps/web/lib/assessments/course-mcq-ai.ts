import type { QuizDraft } from "@/lib/ai/types";
import {
  normalizeMcqQuestion,
  type McqQuestion,
} from "@/lib/assessments/mcq-types";

export const SET_AI_PROFILES = [
  {
    difficulty: "intro" as const,
    focus: "fundamentals, definitions, and core concepts",
  },
  {
    difficulty: "intermediate" as const,
    focus: "application, scenarios, and practical judgment",
  },
  {
    difficulty: "advanced" as const,
    focus: "analysis, synthesis, and edge cases",
  },
];

export function quizDraftToMcqQuestions(draft: QuizDraft): McqQuestion[] {
  return draft.questions
    .map((question) =>
      normalizeMcqQuestion({
        prompt: question.prompt,
        options: question.options,
        correctIndex: question.correctIndex,
      }),
    )
    .filter((question): question is McqQuestion => question != null);
}

export function topicForMcqSet(input: {
  baseTopic?: string | null;
  programTitle: string;
  setNumber: number;
  setCount: number;
  focus: string;
}) {
  const base = input.baseTopic?.trim() || input.programTitle;
  return `${base} — Set ${input.setNumber} of ${input.setCount}. Focus on ${input.focus}. Questions must be unique to this set and suitable for a randomized MCQ bank.`;
}

export function lessonMcqAiTopic(input: {
  lessonTitle: string;
  extraTopic?: string;
}) {
  const extra = input.extraTopic?.trim();
  const focus = extra ? ` Focus: ${extra}.` : "";
  return `${input.lessonTitle} — short lesson-check quiz for students who just watched or read this activity.${focus} Test the ideas in the lesson content, not trivia about the platform.`;
}
