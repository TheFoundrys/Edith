import type { SessionUser } from "../../shared/types/session.js";
import { prisma } from "../repositories/prisma.js";

export async function listAnnouncements(orgId: string, forStudent = false) {
  return prisma.announcement.findMany({
    where: {
      organizationId: orgId,
      ...(forStudent ? { publishedAt: { not: null } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createAnnouncement(
  user: SessionUser,
  data: { title: string; body: string; priority?: string },
) {
  return prisma.announcement.create({
    data: {
      organizationId: user.organizationId,
      authorId: user.id,
      title: data.title,
      content: data.body,
      priority: (data.priority as never) ?? "INFO",
      publishedAt: new Date(),
    },
  });
}

export async function listCoupons(orgId: string) {
  return prisma.coupon.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCoupon(
  user: SessionUser,
  data: {
    code: string;
    type?: string;
    value: number;
    expiresAt: string;
    maxUses?: number;
  },
) {
  return prisma.coupon.create({
    data: {
      organizationId: user.organizationId,
      code: data.code.toUpperCase(),
      type: (data.type as never) ?? "PERCENTAGE",
      value: data.value,
      expiresAt: new Date(data.expiresAt),
      maxUses: data.maxUses ?? 0,
      createdBy: user.id,
    },
  });
}

export async function listTickets(user: SessionUser, staff: boolean) {
  return prisma.ticket.findMany({
    where: {
      organizationId: user.organizationId,
      ...(staff ? {} : { userId: user.id }),
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createTicket(
  user: SessionUser,
  data: { subject: string; category?: string; priority?: string },
) {
  return prisma.ticket.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      subject: data.subject,
      category: (data.category as never) ?? "OTHER",
      priority: (data.priority as never) ?? "MEDIUM",
    },
  });
}

export async function getTicket(user: SessionUser, id: string, staff: boolean) {
  return prisma.ticket.findFirst({
    where: {
      id,
      organizationId: user.organizationId,
      ...(staff ? {} : { userId: user.id }),
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, name: true } } },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });
}

export async function addTicketMessage(
  user: SessionUser,
  ticketId: string,
  content: string,
  isStaff: boolean,
) {
  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      organizationId: user.organizationId,
      ...(isStaff ? {} : { userId: user.id }),
    },
  });
  if (!ticket) return { error: "Ticket not found." };

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      userId: user.id,
      senderId: user.id,
      content,
      message: content,
      isStaff,
      isAdmin: isStaff,
    },
  });
  return { ok: true as const };
}

export async function listBadges(orgId: string) {
  return prisma.badge.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function createBadge(
  user: SessionUser,
  data: { name: string; description?: string; iconUrl?: string },
) {
  const slug = data.name.toLowerCase().replace(/\s+/g, "-");
  return prisma.badge.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      slug,
      description: data.description ?? null,
      iconUrl: data.iconUrl ?? null,
      icon: data.iconUrl ?? "",
    },
  });
}

export async function listForumCategories(orgId: string) {
  return prisma.forumCategory.findMany({
    where: { organizationId: orgId },
    include: { _count: { select: { threads: true } } },
    orderBy: { order: "asc" },
  });
}

export async function createForumCategory(
  user: SessionUser,
  data: { name: string; slug: string; description?: string },
) {
  return prisma.forumCategory.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
    },
  });
}

export async function getPaymentSettings(orgId: string) {
  return prisma.paymentSettings.findUnique({
    where: { organizationId: orgId },
  });
}

export async function upsertPaymentSettings(
  user: SessionUser,
  data: {
    currency?: string;
    gstPercent?: number;
    convenienceFeePercent?: number;
    razorpayEnabled?: boolean;
    stripeEnabled?: boolean;
    enabled?: boolean;
    upiId?: string;
    basePrice?: number;
  },
) {
  return prisma.paymentSettings.upsert({
    where: { organizationId: user.organizationId },
    create: {
      organizationId: user.organizationId,
      currency: data.currency ?? "INR",
      gstPercent: data.gstPercent ?? 18,
      convenienceFeePercent: data.convenienceFeePercent ?? 0,
      razorpayEnabled: data.razorpayEnabled ?? false,
      stripeEnabled: data.stripeEnabled ?? false,
      enabled: data.enabled ?? false,
      upiId: data.upiId ?? "",
      basePrice: data.basePrice ?? 999,
      lastUpdated: new Date(),
    },
    update: {
      currency: data.currency,
      gstPercent: data.gstPercent,
      convenienceFeePercent: data.convenienceFeePercent,
      razorpayEnabled: data.razorpayEnabled,
      stripeEnabled: data.stripeEnabled,
      enabled: data.enabled,
      upiId: data.upiId,
      basePrice: data.basePrice,
      lastUpdated: new Date(),
    },
  });
}

export async function listEmailTemplates(orgId: string) {
  return prisma.emailTemplate.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createEmailTemplate(
  user: SessionUser,
  data: { name: string; subject: string; bodyHtml?: string; bodyText?: string },
) {
  const bodyHtml = data.bodyHtml ?? "";
  return prisma.emailTemplate.create({
    data: {
      organizationId: user.organizationId,
      name: data.name,
      key: data.name.toLowerCase().replace(/\s+/g, "-"),
      subject: data.subject,
      bodyHtml,
      bodyText: data.bodyText ?? null,
      htmlContent: bodyHtml,
      textContent: data.bodyText ?? "",
    },
  });
}

export async function listOffers(orgId: string) {
  return prisma.programOffer.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      program: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateStudentProfile(
  user: SessionUser,
  data: {
    name: string;
    phoneNumber?: string;
    username?: string;
    headline?: string;
    bio?: string;
    theme?: string;
    careerPath?: string;
  },
) {
  return prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      phoneNumber: data.phoneNumber || null,
      username: data.username || null,
      headline: data.headline || null,
      bio: data.bio || null,
      theme: data.theme || "system",
      careerPath: data.careerPath || null,
    },
  });
}

export async function listApplications(user: SessionUser, staff: boolean) {
  return prisma.application.findMany({
    where: {
      organizationId: user.organizationId,
      ...(staff ? {} : { applicantId: user.id }),
    },
    include: {
      program: { select: { id: true, title: true, slug: true } },
      applicant: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}

export async function listAssignments(orgId: string) {
  return prisma.assignment.findMany({
    where: { organizationId: orgId },
    include: {
      program: { select: { id: true, title: true } },
      _count: { select: { submissions: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listQuizzes(orgId: string) {
  return prisma.quiz.findMany({
    where: { organizationId: orgId },
    include: {
      program: { select: { id: true, title: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function listCertificates(user: SessionUser) {
  return prisma.certificate.findMany({
    where: { userId: user.id, organizationId: user.organizationId },
    include: { program: { select: { id: true, title: true } } },
    orderBy: { issueDate: "desc" },
  });
}

export async function adminOverview(orgId: string) {
  const [programs, applications, enrollments, tickets] = await Promise.all([
    prisma.program.count({ where: { organizationId: orgId } }),
    prisma.application.count({ where: { organizationId: orgId } }),
    prisma.enrollment.count({ where: { organizationId: orgId } }),
    prisma.ticket.count({
      where: { organizationId: orgId, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
  ]);
  return { programs, applications, enrollments, openTickets: tickets };
}
