"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateEngagementSeriesWithAi } from "@/lib/actions/engagement-series";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

export function EngagementSeriesPanel({
  programId,
  programTitle,
  moduleCount,
}: {
  programId: string;
  programTitle: string;
  moduleCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [daysBetween, setDaysBetween] = useState(7);
  const [moduleQuizCount, setModuleQuizCount] = useState(5);
  const [lessonMcqCount, setLessonMcqCount] = useState(4);

  function runGenerate() {
    startTransition(async () => {
      const result = await generateEngagementSeriesWithAi({
        programId,
        daysBetweenAssignments: daysBetween,
        questionsPerModuleQuiz: moduleQuizCount,
        questionsPerLessonMcq: lessonMcqCount,
        skipExisting: true,
        includeCourseMcq: true,
        publish: true,
      });

      if ("error" in result && result.error) {
        toast({
          title: "Engagement series failed",
          description: result.error,
          tone: "danger",
        });
        return;
      }

      if ("ok" in result && result.ok) {
        const summary = [
          `${result.assignmentsCreated} assignments`,
          `${result.quizzesCreated} module quizzes`,
          `${result.lessonMcqsCreated} new lesson quizzes`,
          result.courseMcqSets ? `${result.courseMcqSets} course MCQ sets` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        toast({
          title: "Engagement content generated",
          description:
            result.errors.length > 0
              ? `${summary}. Some items failed — check syllabus content.`
              : `${summary}. Students can start immediately from Assessments.`,
          tone: result.errors.length > 0 ? "neutral" : "success",
        });
      }

      router.refresh();
    });
  }

  if (moduleCount === 0) return null;

  return (
    <Panel className="p-5 space-y-4">
      <div>
        <h2 className="font-display text-lg text-brand">Continuous engagement</h2>
        <p className="mt-1 text-sm text-fg-muted leading-relaxed">
          AI-generates a full engagement series for <strong>{programTitle}</strong>:
          weekly assignments (staggered due dates), a check-in quiz per module, a lesson
          quiz after every lesson, and 3 randomized course MCQ banks. Skips items that
          already exist.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="days-between">Days between assignments</Label>
          <Input
            id="days-between"
            type="number"
            min={1}
            max={30}
            value={daysBetween}
            onChange={(event) => setDaysBetween(Number(event.target.value) || 7)}
          />
        </div>
        <div>
          <Label htmlFor="module-quiz-count">Questions per module quiz</Label>
          <Input
            id="module-quiz-count"
            type="number"
            min={3}
            max={15}
            value={moduleQuizCount}
            onChange={(event) =>
              setModuleQuizCount(Number(event.target.value) || 5)
            }
          />
        </div>
        <div>
          <Label htmlFor="lesson-mcq-count">Questions per lesson quiz</Label>
          <Input
            id="lesson-mcq-count"
            type="number"
            min={3}
            max={10}
            value={lessonMcqCount}
            onChange={(event) => setLessonMcqCount(Number(event.target.value) || 4)}
          />
        </div>
      </div>

      <p className="text-xs text-fg-muted">
        Covers {moduleCount} module{moduleCount === 1 ? "" : "s"}. Generation uses OptGPT
        from your server env and may take several minutes.
      </p>

      <Button type="button" loading={pending} onClick={runGenerate}>
        {pending ? "Generating engagement series…" : "Generate full engagement series"}
      </Button>
    </Panel>
  );
}
