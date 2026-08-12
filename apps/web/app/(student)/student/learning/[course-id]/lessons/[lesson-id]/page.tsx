import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonCompleteButton } from "@/components/student/lesson-complete-button";
import { LessonTutorChat } from "@/components/student/lesson-tutor-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { loadCourseLessonContext } from "@/lib/learning/course-context";
import { renderSimpleMarkdown } from "@/lib/learning/markdown";
import { activityTypeLabel } from "@/lib/learning/standards";

function videoEmbed(url: string): { kind: "iframe"; src: string } | { kind: "link"; href: string } {
  const yt = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/,
  );
  if (yt) {
    return { kind: "iframe", src: `https://www.youtube.com/embed/${yt[1]}` };
  }
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) {
    return { kind: "iframe", src: `https://player.vimeo.com/video/${vimeo[1]}` };
  }
  return { kind: "link", href: url };
}

function LessonBody({
  contentType,
  contentBody,
}: {
  contentType: string;
  contentBody: string;
}) {
  if (!contentBody.trim()) {
    return <p className="text-sm text-fg-muted">No content for this activity yet.</p>;
  }

  if (contentType === "VIDEO_URL") {
    const embed = videoEmbed(contentBody.trim());
    if (embed.kind === "iframe") {
      return (
        <div className="aspect-video overflow-hidden rounded-[var(--radius-sm)] border border-border">
          <iframe
            title="Activity video"
            src={embed.src}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <p className="text-sm">
        <a href={embed.href} target="_blank" rel="noreferrer" className="underline">
          Open video
        </a>
      </p>
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
          contentType={lesson.contentType}
          contentBody={lesson.contentBody}
        />
      </Panel>

      <div className="mb-8">
        <LessonCompleteButton lessonId={lesson.id} completed={completed} />
      </div>

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
