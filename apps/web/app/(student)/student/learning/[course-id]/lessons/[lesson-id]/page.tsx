import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCompleteButton } from "@/components/student/lesson-complete-button";
import { LessonCompletedBadge } from "@/components/student/lesson-completed-badge";
import { LessonTutorChat } from "@/components/student/lesson-tutor-chat";
import { LessonReadingPanel } from "@/components/student/lesson-reading-panel";
import { LessonVideo } from "@/components/student/lesson-video";
import { LessonVideoEmbeds } from "@/components/student/lesson-video-embeds";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { requireActiveEnrollment } from "@/lib/enrollment/queries";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { loadCourseLessonContext } from "@/lib/learning/course-context";
import { isLessonCompleteForUser } from "@/lib/learning/progress";
import { parseLessonVideo } from "@/lib/learning/video-embed";
import { lessonPdfFileName } from "@/lib/learning/lesson-pdf";
import { LessonTypeBadge } from "@/components/learning/lesson-type-badge";
import {
  extractYouTubeUrls,
  stripYouTubeUrls,
} from "@/lib/learning/youtube-content";
import { lessonContentTypeMeta } from "@/lib/learning/lesson-content-type";
import { uploadUrl } from "@/lib/urls";

function LessonBody({
  lessonId,
  contentType,
  contentBody,
  summary,
  completed,
}: {
  lessonId: string;
  contentType: string;
  contentBody: string;
  summary: string | null;
  completed: boolean;
}) {
  if (!contentBody.trim() && !summary?.trim()) {
    return <p className="text-sm text-fg-muted">No content for this activity yet.</p>;
  }

  if (contentType === "VIDEO_URL") {
    const videoUrl = contentBody.trim();
    const video = videoUrl ? parseLessonVideo(videoUrl) : null;
    return (
      <div className="space-y-6">
        <LessonReadingPanel content={summary ?? ""} />
        {video && video.kind !== "link" ? (
          <LessonVideo
            video={video}
            lessonId={lessonId}
            completed={completed}
          />
        ) : video?.kind === "link" ? (
          <p className="text-sm">
            <a
              href={video.href}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Open video
            </a>
          </p>
        ) : null}
      </div>
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

  const embedUrls = extractYouTubeUrls(contentBody);
  const reading = stripYouTubeUrls(contentBody);

  return (
    <div className="space-y-6">
      <LessonReadingPanel content={reading} />
      <LessonVideoEmbeds
        urls={embedUrls}
        lessonId={lessonId}
        completed={completed}
      />
    </div>
  );
}

export default async function StudentLearningLessonPage({
  params,
}: {
  params: Promise<{ "course-id": string; "lesson-id": string }>;
}) {
  const { "course-id": courseId, "lesson-id": lessonId } = await params;
  const session = await requireStudent();

  const enrollment = await requireActiveEnrollment(session.user.id, courseId);
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

  const [completed, lessonQuiz] = await Promise.all([
    isLessonCompleteForUser(session.user.id, lessonId, courseId),
    !isCompassDatabase()
      ? prisma.lessonMcq.findFirst({
          where: {
            lessonId,
            programId: courseId,
            organizationId: session.user.organizationId,
            isActive: true,
            status: "READY",
          },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);
  const lesson = ctx.lesson;

  return (
    <div>
      <PageHeader
        title={lesson.title}
        description={
          lesson.summary
            ? `${lesson.summary} · ${ctx.programName} · ${lesson.moduleTitle}`
            : `${ctx.programName} · ${lesson.moduleTitle}`
        }
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
        <LessonTypeBadge contentType={lesson.contentType} />
        {lesson.durationMin != null ? (
          <span className="text-xs text-fg-muted">{lesson.durationMin} min</span>
        ) : null}
        <LessonCompletedBadge
          lessonId={lesson.id}
          initialCompleted={completed}
        />
      </div>

      <Panel className="mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              {lessonContentTypeMeta(lesson.contentType).studentAction} this activity
            </p>
            <p className="mt-0.5 text-sm text-fg-muted">
              {lessonContentTypeMeta(lesson.contentType).label}
            </p>
          </div>
          <LessonTypeBadge contentType={lesson.contentType} />
        </div>
        <LessonBody
          lessonId={lesson.id}
          contentType={lesson.contentType}
          contentBody={lesson.contentBody}
          summary={lesson.summary}
          completed={completed}
        />
      </Panel>

      {lessonQuiz ? (
        <Panel className="mb-6 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Lesson quiz</p>
            <p className="text-xs text-fg-muted">
              Randomized questions — retake anytime for a new order.
            </p>
          </div>
          <Link href={`/student/learning/${courseId}/lessons/${lessonId}/mcq`}>
            <Button size="sm">Take quiz</Button>
          </Link>
        </Panel>
      ) : null}

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
