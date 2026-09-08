import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCompleteButton } from "@/components/student/lesson-complete-button";
import { LessonTutorChat } from "@/components/student/lesson-tutor-chat";
import { LessonVideo } from "@/components/student/lesson-video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadCourseLessonContext } from "@/lib/learning/course-context";
import { parseLessonVideo } from "@/lib/learning/video-embed";
import { lessonPdfFileName } from "@/lib/learning/lesson-pdf";
import { renderSimpleMarkdown } from "@/lib/learning/markdown";
import { activityTypeLabel } from "@/lib/learning/standards";
import { uploadUrl } from "@/lib/urls";

function LessonBody({
  lessonId,
  contentType,
  contentBody,
  completed,
}: {
  lessonId: string;
  contentType: string;
  contentBody: string;
  completed: boolean;
}) {
  if (!contentBody.trim()) {
    return <p className="text-sm text-fg-muted">No content for this activity yet.</p>;
  }

  if (contentType === "VIDEO_URL") {
    const video = parseLessonVideo(contentBody.trim());
    if (video.kind !== "link") {
      return (
        <LessonVideo
          video={video}
          lessonId={lessonId}
          completed={completed}
        />
      );
    }
    return (
      <p className="text-sm">
        <a href={video.href} target="_blank" rel="noreferrer" className="underline">
          Open video
        </a>
      </p>
    );
  }

  if (contentType === "PDF_FILE") {
    if (!contentBody.trim()) {
      return <p className="text-sm text-fg-muted">No PDF has been uploaded yet.</p>;
    }
    const href = uploadUrl(contentBody.trim());
    const fileName = lessonPdfFileName(contentBody.trim());
    return (
      <div className="space-y-3">
        <iframe
          title={fileName}
          src={href}
          className="h-[70vh] w-full rounded-[var(--radius-sm)] border border-border bg-bg"
        />
        <p className="text-sm">
          <a href={href} target="_blank" rel="noreferrer" className="underline">
            Download {fileName}
          </a>
        </p>
      </div>
    );
  }

  if (contentType === "EXTERNAL_LINK") {
    return (
      <p className="text-sm">
        <a
          href={contentBody.trim()}
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          Open external resource
        </a>
      </p>
    );
  }

  return (
    <div className="text-sm text-fg">{renderSimpleMarkdown(contentBody)}</div>
  );
}

export default async function StudentLearningLessonPage({
  params,
}: {
  params: Promise<{ "course-id": string; "lesson-id": string }>;
}) {
  const { "course-id": courseId, "lesson-id": lessonId } = await params;
  const session = await requireStudent();

  const enrollment = await prisma.enrollment.findFirst({
    where: {
      programId: courseId,
      userId: session.user.id,
      status: "ACTIVE",
    },
  });
  if (!enrollment) notFound();

  const ctx = await loadCourseLessonContext({
    programId: courseId,
    lessonId,
    organizationId: session.user.organizationId,
  });
  if (!ctx?.lesson) notFound();

  const flat = ctx.modules.flatMap((m) =>
    m.lessons.map((l) => ({ id: l.id, title: l.title })),
  );
  const index = flat.findIndex((a) => a.id === lessonId);
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index >= 0 && index < flat.length - 1 ? flat[index + 1] : null;

  const progress = await prisma.lessonProgress.findUnique({
    where: {
      lessonId_userId: { lessonId, userId: session.user.id },
    },
  });
  const completed = Boolean(progress?.completedAt);
  const lesson = ctx.lesson;

  return (
    <div>
      <PageHeader
        title={lesson.title}
        description={`${ctx.programName} · ${lesson.moduleTitle}`}
        actions={
          <Link
            href={`/student/learning/${courseId}`}
            className="text-sm text-fg-muted underline"
          >
            Course outline
          </Link>
        }
      />

      <Panel className="mb-6 p-4 sm:p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
          Course details
        </h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-xs text-fg-muted">Course</dt>
            <dd className="font-medium text-fg">{ctx.programName}</dd>
            {ctx.programSummary ? (
              <p className="mt-1 text-xs text-fg-muted line-clamp-3">
                {ctx.programSummary}
              </p>
            ) : null}
          </div>
          <div>
            <dt className="text-xs text-fg-muted">Module</dt>
            <dd className="font-medium text-fg">{lesson.moduleTitle}</dd>
            {lesson.moduleSummary ? (
              <p className="mt-1 text-xs text-fg-muted">{lesson.moduleSummary}</p>
            ) : null}
          </div>
          {(ctx.departmentName || ctx.campusName) && (
            <div>
              <dt className="text-xs text-fg-muted">Location</dt>
              <dd className="text-fg">
                {[ctx.departmentName, ctx.campusName].filter(Boolean).join(" · ")}
              </dd>
            </div>
          )}
          {ctx.syllabusDescription ? (
            <div className="sm:col-span-2">
              <dt className="text-xs text-fg-muted">Syllabus</dt>
              <dd className="text-fg-muted text-xs mt-1">
                {ctx.syllabusDescription}
              </dd>
            </div>
          ) : null}
        </dl>
      </Panel>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="neutral">
          Activity {index >= 0 ? index + 1 : "—"} of {flat.length}
        </Badge>
        <Badge tone="neutral">
          {activityTypeLabel(lesson.contentType)}
        </Badge>
        {lesson.durationMin != null ? (
          <span className="text-xs text-fg-muted">{lesson.durationMin} min</span>
        ) : null}
        {completed ? <Badge tone="success">Completed</Badge> : null}
      </div>

      {lesson.summary ? (
        <p className="mb-6 text-sm text-fg-muted">{lesson.summary}</p>
      ) : null}

      <Panel className="mb-6 p-5">
        <LessonBody
          lessonId={lesson.id}
          contentType={lesson.contentType}
          contentBody={lesson.contentBody}
          completed={completed}
        />
      </Panel>

      {lesson.contentType === "VIDEO_URL" ? null : (
        <div className="mb-8">
          <LessonCompleteButton lessonId={lesson.id} completed={completed} />
        </div>
      )}

      <div className="mb-8">
        <LessonTutorChat
          courseId={courseId}
          lessonId={lessonId}
          courseName={ctx.programName}
          lessonTitle={lesson.title}
          moduleTitle={lesson.moduleTitle}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {prev ? (
          <Link href={`/student/learning/${courseId}/lessons/${prev.id}`}>
            <Button variant="secondary" size="sm">
              Previous: {prev.title}
            </Button>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/student/learning/${courseId}/lessons/${next.id}`}>
            <Button size="sm">Next: {next.title}</Button>
          </Link>
        ) : (
          <Link href={`/student/learning/${courseId}`}>
            <Button variant="secondary" size="sm">
              Back to outline
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
