"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toggleLessonComplete } from "@/lib/actions/syllabus";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";

export function LessonCompleteButton({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        variant={completed ? "secondary" : "primary"}
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await toggleLessonComplete(lessonId);
            if (result.error) setError(result.error);
            else router.refresh();
          })
        }
      >
        {completed ? "Mark incomplete" : "Mark complete"}
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
    </div>
  );
}
