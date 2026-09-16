"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleLessonComplete } from "@/lib/actions/syllabus";
import { notifyLessonCompleted } from "@/lib/learning/lesson-completion";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

export function LessonCompleteButton({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [locallyCompleted, setLocallyCompleted] = useState(completed);

  useEffect(() => {
    setLocallyCompleted(completed);
  }, [completed]);

  const showingCompleted = locallyCompleted;

  return (
    <div className="space-y-2">
      <Button
        variant={showingCompleted ? "secondary" : "primary"}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await toggleLessonComplete(lessonId);
            if (result.error) {
              setError(result.error);
              return;
            }
            if (!showingCompleted) {
              setLocallyCompleted(true);
              notifyLessonCompleted(lessonId);
            } else {
              setLocallyCompleted(false);
            }
          })
        }
      >
        {showingCompleted ? "Mark incomplete" : "Mark complete"}
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
