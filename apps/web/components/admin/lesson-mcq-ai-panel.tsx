"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { generateLessonMcqWithAi } from "@/lib/actions/admin-lesson-mcq";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

export function LessonMcqAiPanel({
  mcqId,
  lessonTitle,
}: {
  mcqId: string;
  lessonTitle: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);

  function runGenerate() {
    startTransition(async () => {
      const result = await generateLessonMcqWithAi({
        mcqId,
        topic: topic.trim() || undefined,
        questionCount,
        replace: true,
      });

      if ("error" in result && result.error) {
        toast({
          title: "AI generation failed",
          description: result.error,
          tone: "danger",
        });
        return;
      }

      if ("ok" in result && result.ok) {
        toast({
          title: "Lesson quiz generated",
          description: `${result.provider}: ${result.imported} questions. Students can take it now.`,
          tone: "success",
        });
      }

      router.refresh();
    });
  }

  return (
    <Panel className="p-5 space-y-4">
      <div>
        <h2 className="font-display text-lg text-brand">Generate with AI</h2>
        <p className="mt-1 text-sm text-fg-muted leading-relaxed">
          Uses OptGPT / Ollama from server env or Admin → AI plugins. Questions
          are grounded in this lesson&apos;s title, reading, and the course
          outline, then published for students.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="lesson-ai-topic">Extra focus (optional)</Label>
          <Input
            id="lesson-ai-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={`e.g. ${lessonTitle} key takeaways`}
          />
        </div>
        <div>
          <Label htmlFor="lesson-ai-count">Questions</Label>
          <Input
            id="lesson-ai-count"
            type="number"
            min={3}
            max={15}
            value={questionCount}
            onChange={(event) =>
              setQuestionCount(Number(event.target.value) || 5)
            }
          />
        </div>
      </div>
      <Button type="button" loading={pending} onClick={runGenerate}>
        {pending ? "Generating…" : "Generate quiz with AI"}
      </Button>
    </Panel>
  );
}
