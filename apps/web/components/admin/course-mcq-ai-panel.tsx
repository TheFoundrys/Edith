"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  generateCourseMcqWithAi,
  generateProgramMcqSetsWithAi,
} from "@/lib/actions/admin-course-mcq";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Panel } from "@/components/ui/page";
import { useToast } from "@/components/ui/toast";

export function CourseMcqAiPanel({
  mode,
  mcqId,
  programId,
  setNumber,
  programTitle,
}: {
  mode: "set" | "program";
  mcqId?: string;
  programId?: string;
  setNumber?: number;
  programTitle?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(10);

  function runGenerate() {
    startTransition(async () => {
      const result =
        mode === "program" && programId
          ? await generateProgramMcqSetsWithAi({
              programId,
              topic: topic.trim() || undefined,
              questionCount,
              createMissingSets: true,
            })
          : mcqId
            ? await generateCourseMcqWithAi({
                mcqId,
                topic: topic.trim() || undefined,
                questionCount,
                replace: true,
              })
            : { error: "Missing MCQ context." };

      if ("error" in result && result.error) {
        toast({
          title: "AI generation failed",
          description: result.error,
          tone: "danger",
        });
        return;
      }

      if ("ok" in result && result.ok && "sets" in result) {
        toast({
          title: "Generated 3 MCQ sets",
          description: `${result.provider}: ${result.sets
            .map((row) => `Set ${row.setNumber} (${row.imported} questions)`)
            .join(" · ")}. Review and publish each set.`,
          tone: "success",
        });
      } else if ("ok" in result && result.ok && "imported" in result) {
        toast({
          title: "Questions generated",
          description: `${result.provider}: ${result.imported} questions added (${result.total} in bank). Publish when ready.`,
          tone: "success",
        });
      }

      router.refresh();
    });
  }

  const Wrapper = mode === "program" ? "div" : Panel;
  const wrapperClass =
    mode === "program" ? "space-y-4" : "p-5 space-y-4";

  return (
    <Wrapper className={wrapperClass}>
      <div>
        <h2 className="font-display text-lg text-brand">Generate with AI</h2>
        <p className="mt-1 text-sm text-fg-muted leading-relaxed">
          Uses OptGPT / Ollama from your server env (
          <code className="text-xs">OPTGPT_URL</code>,{" "}
          <code className="text-xs">MODEL_NAME</code>) or Admin → AI plugins.
          {mode === "program"
            ? " Creates or fills all 3 sets with different focus areas, then students get a random set each attempt."
            : setNumber
              ? ` Fills Set ${setNumber} only.`
              : " Fills this bank."}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="ai-topic">Topic (optional)</Label>
          <Input
            id="ai-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={
              programTitle
                ? `e.g. ${programTitle} mid-term`
                : "Course topic or module focus"
            }
          />
        </div>
        <div>
          <Label htmlFor="ai-count">Questions per set</Label>
          <Input
            id="ai-count"
            type="number"
            min={3}
            max={20}
            value={questionCount}
            onChange={(event) =>
              setQuestionCount(Number(event.target.value) || 10)
            }
          />
        </div>
      </div>

      <Button type="button" loading={pending} onClick={runGenerate}>
        {pending
          ? "Generating…"
          : mode === "program"
            ? "Generate 3 AI sets"
            : "Generate questions with AI"}
      </Button>
    </Wrapper>
  );
}
