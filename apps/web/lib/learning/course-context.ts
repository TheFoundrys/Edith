import { prisma } from "@/lib/db";

export type CourseLessonContext = {
  organizationId: string;
  programId: string;
  programName: string;
  programSummary: string | null;
  eligibilitySummary: string | null;
  degreeLevel: string;
  category: string;
  departmentName: string | null;
  campusName: string | null;
  syllabusTitle: string | null;
  syllabusDescription: string | null;
  syllabusOutline: string;
  modules: {
    id: string;
    title: string;
    summary: string | null;
    lessons: {
      id: string;
      title: string;
      summary: string | null;
      durationMin: number | null;
    }[];
  }[];
  lesson: {
    id: string;
    title: string;
    summary: string | null;
    contentType: string;
    contentBody: string;
    durationMin: number | null;
    moduleTitle: string;
    moduleSummary: string | null;
  } | null;
};

function buildOutline(
  modules: {
    title: string;
    summary: string | null;
    lessons: { title: string; summary: string | null }[];
  }[],
): string {
  return modules
    .map((m) => {
      const header = m.summary ? `${m.title} — ${m.summary}` : m.title;
      const lessons = m.lessons
        .map((l) =>
          l.summary ? `  - ${l.title}: ${l.summary}` : `  - ${l.title}`,
        )
        .join("\n");
      return `${header}\n${lessons}`;
    })
    .join("\n\n");
}

/** Load published course + syllabus (+ optional lesson) for AI / tutor grounding. */
export async function loadCourseLessonContext(opts: {
  programId: string;
  lessonId?: string | null;
  organizationId?: string;
}): Promise<CourseLessonContext | null> {
  const program = await prisma.program.findFirst({
    where: {
      id: opts.programId,
      ...(opts.organizationId ? { organizationId: opts.organizationId } : {}),
    },
    include: {
      department: { select: { name: true } },
      campus: { select: { name: true } },
      syllabus: {
        where: { status: "PUBLISHED" },
        include: {
          modules: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { sortOrder: "asc" },
                select: {
                  id: true,
                  title: true,
                  summary: true,
                  contentType: true,
                  contentBody: true,
                  durationMin: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!program?.syllabus) return null;

  const modules = program.syllabus.modules.filter((m) => m.lessons.length > 0);
  let lesson: CourseLessonContext["lesson"] = null;

  if (opts.lessonId) {
    for (const mod of modules) {
      const found = mod.lessons.find((l) => l.id === opts.lessonId);
      if (found) {
        lesson = {
          id: found.id,
          title: found.title,
          summary: found.summary,
          contentType: found.contentType,
          contentBody: found.contentBody,
          durationMin: found.durationMin,
          moduleTitle: mod.title,
          moduleSummary: mod.summary,
        };
        break;
      }
    }
    if (!lesson) return null;
  }

  return {
    organizationId: program.organizationId,
    programId: program.id,
    programName: program.name,
    programSummary: program.summary,
    eligibilitySummary: program.eligibilitySummary,
    degreeLevel: program.degreeLevel,
    category: program.category,
    departmentName: program.department?.name ?? null,
    campusName: program.campus?.name ?? null,
    syllabusTitle: program.syllabus.title,
    syllabusDescription: program.syllabus.description,
    syllabusOutline: buildOutline(modules),
    modules: modules.map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.summary,
      lessons: m.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        summary: l.summary,
        durationMin: l.durationMin,
      })),
    })),
    lesson,
  };
}

/** Public catalog view of published syllabus (no lesson bodies). */
export async function loadPublicCourseSyllabus(programId: string) {
  const syllabus = await prisma.programSyllabus.findFirst({
    where: { programId, status: "PUBLISHED" },
    select: {
      title: true,
      description: true,
      modules: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          summary: true,
          lessons: {
            where: { isPublished: true },
            orderBy: { sortOrder: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              durationMin: true,
              contentType: true,
            },
          },
        },
      },
    },
  });
  if (!syllabus) return null;
  return {
    ...syllabus,
    modules: syllabus.modules.filter((m) => m.lessons.length > 0),
  };
}
