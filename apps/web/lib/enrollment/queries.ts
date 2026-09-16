import "server-only";

import type { EnrollmentStatus, ProgramCategory } from "@prisma/client";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { loadCompassMyCourses } from "@/lib/compass/student-data";
import {
  findCompassActiveEnrollment,
  findCompassEnrollment,
  findCompassEnrollmentById,
  listCompassEnrollmentsForUser,
} from "@/lib/compass/enrollment";
import { getCompassCourseById } from "@/lib/compass/courses";
import { loadCompassModules } from "@/lib/compass/syllabus";
import { loadCompassSyllabus } from "@/lib/compass/catalog";
import { listCompassTransactionsForUser } from "@/lib/compass/transactions";
import { filterVisibleModules } from "@/lib/learning/syllabus-visible";

export type StudentEnrollmentSyllabus = {
  status: string;
  title?: string | null;
  description?: string | null;
  modules: {
    id: string;
    title: string;
    summary: string | null;
    order: number;
    lessons: {
      id: string;
      title: string;
      summary: string | null;
      contentType?: string;
      content?: string;
      durationMin: number | null;
      order: number;
      isPublished?: boolean;
      isPreview?: boolean;
      isFree?: boolean;
    }[];
  }[];
};

export type StudentEnrollmentRow = {
  id: string;
  programId: string;
  status: EnrollmentStatus;
  enrolledAt: Date | null;
  program: {
    id: string;
    title: string;
    slug: string;
    category: ProgramCategory;
    requiresCrmCallback: boolean;
    price: number | null;
    campus: { name: string } | null;
    syllabus: StudentEnrollmentSyllabus | null;
  };
  payments: { status: string }[];
};

const edithEnrollmentInclude = {
  program: {
    include: {
      campus: true,
      syllabus: {
        include: {
          modules: {
            orderBy: { order: "asc" as const },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" as const },
              },
            },
          },
        },
      },
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: { status: true },
  },
} as const;

export async function loadStudentEnrollments(
  userId: string,
  statuses: EnrollmentStatus[] = ["ACTIVE", "PENDING"],
): Promise<StudentEnrollmentRow[]> {
  if (isCompassDatabase()) {
    const rows = await loadCompassMyCourses(userId);
    return rows
      .filter((e) => statuses.includes(e.status as EnrollmentStatus))
      .map((e) => ({
        id: e.id,
        programId: e.program.id,
        status: e.status as EnrollmentStatus,
        enrolledAt: e.enrolledAt,
        program: {
          id: e.program.id,
          title: e.program.title,
          slug: e.program.slug,
          category: e.program.category,
          requiresCrmCallback: e.program.requiresCrmCallback,
          price: e.program.price,
          campus: e.program.campus,
          syllabus: e.program.syllabus,
        },
        payments: e.payments,
      }));
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { userId, status: { in: statuses } },
    include: edithEnrollmentInclude,
    orderBy: [{ status: "asc" }, { enrolledAt: "desc" }, { createdAt: "desc" }],
  });

  return enrollments.map((e) => ({
    id: e.id,
    programId: e.programId,
    status: e.status,
    enrolledAt: e.enrolledAt,
    program: {
      id: e.program.id,
      title: e.program.title,
      slug: e.program.slug,
      category: e.program.category,
      requiresCrmCallback: e.program.requiresCrmCallback,
      price: e.program.price,
      campus: e.program.campus,
      syllabus: e.program.syllabus
        ? {
            status: e.program.syllabus.status,
            title: e.program.syllabus.title,
            description: e.program.syllabus.description,
            modules: e.program.syllabus.modules,
          }
        : null,
    },
    payments: e.payments,
  }));
}

export async function requireStudentEnrollmentAccess(
  userId: string,
  programId: string,
  statuses: EnrollmentStatus[] = ["ACTIVE", "COMPLETED"],
): Promise<{ id: string; programId: string; status: EnrollmentStatus } | null> {
  if (isCompassDatabase()) {
    const enrollment = await findCompassEnrollment(userId, programId);
    if (!enrollment || !statuses.includes(enrollment.status)) return null;
    return {
      id: enrollment.id,
      programId: enrollment.programId,
      status: enrollment.status,
    };
  }

  return prisma.enrollment.findFirst({
    where: {
      userId,
      programId,
      status: { in: statuses },
    },
    select: { id: true, programId: true, status: true },
  });
}

export async function requireActiveEnrollment(
  userId: string,
  programId: string,
): Promise<{ id: string; programId: string } | null> {
  if (isCompassDatabase()) {
    const enrollment = await findCompassActiveEnrollment(userId, programId);
    return enrollment
      ? { id: enrollment.id, programId: enrollment.programId }
      : null;
  }

  const enrollment = await prisma.enrollment.findFirst({
    where: { programId, userId, status: "ACTIVE" },
    select: { id: true, programId: true },
  });
  return enrollment;
}

export type StudentSyllabusView = {
  title: string;
  description: string | null;
  programTitle: string;
  modules: StudentEnrollmentSyllabus["modules"];
};

export async function loadStudentPublishedSyllabus(
  programId: string,
): Promise<StudentSyllabusView | null> {
  if (isCompassDatabase()) {
    const [course, modules, syllabus] = await Promise.all([
      getCompassCourseById(programId),
      loadCompassModules(programId),
      loadCompassSyllabus(programId),
    ]);
    if (!course || course.status !== "PUBLISHED") return null;
    const visible = filterVisibleModules(modules);
    if (visible.length === 0 && !syllabus) return null;

    return {
      programTitle: course.title,
      title: syllabus?.title ?? course.title,
      description: syllabus?.description ?? course.description,
      modules: visible.map((mod) => ({
        id: mod.id,
        title: mod.title,
        summary: mod.summary,
        order: mod.order,
        lessons: mod.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          summary: lesson.summary,
          contentType: lesson.contentType,
          content: lesson.contentBody,
          durationMin: lesson.durationMin,
          order: lesson.order,
          isPublished: true,
        })),
      })),
    };
  }

  const syllabus = await prisma.programSyllabus.findFirst({
    where: { programId, status: "PUBLISHED" },
    include: {
      program: { select: { title: true } },
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  if (!syllabus) return null;

  return {
    programTitle: syllabus.program.title,
    title: syllabus.title ?? syllabus.program.title,
    description: syllabus.description,
    modules: filterVisibleModules(syllabus.modules),
  };
}

export async function loadEnrollmentWithPayments(
  userId: string,
  programId: string,
) {
  if (isCompassDatabase()) {
    const enrollment = await findCompassEnrollment(userId, programId);
    if (!enrollment) return null;
    const payments = await listCompassTransactionsForUser(userId, programId);
    const program = await getCompassCourseById(programId);
    if (!program) return null;
    return {
      id: enrollment.id,
      programId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      program,
      payments: payments.map((p) => ({ status: p.status })),
    };
  }

  return prisma.enrollment.findFirst({
    where: { userId, programId },
    include: {
      program: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  });
}

export type StudentEnrollmentRef = {
  id: string;
  programId: string;
  status: EnrollmentStatus;
};

export async function findStudentEnrollmentById(
  userId: string,
  enrollmentId: string,
): Promise<StudentEnrollmentRef | null> {
  if (isCompassDatabase()) {
    const enrollment = await findCompassEnrollmentById(userId, enrollmentId);
    return enrollment
      ? {
          id: enrollment.id,
          programId: enrollment.programId,
          status: enrollment.status,
        }
      : null;
  }

  return prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId },
    select: { id: true, programId: true, status: true },
  });
}

export async function findStudentEnrollment(
  userId: string,
  programId: string,
): Promise<StudentEnrollmentRef | null> {
  if (isCompassDatabase()) {
    const enrollment = await findCompassEnrollment(userId, programId);
    return enrollment
      ? {
          id: enrollment.id,
          programId: enrollment.programId,
          status: enrollment.status,
        }
      : null;
  }

  return prisma.enrollment.findUnique({
    where: { userId_programId: { userId, programId } },
    select: { id: true, programId: true, status: true },
  });
}

export async function listStudentActiveProgramIds(
  userId: string,
  organizationId?: string,
): Promise<string[]> {
  if (isCompassDatabase()) {
    const enrollments = await listCompassEnrollmentsForUser(userId, ["ACTIVE"]);
    return enrollments.map((e) => e.programId);
  }

  const rows = await prisma.enrollment.findMany({
    where: {
      userId,
      ...(organizationId ? { organizationId } : {}),
      status: "ACTIVE",
    },
    select: { programId: true },
  });
  return rows.map((row) => row.programId);
}

export async function listStudentEnrollmentsByOrg(
  userId: string,
  organizationId: string,
) {
  if (isCompassDatabase()) {
    const enrollments = await listCompassEnrollmentsForUser(userId, [
      "ACTIVE",
      "PENDING",
      "COMPLETED",
      "CANCELLED",
    ]);
    const paymentsByCourse = new Map<string, { status: string }[]>();
    for (const enrollment of enrollments) {
      const txs = await listCompassTransactionsForUser(
        userId,
        enrollment.programId,
      );
      paymentsByCourse.set(
        enrollment.programId,
        txs.map((t) => ({ status: t.status })),
      );
    }
    return enrollments.map((e) => ({
      programId: e.programId,
      status: e.status,
      payments: paymentsByCourse.get(e.programId) ?? [],
    }));
  }

  return prisma.enrollment.findMany({
    where: { userId, organizationId },
    select: {
      programId: true,
      status: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true },
      },
    },
  });
}
