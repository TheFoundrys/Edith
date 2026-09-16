"use client";

import { FormEvent, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createAssignmentFromSyllabusAction,
  createCourseMcqFromSyllabusAction,
  createLessonMcqFromSyllabusAction,
} from "@/lib/actions/syllabus-content";
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
import { LessonTypeBadge } from "@/components/learning/lesson-type-badge";
import {
  lessonContentPreview,
  lessonContentTypeMeta,
} from "@/lib/learning/lesson-content-type";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { isStoredLessonFile } from "@/lib/learning/lesson-file";
import { splitLessonContentForEdit } from "@/lib/learning/youtube-content";
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

type ProgramAssignment = {
  id: string;
  title: string;
  isPublished: boolean;
  dueAt: Date | null;
};

type ProgramCourseMcq = {
  id: string;
  title: string;
  status: string;
};

type ProgramQuiz = {
  id: string;
  title: string;
  status: string;
};

type ContentAddKind =
  | "section"
  | "lesson"
  | "assignment"
  | "course-quiz"
  | "lesson-quiz";

const CONTENT_ADD_TABS: { id: ContentAddKind; label: string }[] = [
  { id: "section", label: "New section" },
  { id: "lesson", label: "New lesson" },
  { id: "assignment", label: "Assignment" },
  { id: "course-quiz", label: "Course quiz" },
  { id: "lesson-quiz", label: "Lesson quiz" },
];

const CONTENT_TYPES: { value: LessonContentType; label: string }[] = [
  { value: "RICH_TEXT", label: "Reading & notes (markdown)" },
  { value: "VIDEO_URL", label: "Video (YouTube / private upload)" },
  { value: "PDF_FILE", label: "PDF document" },
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
  simple = false,
  lessonMcqByLessonId = {},
  assignments = [],
  courseMcqs = [],
  quizzes = [],
}: {
  program: { id: string; name: string; slug: string };
  syllabus: Syllabus | null;
  simple?: boolean;
  lessonMcqByLessonId?: Record<string, { id: string; status: string }>;
  assignments?: ProgramAssignment[];
  courseMcqs?: ProgramCourseMcq[];
  quizzes?: ProgramQuiz[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const modules = syllabus?.modules ?? [];

  function refresh() {
    startTransition(() => router.refresh());
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
        description={
          simple
            ? "Add a section name, then a title and content (text or a YouTube URL)."
            : `Program /${program.slug}`
        }
        actions={
          <div className="flex gap-2">
            {simple ? null : (
              <Link href={`/admin/syllabus/${program.id}/progress`}>
                <Button variant="ghost">Progress</Button>
              </Link>
            )}
            <Link href={`/admin/programs/${program.id}`}>
              <Button variant="secondary">Program</Button>
            </Link>
            <Link href={`/admin/course-mcqs`}>
              <Button variant="ghost">Course MCQs</Button>
            </Link>
            <Link href={`/admin/lesson-mcqs`}>
              <Button variant="ghost">Lesson MCQs</Button>
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
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone={statusTone(syllabus.status)}>{syllabus.status}</Badge>
          {syllabus.status !== "PUBLISHED" ? (
            <p className="text-sm text-fg-muted">
              Draft — publish when ready for learners and the public course page.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mb-4 text-sm text-fg-muted">
          {simple
            ? "Add a section, then give each activity a title and content. Publish when learners should see it."
            : "Add sections and activities below. Publish when ready for learners and the public course page."}
        </p>
      )}

      {error ? (
        <div className="mb-4">
          <FieldError>{error}</FieldError>
        </div>
      ) : null}

      {simple ? null : (
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
      )}

      <ContentAddPanel
        programId={program.id}
        simple={simple}
        modules={modules}
        lessonMcqByLessonId={lessonMcqByLessonId}
        pending={pending}
        onAddModule={onAddModule}
        onCreateLesson={async (moduleId, fd) => {
          setError(null);
          const result = await createLesson(program.id, moduleId, fd);
          if (result.error) setError(result.error);
          else refresh();
        }}
        setError={setError}
      />

      <ProgramContentPanel
        programId={program.id}
        assignments={assignments}
        courseMcqs={courseMcqs}
        quizzes={quizzes}
      />

      <div className="space-y-6">
        {modules.map((mod, modIndex) => (
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
                            modIndex === modules.length - 1 || pending
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
                      <Label htmlFor={`mod-title-${mod.id}`}>
                        {simple ? "Section name" : "Title"}
                      </Label>
                      <Input
                        id={`mod-title-${mod.id}`}
                        name="title"
                        defaultValue={mod.title}
                        required
                      />
                    </div>
                    {simple ? null : (
                    <div>
                      <Label htmlFor={`mod-summary-${mod.id}`}>Summary</Label>
                      <Input
                        id={`mod-summary-${mod.id}`}
                        name="summary"
                        defaultValue={mod.summary ?? ""}
                      />
                    </div>
                    )}
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
                          {lessonMcqByLessonId[lesson.id] ? (
                            <Badge
                              tone={
                                lessonMcqByLessonId[lesson.id]!.status === "READY"
                                  ? "success"
                                  : "warning"
                              }
                            >
                              Quiz · {lessonMcqByLessonId[lesson.id]!.status}
                            </Badge>
                          ) : null}
                          <LessonTypeBadge contentType={lesson.contentType} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {lessonMcqByLessonId[lesson.id] ? (
                            <Link href={`/admin/lesson-mcqs/${lessonMcqByLessonId[lesson.id]!.id}`}>
                              <Button type="button" variant="ghost" size="sm">
                                Quiz
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              loading={pending}
                              onClick={() => {
                                const fd = new FormData();
                                fd.set("programId", program.id);
                                fd.set("lessonId", lesson.id);
                                fd.set("passingScore", "70");
                                startTransition(async () => {
                                  setError(null);
                                  const result =
                                    await createLessonMcqFromSyllabusAction(fd);
                                  if (result && "error" in result && result.error) {
                                    setError(result.error);
                                  }
                                });
                              }}
                            >
                              Add quiz
                            </Button>
                          )}
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
                        simple ? (
                          <SimpleLessonForm
                            key={lesson.id}
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
                            submitLabel="Save"
                          />
                        ) : (
                        <LessonForm
                          key={lesson.id}
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
                        )
                      ) : (
                        <div className="space-y-1.5 text-sm text-fg-muted">
                          {lesson.summary ? (
                            <p>{lesson.summary}</p>
                          ) : null}
                          <p className="text-xs">
                            <span className="font-medium text-fg">
                              {lessonContentTypeMeta(lesson.contentType).label}:
                            </span>{" "}
                            {lessonContentPreview(lesson.contentType, lesson.content)}
                          </p>
                          {lesson.durationMin != null ? (
                            <p className="text-xs">{lesson.durationMin} min</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="rounded-[var(--radius-sm)] border border-dashed border-border p-4">
                    <p className="mb-3 text-sm font-medium">
                      {simple ? "Add title and content" : "Add activity"}
                    </p>
                    {simple ? (
                      <SimpleLessonForm
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
                        submitLabel="Add"
                        resetOnSuccess
                      />
                    ) : (
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
                    )}
                  </div>
                </div>
              </Panel>
            ))}

        {modules.length === 0 ? (
          <p className="text-sm text-fg-muted">
            {simple
              ? "Add a section name to start. Then add a title and content under it."
              : "Add a section to start building activities."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function ContentAddPanel({
  programId,
  simple,
  modules,
  lessonMcqByLessonId,
  pending,
  onAddModule,
  onCreateLesson,
  setError,
}: {
  programId: string;
  simple: boolean;
  modules: Module[];
  lessonMcqByLessonId: Record<string, { id: string; status: string }>;
  pending: boolean;
  onAddModule: (e: FormEvent<HTMLFormElement>) => void;
  onCreateLesson: (moduleId: string, fd: FormData) => Promise<void>;
  setError: (value: string | null) => void;
}) {
  const [kind, setKind] = useState<ContentAddKind>("section");
  const [moduleId, setModuleId] = useState(modules[0]?.id ?? "");
  const [localPending, startTransition] = useTransition();

  useEffect(() => {
    if (!moduleId && modules[0]?.id) setModuleId(modules[0].id);
  }, [modules, moduleId]);

  const allLessons = modules.flatMap((mod) =>
    mod.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      moduleTitle: mod.title,
      hasQuiz: Boolean(lessonMcqByLessonId[lesson.id]),
    })),
  );

  const lessonsWithoutQuiz = allLessons.filter((lesson) => !lesson.hasQuiz);
  const busy = pending || localPending;

  return (
    <Panel className="mb-6 overflow-hidden">
      <div className="border-b border-border p-4">
        <p className="text-sm font-medium">Add content</p>
        <p className="mt-1 text-xs text-fg-muted">
          Sections and lessons for the syllabus, plus assignments and quizzes for
          this program.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONTENT_ADD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={cn(
                "rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition-colors",
                kind === tab.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-border text-fg-muted hover:border-brand/40",
              )}
              onClick={() => setKind(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {kind === "section" ? (
          <form
            onSubmit={onAddModule}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <Label htmlFor="moduleTitle">
                {simple ? "Section name" : "Section title"}
              </Label>
              <Input
                id="moduleTitle"
                name="title"
                placeholder={
                  simple ? "e.g. Week 1 · Python basics" : "Section title"
                }
                required
              />
            </div>
            {simple ? null : (
              <div className="flex-1">
                <Label htmlFor="moduleSummary">Summary</Label>
                <Input id="moduleSummary" name="summary" placeholder="Optional" />
              </div>
            )}
            <Button type="submit" loading={busy}>
              {busy ? "Adding…" : "Add section"}
            </Button>
          </form>
        ) : null}

        {kind === "lesson" ? (
          modules.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Add a section first, then you can add lessons under it.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="max-w-md">
                <Label htmlFor="lessonModuleId">Section</Label>
                <Select
                  id="lessonModuleId"
                  value={moduleId}
                  onChange={(event) => setModuleId(event.target.value)}
                >
                  {modules.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </Select>
              </div>
              {simple ? (
                <SimpleLessonForm
                  onSubmit={async (fd) => {
                    if (!moduleId) {
                      setError("Choose a section.");
                      return;
                    }
                    startTransition(async () => {
                      await onCreateLesson(moduleId, fd);
                    });
                  }}
                  submitLabel="Add lesson"
                  resetOnSuccess
                />
              ) : (
                <LessonForm
                  onSubmit={async (fd) => {
                    if (!moduleId) {
                      setError("Choose a section.");
                      return;
                    }
                    startTransition(async () => {
                      await onCreateLesson(moduleId, fd);
                    });
                  }}
                  submitLabel="Add lesson"
                  resetOnSuccess
                />
              )}
            </div>
          )
        ) : null}

        {kind === "assignment" ? (
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              startTransition(async () => {
                setError(null);
                const result = await createAssignmentFromSyllabusAction(fd);
                if (result && "error" in result && result.error) {
                  setError(result.error);
                }
              });
            }}
          >
            <input type="hidden" name="programId" value={programId} />
            <div>
              <Label htmlFor="assignmentTitle">Title</Label>
              <Input
                id="assignmentTitle"
                name="title"
                placeholder="Week 2 project brief"
                required
              />
            </div>
            <div>
              <Label htmlFor="assignmentDescription">Instructions</Label>
              <Textarea
                id="assignmentDescription"
                name="description"
                rows={4}
                placeholder="What students should submit"
              />
            </div>
            <div>
              <Label htmlFor="assignmentDueAt">Due date (optional)</Label>
              <Input id="assignmentDueAt" name="dueAt" type="date" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="isPublished" value="false" />
              <input
                type="checkbox"
                name="isPublished"
                defaultChecked
                value="true"
              />
              Visible to enrolled students
            </label>
            <Button type="submit" loading={busy}>
              Create assignment
            </Button>
          </form>
        ) : null}

        {kind === "course-quiz" ? (
          <form
            className="grid max-w-xl gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const fd = new FormData(event.currentTarget);
              startTransition(async () => {
                setError(null);
                const result = await createCourseMcqFromSyllabusAction(fd);
                if (result && "error" in result && result.error) {
                  setError(result.error);
                }
              });
            }}
          >
            <input type="hidden" name="programId" value={programId} />
            <input type="hidden" name="createThreeSets" value="on" />
            <div>
              <Label htmlFor="courseMcqTitle">Quiz title</Label>
              <Input
                id="courseMcqTitle"
                name="title"
                placeholder="Mid-term MCQ"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="courseMcqTotal">Questions per attempt</Label>
                <Input
                  id="courseMcqTotal"
                  name="totalQuestions"
                  type="number"
                  min={1}
                  defaultValue={10}
                />
              </div>
              <div>
                <Label htmlFor="courseMcqPass">Pass %</Label>
                <Input
                  id="courseMcqPass"
                  name="passingScore"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={70}
                />
              </div>
            </div>
            <p className="text-xs text-fg-muted">
              Opens the question bank editor to add or import questions, then
              publish when ready.
            </p>
            <Button type="submit" loading={busy}>
              Create course quiz
            </Button>
          </form>
        ) : null}

        {kind === "lesson-quiz" ? (
          allLessons.length === 0 ? (
            <p className="text-sm text-fg-muted">
              Add at least one lesson before attaching a lesson quiz.
            </p>
          ) : (
            <form
              className="grid max-w-xl gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const fd = new FormData(event.currentTarget);
                startTransition(async () => {
                  setError(null);
                  const result = await createLessonMcqFromSyllabusAction(fd);
                  if (result && "error" in result && result.error) {
                    setError(result.error);
                  }
                });
              }}
            >
              <input type="hidden" name="programId" value={programId} />
              <div>
                <Label htmlFor="lessonQuizLessonId">Lesson</Label>
                <select
                  id="lessonQuizLessonId"
                  name="lessonId"
                  required
                  className="mt-1 w-full rounded-[var(--radius-sm)] border border-border bg-bg px-3 py-2 text-sm"
                >
                  <option value="">Select lesson</option>
                  {lessonsWithoutQuiz.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.moduleTitle} · {lesson.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="lessonQuizPass">Pass %</Label>
                <Input
                  id="lessonQuizPass"
                  name="passingScore"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={70}
                />
              </div>
              {lessonsWithoutQuiz.length === 0 ? (
                <p className="text-xs text-fg-muted">
                  Every lesson already has a quiz. Open an existing quiz from the
                  lesson row below.
                </p>
              ) : (
                <Button type="submit" loading={busy} disabled={busy}>
                  Create lesson quiz
                </Button>
              )}
            </form>
          )
        ) : null}
      </div>
    </Panel>
  );
}

function ProgramContentPanel({
  programId,
  assignments,
  courseMcqs,
  quizzes,
}: {
  programId: string;
  assignments: ProgramAssignment[];
  courseMcqs: ProgramCourseMcq[];
  quizzes: ProgramQuiz[];
}) {
  const total = assignments.length + courseMcqs.length + quizzes.length;
  if (total === 0) return null;

  return (
    <Panel className="mb-6 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Program assessments</p>
          <p className="text-xs text-fg-muted">
            Assignments and quizzes linked to this program.
          </p>
        </div>
        <Link href={`/admin/quizzes/new?programId=${programId}`}>
          <Button variant="ghost" size="sm">
            New scored quiz
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Assignments ({assignments.length})
          </p>
          {assignments.length === 0 ? (
            <p className="text-sm text-fg-muted">None yet</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {assignments.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/assignments/${item.id}`}
                    className="truncate underline"
                  >
                    {item.title}
                  </Link>
                  <Badge tone={item.isPublished ? "success" : "warning"}>
                    {item.isPublished ? "Live" : "Draft"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Course quizzes ({courseMcqs.length})
          </p>
          {courseMcqs.length === 0 ? (
            <p className="text-sm text-fg-muted">None yet</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {courseMcqs.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/course-mcqs/${item.id}`}
                    className="truncate underline"
                  >
                    {item.title}
                  </Link>
                  <Badge tone={item.status === "READY" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">
            Scored quizzes ({quizzes.length})
          </p>
          {quizzes.length === 0 ? (
            <p className="text-sm text-fg-muted">None yet</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {quizzes.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <Link
                    href={`/admin/quizzes/${item.id}`}
                    className="truncate underline"
                  >
                    {item.title}
                  </Link>
                  <Badge tone={item.status === "PUBLISHED" ? "success" : "warning"}>
                    {item.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Panel>
  );
}

function SimpleLessonForm({
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
  const initialKind =
    defaults?.contentType === "VIDEO_URL" ? "VIDEO_URL" : "RICH_TEXT";
  const [contentKind, setContentKind] = useState<"RICH_TEXT" | "VIDEO_URL">(
    initialKind,
  );
  const existingPrivateVideo =
    defaults?.contentType === "VIDEO_URL" &&
    isStoredLessonFile(defaults.content ?? "")
      ? defaults.content
      : "";
  const richDefaults =
    defaults?.contentType === "RICH_TEXT" && defaults.content
      ? splitLessonContentForEdit(defaults.content)
      : { reading: "", videoUrl: "" };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        fd.set("contentType", contentKind);
        fd.set("isPublished", "true");
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
        <Label>Activity type</Label>
        <div className="mt-1 flex flex-wrap gap-2">
          {(
            [
              ["RICH_TEXT", "Reading & notes"],
              ["VIDEO_URL", "Video lesson"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setContentKind(value)}
              className={cn(
                "rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition",
                contentKind === value
                  ? "border-brand bg-bg-elevated font-medium text-brand"
                  : "border-border text-fg-muted hover:border-border-strong",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-fg-muted">
          {lessonContentTypeMeta(contentKind).adminHint}
        </p>
        <input type="hidden" name="contentType" value={contentKind} />
      </div>
      {contentKind === "RICH_TEXT" ? (
        <div className="space-y-3">
          <div>
            <Label>Reading content (markdown)</Label>
            <Textarea
              name="contentBody"
              rows={8}
              placeholder="# Lesson title&#10;&#10;Explain what students should learn. You can include lists, **bold**, and links."
              defaultValue={richDefaults.reading}
            />
          </div>
          <div>
            <Label>Embedded video URL (optional)</Label>
            <Input
              name="videoUrl"
              placeholder="https://www.youtube.com/watch?v=…"
              defaultValue={richDefaults.videoUrl}
            />
            <p className="mt-1 text-xs text-fg-muted">
              YouTube or Vimeo link shown as a player below the reading text.
              Kept separate so editing the text does not remove the video.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <Label>YouTube or Vimeo URL</Label>
            <Textarea
              name="contentBody"
              rows={3}
              placeholder="https://www.youtube.com/watch?v=…"
              defaultValue={existingPrivateVideo ? "" : defaults?.content ?? ""}
            />
            <p className="mt-1 text-xs text-fg-muted">
              Embeds as a watchable video. Public or unlisted YouTube links can
              still be opened outside Edith.
            </p>
          </div>
          <div>
            <Label>Or upload a private video</Label>
            <Input
              name="video"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
            />
            <p className="mt-1 text-xs text-fg-muted">
              MP4, WebM or MOV · max 200 MB · enrolled students only.
              {existingPrivateVideo
                ? ` Current file: ${existingPrivateVideo.split("/").pop()}.`
                : ""}
            </p>
          </div>
        </div>
      )}
      <Button type="submit" size="sm" loading={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
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
  const [contentType, setContentType] = useState<LessonContentType>(
    defaults?.contentType ?? "RICH_TEXT",
  );
  const existingPdf =
    defaults?.contentType === "PDF_FILE" ? defaults.content : "";
  const existingPrivateVideo =
    defaults?.contentType === "VIDEO_URL" &&
    isStoredLessonFile(defaults.content ?? "")
      ? defaults.content
      : "";
  const richDefaults =
    defaults?.contentType === "RICH_TEXT" && defaults.content
      ? splitLessonContentForEdit(defaults.content)
      : { reading: "", videoUrl: "" };

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
            value={contentType}
            onChange={(event) =>
              setContentType(event.target.value as LessonContentType)
            }
          >
            {CONTENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-fg-muted">
            {lessonContentTypeMeta(contentType).adminHint}
          </p>
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
      {contentType === "PDF_FILE" ? (
        <div>
          <Label>PDF</Label>
          <Input name="pdf" type="file" accept="application/pdf,.pdf" />
          {existingPdf ? (
            <p className="mt-1 text-xs text-fg-muted">
              Current file: {existingPdf.split("/").pop()}. Leave empty to keep
              it, or choose a new PDF to replace it.
            </p>
          ) : (
            <p className="mt-1 text-xs text-fg-muted">
              Enrolled students can read the PDF in the activity. Max 25 MB.
            </p>
          )}
        </div>
      ) : contentType === "VIDEO_URL" ? (
        <div className="space-y-3">
          <div>
            <Label>YouTube or Vimeo URL</Label>
            <Textarea
              name="contentBody"
              rows={3}
              placeholder="https://www.youtube.com/watch?v=…"
              defaultValue={existingPrivateVideo ? "" : defaults?.content ?? ""}
            />
            <p className="mt-1 text-xs text-fg-muted">
              Unlisted or public YouTube links can be copied and watched
              outside Edith.
            </p>
          </div>
          <div>
            <Label>Or upload a private video</Label>
            <Input
              name="video"
              type="file"
              accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
            />
            {existingPrivateVideo ? (
              <p className="mt-1 text-xs text-fg-muted">
                Current file: {existingPrivateVideo.split("/").pop()}. Leave
                empty to keep it, or choose a new file to replace it.
              </p>
            ) : (
              <p className="mt-1 text-xs text-fg-muted">
                MP4, WebM or MOV. Max 200 MB. Playback requires login and an
                active enrolment — sharing the file URL does not make it
                public.
              </p>
            )}
          </div>
        </div>
      ) : contentType === "RICH_TEXT" ? (
        <div className="space-y-3">
          <div>
            <Label>Reading content (markdown)</Label>
            <Textarea
              name="contentBody"
              rows={8}
              placeholder="Markdown text for this activity"
              defaultValue={richDefaults.reading}
            />
          </div>
          <div>
            <Label>Embedded video URL (optional)</Label>
            <Input
              name="videoUrl"
              placeholder="https://www.youtube.com/watch?v=…"
              defaultValue={richDefaults.videoUrl}
            />
            <p className="mt-1 text-xs text-fg-muted">
              Shown as a player below the reading text. Saved separately from
              the markdown body.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <Label>Content</Label>
          <Textarea
            name="contentBody"
            rows={5}
            placeholder="https://…"
            defaultValue={
              defaults?.contentType === contentType ? defaults.content ?? "" : ""
            }
          />
        </div>
      )}
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
