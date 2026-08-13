import { prisma } from "../repositories/prisma.js";
import type { SessionUser } from "../../shared/types/session.js";

export async function listPublishedPrograms(organizationId?: string) {
  return prisma.program.findMany({
    where: {
      status: "PUBLISHED",
      ...(organizationId ? { organizationId } : {}),
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      degreeLevel: true,
      description: true,
      imageUrl: true,
      price: true,
      tuitionCurrency: true,
      programKind: true,
      tags: true,
      level: true,
      duration: true,
    },
  });
}

export async function getProgramBySlug(slug: string) {
  return prisma.program.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      campus: true,
      department: true,
      intakes: { where: { isActive: true }, orderBy: { startDate: "asc" } },
    },
  });
}

export async function listAdminPrograms(user: SessionUser) {
  return prisma.program.findMany({
    where: { organizationId: user.organizationId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { applications: true, enrollments: true } },
    },
  });
}

export async function createProgram(
  user: SessionUser,
  data: {
    name: string;
    slug: string;
    category: string;
    degreeLevel: string;
    summary?: string;
    price?: number | null;
    tuitionCurrency?: string;
    status?: string;
  },
) {
  return prisma.program.create({
    data: {
      organizationId: user.organizationId,
      title: data.name,
      slug: data.slug,
      category: data.category as never,
      degreeLevel: data.degreeLevel as never,
      description: data.summary,
      price: data.price ?? null,
      tuitionCurrency: data.tuitionCurrency ?? "INR",
      status: (data.status as never) ?? "DRAFT",
    },
  });
}

export async function listStudentEnrollments(user: SessionUser) {
  return prisma.enrollment.findMany({
    where: { userId: user.id, organizationId: user.organizationId },
    include: {
      program: {
        select: {
          id: true,
          title: true,
          slug: true,
          imageUrl: true,
          description: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function enrollStudent(user: SessionUser, programId: string) {
  const program = await prisma.program.findFirst({
    where: {
      id: programId,
      organizationId: user.organizationId,
      status: "PUBLISHED",
    },
  });
  if (!program) return { error: "Program not found." };

  const enrollment = await prisma.enrollment.upsert({
    where: { userId_programId: { userId: user.id, programId } },
    create: {
      organizationId: user.organizationId,
      userId: user.id,
      programId,
      status: "ACTIVE",
      enrolledAt: new Date(),
    },
    update: {
      status: "ACTIVE",
      enrolledAt: new Date(),
    },
  });
  return { ok: true as const, enrollment };
}
