"use client";

import { useState, useTransition } from "react";
import { submitLessonMcqAttempt } from "@/lib/actions/lesson-mcq";
import type { McqDisplayQuestion } from "@/lib/assessments/course-mcq-paper";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";

export function LessonMcqForm({
  attemptId,
  lessonId,
  programId,
  questions,
}: {
  attemptId: string;
  lessonId: string;
  programId: string;
  questions: McqDisplayQuestion[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const fd = new FormData(event.currentTarget);
        setError(null);
        startTransition(async () => {
          const result = await submitLessonMcqAttempt(fd);
          if (result && "error" in result && result.error) {
            setError(result.error);
          }
        });
      }}
    >
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="lessonId" value={lessonId} />
      <input type="hidden" name="programId" value={programId} />
      <div className="space-y-4">
        {questions.map((question, index) => (
          <Panel key={question.id} className="p-5 space-y-3">
            <p className="text-sm font-medium">
              {index + 1}. {question.prompt}
            </p>
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={`${question.id}-${optionIndex}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <input
                    type="radio"
                    name={`answer_${question.id}`}
                    value={optionIndex}
                    required
                  />
                  {option}
                </label>
              ))}
            </div>
          </Panel>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <Button type="submit" loading={pending}>
          {pending ? "Submitting…" : "Submit quiz"}
        </Button>
        <FieldError>{error}</FieldError>
      </div>
    </form>
  );
}
