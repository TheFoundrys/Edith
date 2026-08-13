"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createLesson,
  createModule,
  deleteLesson,
  deleteModule,
  moveLesson,
  moveModule,
  setSyllabusStatus,
  updateLesson,
  updateModule,
  upsertSyllabus,
} from "@/lib/actions/syllabus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { PageHeader, Panel } from "@/components/ui/page";
import type {
  LessonContentType,
  SyllabusStatus,
} from "@prisma/client";

type Lesson = {
  id: string;
  title: string;
  summary: string | null;
  contentType: LessonContentType;
  content: string;
  durationMin: number | null;
  order: number;
  isPublished: boolean;
};

type Module = {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  lessons: Lesson[];
};

type Syllabus = {
  id: string;
  title: string | null;
  description: string | null;
  status: SyllabusStatus;
  modules: Module[];
};

const CONTENT_TYPES: { value: LessonContentType; label: string }[] = [
  { value: "RICH_TEXT", label: "Rich text" },
  { value: "VIDEO_URL", label: "Video URL" },
  { value: "EXTERNAL_LINK", label: "External link" },
];

function statusTone(status: SyllabusStatus) {
  if (status === "PUBLISHED") return "success" as const;
  if (status === "ARCHIVED") return "neutral" as const;
  return "warning" as const;
}

export function SyllabusEditor({
  program,
  syllabus,
}: {
  program: { id: string; name: string; slug: string };
  syllabus: Syllabus | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  function refresh() {
    router.refresh();
  }

  function onSaveMeta(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await upsertSyllabus(program.id, fd);
      if (result.error) setError(result.error);
      else refresh();
    });
  }

  function changeStatus(status: SyllabusStatus) {
    startTransition(async () => {
      setError(null);
      const result = await setSyllabusStatus(program.id, status);
      if (result.error) setError(result.error);
      else refresh();
    });
  }

  function onAddModule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    startTransition(async () => {
      const result = await createModule(program.id, fd);
      if (result.error) setError(result.error);
      else {
        form.reset();
        refresh();
      }
    });
  }

  return (
    <div>
      <PageHeader
        title={syllabus?.title || `${program.name} Syllabus`}
        description={`Program /${program.slug}`}
        actions={
          <div className="flex gap-2">
            <Link href={`/admin/syllabus/${program.id}/progress`}>
              <Button variant="ghost">Progress</Button>
            </Link>
            <Link href={`/admin/programs/${program.id}`}>
              <Button variant="secondary">Program</Button>
            </Link>
            {syllabus?.status !== "PUBLISHED" ? (
              <Button
                onClick={() => changeStatus("PUBLISHED")}
                loading={pending}
                disabled={!syllabus}
              >
                Publish
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => changeStatus("DRAFT")}
                loading={pending}
              >
                Unpublish
              </Button>
            )}
            {syllabus && syllabus.status !== "ARCHIVED" ? (
              <Button
                variant="ghost"
                onClick={() => changeStatus("ARCHIVED")}
                loading={pending}
              >
                Archive
              </Button>
            ) : null}
          </div>
        }
      />

      {syllabus ? (
        <div className="mb-4">
          <Badge tone={statusTone(syllabus.status)}>{syllabus.status}</Badge>
        </div>
      ) : (
        <p className="mb-4 text-sm text-fg-muted">
          No syllabus yet — save details below to create a draft.
        </p>
      )}

      {error ? (
        <div className="mb-4">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}

      <Panel className="mb-6">
        <form onSubmit={onSaveMeta} className="space-y-4 p-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={syllabus?.title ?? `${program.name} Syllabus`}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={syllabus?.description ?? ""}
            />
          </div>
          <Button type="submit" loading={pending}>
            {pending ? "Saving…" : "Save syllabus"}
          </Button>
        </form>
      </Panel>

      {syllabus ? (
        <>
          <Panel className="mb-6">
            <form onSubmit={onAddModule} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
              <div className="flex-1">
                <Label htmlFor="moduleTitle">New section</Label>
                <Input id="moduleTitle" name="title" placeholder="Section title" required />
              </div>
              <div className="flex-1">
                <Label htmlFor="moduleSummary">Summary</Label>
                <Input id="moduleSummary" name="summary" placeholder="Optional" />
              </div>
              <Button type="submit" loading={pending}>
                {pending ? "Adding…" : "Add section"}
              </Button>
            </form>
          </Panel>

          <div className="space-y-6">
            {syllabus.modules.map((mod, modIndex) => (
              <Panel key={mod.id}>
                <div className="border-b border-border p-5">
                  <form
                    className="space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setError(null);
                      const fd = new FormData(e.currentTarget);
                      startTransition(async () => {
                        const result = await updateModule(program.id, mod.id, fd);
                        if (result.error) setError(result.error);
                        else refresh();
                      });
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                        Section {modIndex + 1}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={modIndex === 0 || pending}
                          onClick={() =>
                            startTransition(async () => {
                              await moveModule(program.id, mod.id, "up");
                              refresh();
                            })
                          }
                        >
                          Up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={
                            modIndex === syllabus.modules.length - 1 || pending
                          }
                          onClick={() =>
                            startTransition(async () => {
                              await moveModule(program.id, mod.id, "down");
                              refresh();
                            })
                          }
                        >
                          Down
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          loading={pending}
                          onClick={() =>
                            startTransition(async () => {
                              if (!confirm("Delete this section and its activities?"))
                                return;
                              setError(null);
                              const result = await deleteModule(program.id, mod.id);
                              if (result.error) setError(result.error);
                              else refresh();
                            })
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`mod-title-${mod.id}`}>Title</Label>
                      <Input
                        id={`mod-title-${mod.id}`}
                        name="title"
                        defaultValue={mod.title}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor={`mod-summary-${mod.id}`}>Summary</Label>
                      <Input
                        id={`mod-summary-${mod.id}`}
                        name="summary"
                        defaultValue={mod.summary ?? ""}
                      />
                    </div>
                    <Button type="submit" size="sm" variant="secondary" loading={pending}>
                      {pending ? "Saving…" : "Save section"}
                    </Button>
                  </form>
                </div>

                <div className="space-y-4 p-5">
                  {mod.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="rounded-[var(--radius-sm)] border border-border p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{lesson.title}</span>
                          {!lesson.isPublished ? (
                            <Badge tone="warning">Hidden</Badge>
                          ) : null}
                          <Badge tone="neutral">{lesson.contentType}</Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditingLessonId(
                                editingLessonId === lesson.id ? null : lesson.id,
                              )
                            }
                          >
                            {editingLessonId === lesson.id ? "Close" : "Edit"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={lessonIndex === 0 || pending}
                            onClick={() =>
                              startTransition(async () => {
                                await moveLesson(program.id, lesson.id, "up");
                                refresh();
                              })
                            }
                          >
                            Up
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={
                              lessonIndex === mod.lessons.length - 1 || pending
                            }
                            onClick={() =>
                              startTransition(async () => {
                                await moveLesson(program.id, lesson.id, "down");
                                refresh();
                              })
                            }
                          >
                            Down
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            loading={pending}
                            onClick={() =>
                              startTransition(async () => {
                                if (!confirm("Delete this activity?")) return;
                                setError(null);
                                const result = await deleteLesson(
                                  program.id,
                                  lesson.id,
                                );
                                if (result.error) setError(result.error);
                                else refresh();
                              })
                            }
                          >
                            Delete
                          </Button>
                        </div>
                      </div>

                      {editingLessonId === lesson.id ? (
                        <LessonForm
                          defaults={lesson}
                          onSubmit={async (fd) => {
                            setError(null);
                            const result = await updateLesson(
                              program.id,
                              lesson.id,
                              fd,
                            );
                            if (result.error) setError(result.error);
                            else {
                              setEditingLessonId(null);
                              refresh();
                            }
                          }}
                          submitLabel="Save activity"
                        />
                      ) : (
                        <p className="text-sm text-fg-muted">
                          {lesson.summary || "No summary"}
                          {lesson.durationMin != null
                            ? ` · ${lesson.durationMin} min`
                            : ""}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="rounded-[var(--radius-sm)] border border-dashed border-border p-4">
                    <p className="mb-3 text-sm font-medium">Add activity</p>
                    <LessonForm
                      onSubmit={async (fd) => {
                        setError(null);
                        const result = await createLesson(
                          program.id,
                          mod.id,
                          fd,
                        );
                        if (result.error) setError(result.error);
                        else refresh();
                      }}
                      submitLabel="Add activity"
                      resetOnSuccess
                    />
                  </div>
                </div>
              </Panel>
            ))}

            {syllabus.modules.length === 0 ? (
              <p className="text-sm text-fg-muted">
                Add a section to start building activities.
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function LessonForm({
  defaults,
  onSubmit,
  submitLabel,
  resetOnSuccess,
}: {
  defaults?: Partial<Lesson>;
  onSubmit: (fd: FormData) => Promise<void>;
  submitLabel: string;
  resetOnSuccess?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        startTransition(async () => {
          await onSubmit(fd);
          if (resetOnSuccess) form.reset();
        });
      }}
    >
      <div>
        <Label>Title</Label>
        <Input name="title" defaultValue={defaults?.title ?? ""} required />
      </div>
      <div>
        <Label>Summary</Label>
        <Input name="summary" defaultValue={defaults?.summary ?? ""} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label>Content type</Label>
          <Select
            name="contentType"
            defaultValue={defaults?.contentType ?? "RICH_TEXT"}
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Duration (minutes)</Label>
          <Input
            name="durationMin"
            type="number"
            min={0}
            defaultValue={defaults?.durationMin ?? ""}
          />
        </div>
      </div>
      <div>
        <Label>Content</Label>
        <Textarea
          name="contentBody"
          rows={5}
          placeholder="Markdown text, video URL, or external link"
          defaultValue={defaults?.content ?? ""}
        />
        <p className="mt-1 text-xs text-fg-muted">
          Rich text supports markdown (# headings, **bold**, lists, links).
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="isPublished" value="false" />
        <input
          type="checkbox"
          name="isPublished"
          defaultChecked={defaults?.isPublished ?? true}
          value="true"
        />
        Visible to enrolled students
      </label>
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
