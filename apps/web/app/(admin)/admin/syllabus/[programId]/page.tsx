import { notFound } from "next/navigation";
import { EngagementSeriesPanel } from "@/components/admin/engagement-series-panel";
import { SyllabusEditor } from "@/components/admin/syllabus-editor";
import { requireCapability } from "@/lib/auth/session";
import { loadCompassAdminSyllabusEditor } from "@/lib/compass/admin-syllabus-page";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { isContentProgram } from "@/lib/programs/categories";

export default async function AdminSyllabusDetailPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const session = await requireCapability("manageContent");

  if (isCompassDatabase()) {
    const compass = await loadCompassAdminSyllabusEditor(
      programId,
      session.user.organizationId,
    );
    if (!compass) notFound();
    return (
      <SyllabusEditor
        program={{
          id: compass.program.id,
          name: compass.program.name,
          slug: compass.program.slug,
        }}
        syllabus={compass.syllabus}
        simple={isContentProgram(compass.program.category)}
        lessonMcqByLessonId={{}}
        assignments={[]}
        courseMcqs={[]}
        quizzes={[]}
      />
    );
  }

  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      organizationId: session.user.organizationId,
    },
    include: {
      syllabus: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: { orderBy: { order: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!program) notFound();

  const lessonMcqs = await prisma.lessonMcq.findMany({
    where: {
      programId: program.id,
      organizationId: session.user.organizationId,
    },
    select: { id: true, lessonId: true, status: true },
  });
  const lessonMcqByLessonId = Object.fromEntries(
    lessonMcqs.map((mcq) => [mcq.lessonId, { id: mcq.id, status: mcq.status }]),
  );

  const [assignments, courseMcqs, quizzes] = await Promise.all([
    prisma.assignment.findMany({
      where: { programId: program.id, organizationId: session.user.organizationId },
      select: { id: true, title: true, isPublished: true, dueAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseMcq.findMany({
      where: { programId: program.id, organizationId: session.user.organizationId },
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quiz.findMany({
      where: { programId: program.id, organizationId: session.user.organizationId },
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const moduleCount = program.syllabus?.modules.length ?? 0;

  return (
    <div className="space-y-8">
      <EngagementSeriesPanel
        programId={program.id}
        programTitle={program.title}
        moduleCount={moduleCount}
      />
      <SyllabusEditor
        program={{ id: program.id, name: program.title, slug: program.slug }}
        syllabus={program.syllabus}
        simple={isContentProgram(program.category)}
        lessonMcqByLessonId={lessonMcqByLessonId}
        assignments={assignments}
        courseMcqs={courseMcqs.map((item) => ({
          ...item,
          title: item.title ?? "Untitled quiz",
        }))}
        quizzes={quizzes}
      />
    </div>
  );
}
