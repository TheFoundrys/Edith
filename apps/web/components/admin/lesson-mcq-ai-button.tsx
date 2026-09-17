"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { generateLessonMcqForLessonWithAi } from "@/lib/actions/admin-lesson-mcq";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function LessonMcqAiButton({
  lessonId,
  hasQuiz,
}: {
  lessonId: string;
  hasQuiz: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      loading={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await generateLessonMcqForLessonWithAi({
            lessonId,
            questionCount: 5,
          });
          if ("error" in result && result.error) {
            toast({
              title: "AI quiz failed",
              description: result.error,
              tone: "danger",
            });
            return;
          }
          if ("ok" in result && result.ok) {
            toast({
              title: hasQuiz ? "Quiz regenerated" : "AI quiz ready",
              description: `${result.imported} questions published for this lesson.`,
              tone: "success",
            });
          }
          router.refresh();
        });
      }}
    >
      {pending ? "Generating…" : hasQuiz ? "Regenerate AI quiz" : "AI quiz"}
    </Button>
  );
}
