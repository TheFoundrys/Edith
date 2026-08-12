"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
  createAssignment,
  generateAssignmentDraft,
  updateAssignment,
} from "@/lib/actions/assignments-admin";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";

type ProgramOption = { id: string; name: string };

export function AssignmentEditor({
  programs,
  assignment,
}: {
  programs: ProgramOption[];
  assignment?: {
    id: string;
    programId: string;
    title: string;
    description: string;
    dueAt: string | null;
    isPublished: boolean;
  };
}) {
  const router = useRouter();
  const [programId, setProgramId] = useState(
    assignment?.programId ?? programs[0]?.id ?? "",
  );
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [description, setDescription] = useState(assignment?.description ?? "");
  const [dueAt, setDueAt] = useState(
    assignment?.dueAt ? assignment.dueAt.slice(0, 10) : "",
  );
  const [isPublished, setIsPublished] = useState(assignment?.isPublished ?? true);
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"intro" | "intermediate" | "advanced">(
    "intro",
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [aiPending, startAi] = useTransition();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const fd = new FormData();
    fd.set("programId", programId);
    fd.set("title", title);
    fd.set("description", description);
    if (dueAt) fd.set("dueAt", dueAt);
    if (isPublished) fd.set("isPublished", "true");

    const result = assignment
      ? await updateAssignment(assignment.id, fd)
      : await createAssignment(fd);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!assignment && "id" in result && result.id) {
      router.push(`/admin/assignments/${result.id}`);
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
      const result = await generateAssignmentDraft({
        programId,
        topic: topic || undefined,
        difficulty,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (!result.ok || !result.draft) return;
      setTitle(result.draft.title);
      setDescription(result.draft.description);
      if (result.draft.dueInDays) {
        const d = new Date();
        d.setDate(d.getDate() + result.draft.dueInDays);
        setDueAt(d.toISOString().slice(0, 10));
      }
      setInfo(`Draft filled by AI plugin (${result.provider}). Review before saving.`);
    });
  }

  return (
    <div>
      <PageHeader
        title={assignment ? "Edit assignment" : "New assignment"}
        description="Create assignments manually or draft them with the AI plugin."
        actions={
          <Link href="/admin/assignments" className="text-sm text-fg-muted underline">
            All assignments
          </Link>
        }
      />

      <Panel className="mb-6 p-5 max-w-3xl space-y-3">
        <p className="text-sm font-medium">AI plugin</p>
        <p className="text-xs text-fg-muted">
          Uses the organization&apos;s active AI plugin (Admin → AI plugins).
          Drafts fill the form — nothing is saved until you click Save.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label htmlFor="ai-topic">Topic (optional)</Label>
            <Input
              id="ai-topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. supervised learning basics"
            />
          </div>
          <div>
            <Label htmlFor="ai-difficulty">Difficulty</Label>
            <Select
              id="ai-difficulty"
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
          {aiPending ? "Generating…" : "Generate draft with AI"}
        </Button>
      </Panel>

      <Panel className="p-5 max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="programId">Program / course</Label>
            <Select
              id="programId"
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
              required
              disabled={Boolean(assignment)}
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
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Instructions</Label>
            <Textarea
              id="description"
              rows={10}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueAt">Due date</Label>
              <Input
                id="dueAt"
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm mt-7">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
              />
              Published for enrolled students
            </label>
          </div>
          <FieldError>{error}</FieldError>
          {info ? <p className="text-sm text-fg-muted">{info}</p> : null}
          <Button type="submit" loading={pending}>
            {pending ? "Saving…" : "Save assignment"}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
