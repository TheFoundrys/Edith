"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createQuiz,
  generateQuizDraft,
  updateQuiz,
} from "@/lib/actions/quizzes";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

type ProgramOption = { id: string; name: string };

type QuestionDraft = {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

function emptyQuestion(): QuestionDraft {
  return {
    prompt: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
  };
}

export function QuizEditor({
  programs,
  quiz,
}: {
  programs: ProgramOption[];
  quiz?: {
    id: string;
    programId: string;
    title: string;
    description: string;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    questions: QuestionDraft[];
  };
}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(
    quiz?.programId ?? programs[0]?.id ?? "",
  );
  const [title, setTitle] = useState(quiz?.title ?? "");
  const [description, setDescription] = useState(quiz?.description ?? "");
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED" | "ARCHIVED">(
    quiz?.status ?? "DRAFT",
  );
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    quiz?.questions?.length ? quiz.questions : [emptyQuestion()],
  );
  const [topic, setTopic] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<"intro" | "intermediate" | "advanced">(
    "intro",
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [aiPending, startAi] = useTransition();

  function updateQuestion(index: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  }

  function updateOption(qIndex: number, oIndex: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = [...q.options];
        options[oIndex] = value;
        return { ...q, options };
      }),
    );
  }

  async function onSave() {
    setPending(true);
    setError(null);
    setInfo(null);
    const questionsPayload = questions.map((q) => ({
      prompt: q.prompt,
      options: q.options.filter((o) => o.trim()),
      correctIndex: q.correctIndex,
      explanation: q.explanation || undefined,
    }));
    const result = quiz
      ? await updateQuiz(quiz.id, {
          title,
          description,
          status,
          questions: questionsPayload,
        })
      : await createQuiz({
          programId,
          title,
          description,
          status: status === "ARCHIVED" ? "DRAFT" : status,
          questions: questionsPayload,
        });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!quiz && "id" in result && result.id) {
      router.push(`/admin/quizzes/${result.id}`);
      return;
    }
    setInfo("Saved.");
    router.refresh();
  }

  function runAi() {
    if (!programId) {
      setError("Select a program first.");
      return;
    }
    setError(null);
    setInfo(null);
    startAi(async () => {
      const result = await generateQuizDraft({
        programId,
        topic: topic || undefined,
        questionCount,
        difficulty,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.ok || !result.draft) return;
      setTitle(result.draft.title);
      setDescription(result.draft.description);
      setQuestions(
        result.draft.questions.map((q) => ({
          prompt: q.prompt,
          options: q.options.length >= 2 ? q.options : [...q.options, "Option B"],
          correctIndex: q.correctIndex,
          explanation: q.explanation ?? "",
        })),
      );
      setInfo(`Draft filled by AI plugin (${result.provider}). Review answers before publishing.`);
    });
  }

  return (
    <div>
      <PageHeader
        title={quiz ? "Edit quiz" : "New quiz"}
        description="Build quizzes manually or draft them with the AI plugin."
        actions={
          <Link href="/admin/quizzes" className="text-sm text-fg-muted underline">
            All quizzes
          </Link>
        }
      />

      <Panel className="mb-6 p-5 max-w-3xl space-y-3">
        <p className="text-sm font-medium">AI plugin</p>
        <p className="text-xs text-fg-muted">
          Uses the organization&apos;s active AI plugin (Admin → AI plugins).
          Generated questions fill this editor — save explicitly to persist.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="quiz-topic">Topic (optional)</Label>
            <Input
              id="quiz-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. neural networks"
            />
          </div>
          <div>
            <Label htmlFor="quiz-count">Questions</Label>
            <Input
              id="quiz-count"
              type="number"
              min={3}
              max={10}
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value) || 5)}
            />
          </div>
          <div>
            <Label htmlFor="quiz-diff">Difficulty</Label>
            <Select
              id="quiz-diff"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as "intro" | "intermediate" | "advanced")
              }
            >
              <option value="intro">Intro</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </div>
        </div>
        <Button type="button" variant="secondary" loading={aiPending} onClick={runAi}>
          {aiPending ? "Generating…" : "Generate quiz with AI"}
        </Button>
      </Panel>

      <Panel className="p-5 max-w-3xl space-y-4">
        <div>
          <Label htmlFor="programId">Program / course</Label>
          <Select
            id="programId"
            value={programId}
            onChange={(e) => setProgramId(e.target.value)}
            disabled={Boolean(quiz)}
            required
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            id="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED")
            }
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Questions</p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setQuestions((q) => [...q, emptyQuestion()])}
            >
              Add question
            </Button>
          </div>
          {questions.map((q, qi) => (
            <div key={qi} className="border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                  Question {qi + 1}
                </p>
                {questions.length > 1 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setQuestions((prev) => prev.filter((_, i) => i !== qi))
                    }
                  >
                    Remove
                  </Button>
                ) : null}
              </div>
              <Textarea
                rows={2}
                value={q.prompt}
                onChange={(e) => updateQuestion(qi, { prompt: e.target.value })}
                placeholder="Prompt"
              />
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctIndex === oi}
                      onChange={() => updateQuestion(qi, { correctIndex: oi })}
                    />
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                    />
                  </label>
                ))}
              </div>
              <Input
                value={q.explanation ?? ""}
                onChange={(e) => updateQuestion(qi, { explanation: e.target.value })}
                placeholder="Explanation (optional)"
              />
            </div>
          ))}
        </div>

        <FieldError>{error}</FieldError>
        {info ? <p className="text-sm text-fg-muted">{info}</p> : null}
        <Button type="button" loading={pending} onClick={onSave}>
          {pending ? "Saving…" : "Save quiz"}
        </Button>
      </Panel>
    </div>
  );
}
