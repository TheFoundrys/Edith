"use server";

import { revalidatePath } from "next/cache";
import {
  AnnouncementPriority,
  CouponScope,
  CouponType,
  OfferStatus,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@prisma/client";
import { requireCapability, requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

function csvList(raw: string | null | undefined) {
  return String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Persist Compass-style learning progress on an enrollment. */
export async function updateEnrollmentProgress(
  enrollmentId: string,
  data: {
    progress?: unknown;
    lastModuleIndex?: number | null;
    lastLessonIndex?: number | null;
    totalLearningMinutesDelta?: number;
    unlockedPercentage?: number;
    completed?: boolean;
  },
) {
  const session = await requireStudent();
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: enrollmentId, userId: session.user.id },
  });
  if (!enrollment) return { error: "Enrollment not found." };

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      progress: data.progress === undefined ? undefined : (data.progress as object),
      lastModuleIndex: data.lastModuleIndex ?? undefined,
      lastLessonIndex: data.lastLessonIndex ?? undefined,
      totalLearningMinutes:
        data.totalLearningMinutesDelta != null
          ? { increment: data.totalLearningMinutesDelta }
          : undefined,
      unlockedPercentage: data.unlockedPercentage ?? undefined,
      lastAccessedAt: new Date(),
      completedAt: data.completed ? new Date() : undefined,
      status: data.completed ? "COMPLETED" : undefined,
    },
  });
  revalidatePath("/student/my-courses");
  revalidatePath(`/student/learning/${enrollment.programId}`);
  return { ok: true as const };
}

export async function updateStudentProfileExtended(formData: FormData) {
  const session = await requireStudent();
  const name = String(formData.get("name") || "").trim();
  if (name.length < 2) return { error: "Name is required." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phoneNumber: String(formData.get("phoneNumber") || "").trim() || null,
      username: String(formData.get("username") || "").trim() || null,
      headline: String(formData.get("headline") || "").trim() || null,
      bio: String(formData.get("bio") || "").trim() || null,
      theme: String(formData.get("theme") || "system").trim() || "system",
      careerPath: String(formData.get("careerPath") || "").trim() || null,
      image: String(formData.get("image") || "").trim() || null,
    },
  });
  revalidatePath("/student/profile");
  revalidatePath("/student/settings");
  return { ok: true as const };
}

export async function gradeAssignmentSubmission(
  submissionId: string,
  formData: FormData,
) {
  const session = await requireCapability("manageContent");
  const submission = await prisma.assignmentSubmission.findFirst({
    where: {
      id: submissionId,
      OR: [
        { assignment: { organizationId: session.user.organizationId } },
        { lesson: { module: { syllabus: { program: { organizationId: session.user.organizationId } } } } },
      ],
    },
  });
  if (!submission) return { error: "Submission not found." };

  const gradeRaw = formData.get("grade");
  const grade =
    gradeRaw === null || gradeRaw === ""
      ? null
      : Number(gradeRaw);
  if (grade != null && Number.isNaN(grade)) return { error: "Invalid grade." };

  await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      grade,
      feedback: String(formData.get("feedback") || "").trim() || null,
      fileUrl: String(formData.get("fileUrl") || "").trim() || null,
      fileName: String(formData.get("fileName") || "").trim() || null,
      status: "GRADED",
    },
  });
  revalidatePath("/admin/assignments");
  return { ok: true as const };
}

export async function setApplicationReference(
  applicationId: string,
  formData: FormData,
) {
  const session = await requireCapability("manageApplications");
  const app = await prisma.application.findFirst({
    where: { id: applicationId, organizationId: session.user.organizationId },
  });
  if (!app) return { error: "Application not found." };

  await prisma.application.update({
    where: { id: applicationId },
    data: {
      referenceNumber:
        String(formData.get("referenceNumber") || "").trim() || null,
      lastSavedStep: formData.get("lastSavedStep")
        ? Number(formData.get("lastSavedStep"))
        : app.lastSavedStep,
      paymentPlan: String(formData.get("paymentPlan") || "").trim() || null,
    },
  });
  revalidatePath(`/admin/applications/${applicationId}`);
  return { ok: true as const };
}

export async function createAnnouncement(formData: FormData) {
  const session = await requireCapability("manageContent");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!title || !content) return { error: "Title and content required." };

  const priority = String(formData.get("priority") || "INFO") as AnnouncementPriority;
  await prisma.announcement.create({
    data: {
      organizationId: session.user.organizationId,
      title,
      content,
      priority: Object.values(AnnouncementPriority).includes(priority)
        ? priority
        : AnnouncementPriority.INFO,
      isPinned: formData.get("isPinned") === "on",
      publishedAt: formData.get("publishNow") === "on" ? new Date() : null,
      mediaUrls: csvList(String(formData.get("mediaUrls") || "")),
      authorId: session.user.id,
    },
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/student/announcements");
  return { ok: true as const };
}

export async function createCoupon(formData: FormData) {
  const session = await requireCapability("managePricing");
  const code = String(formData.get("code") || "").trim().toUpperCase();
  const value = Number(formData.get("value") || 0);
  const expiresAt = String(formData.get("expiresAt") || "");
  if (!code || !expiresAt) return { error: "Code and expiry required." };

  const type = String(formData.get("type") || "PERCENTAGE") as CouponType;
  const scope = String(formData.get("scope") || "GLOBAL") as CouponScope;

  await prisma.coupon.create({
    data: {
      organizationId: session.user.organizationId,
      code,
      value,
      type: Object.values(CouponType).includes(type) ? type : CouponType.PERCENTAGE,
      scope: Object.values(CouponScope).includes(scope) ? scope : CouponScope.GLOBAL,
      description: String(formData.get("description") || "").trim() || null,
      maxUses: Number(formData.get("maxUses") || 0),
      expiresAt: new Date(expiresAt),
      isActive: formData.get("isActive") !== "off",
      createdBy: session.user.id,
    },
  });
  revalidatePath("/admin/coupons");
  return { ok: true as const };
}

export async function createTicket(formData: FormData) {
  const session = await requireStudent();
  const subject = String(formData.get("subject") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!subject || !content) return { error: "Subject and message required." };

  const category = String(formData.get("category") || "OTHER") as TicketCategory;
  const priority = String(formData.get("priority") || "MEDIUM") as TicketPriority;

  const ticket = await prisma.ticket.create({
    data: {
      organizationId: session.user.organizationId,
      userId: session.user.id,
      subject,
      category: Object.values(TicketCategory).includes(category)
        ? category
        : TicketCategory.OTHER,
      priority: Object.values(TicketPriority).includes(priority)
        ? priority
        : TicketPriority.MEDIUM,
      messages: {
        create: {
          userId: session.user.id,
          content,
          isStaff: false,
        },
      },
    },
  });
  revalidatePath("/student/tickets");
  revalidatePath("/admin/tickets");
  return { ok: true as const, id: ticket.id };
}

export async function replyTicket(ticketId: string, formData: FormData) {
  const content = String(formData.get("content") || "").trim();
  if (!content) return { error: "Message required." };

  let session;
  let isStaff = false;
  try {
    session = await requireCapability("manageApplications");
    isStaff = true;
  } catch {
    session = await requireStudent();
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      organizationId: session.user.organizationId,
      ...(isStaff ? {} : { userId: session.user.id }),
    },
  });
  if (!ticket) return { error: "Ticket not found." };

  await prisma.ticketMessage.create({
    data: {
      ticketId,
      userId: session.user.id,
      senderId: session.user.id,
      content,
      message: content,
      isStaff,
      isAdmin: isStaff,
    },
  });
  if (isStaff && formData.get("status")) {
    const status = String(formData.get("status")) as TicketStatus;
    if (Object.values(TicketStatus).includes(status)) {
      await prisma.ticket.update({ where: { id: ticketId }, data: { status } });
    }
  }
  revalidatePath(`/admin/tickets/${ticketId}`);
  revalidatePath(`/student/tickets/${ticketId}`);
  return { ok: true as const };
}

export async function createBadge(formData: FormData) {
  const session = await requireCapability("manageContent");
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name required." };
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const iconUrl = String(formData.get("iconUrl") || "").trim() || null;
  await prisma.badge.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      slug,
      description: String(formData.get("description") || "").trim() || null,
      iconUrl,
      icon: iconUrl ?? "",
    },
  });
  revalidatePath("/admin/badges");
  return { ok: true as const };
}

export async function awardBadge(formData: FormData) {
  const session = await requireCapability("manageContent");
  const userId = String(formData.get("userId") || "");
  const badgeId = String(formData.get("badgeId") || "");
  if (!userId || !badgeId) return { error: "User and badge required." };
  const badge = await prisma.badge.findFirst({
    where: { id: badgeId, organizationId: session.user.organizationId },
  });
  if (!badge) return { error: "Badge not found." };
  await prisma.userBadge.upsert({
    where: { userId_badgeId: { userId, badgeId } },
    create: { userId, badgeId },
    update: {},
  });
  revalidatePath("/admin/badges");
  return { ok: true as const };
}

export async function createForumCategory(formData: FormData) {
  const session = await requireCapability("manageContent");
  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || name)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
  if (!name) return { error: "Name required." };
  await prisma.forumCategory.create({
    data: {
      organizationId: session.user.organizationId,
      name,
      slug,
      description: String(formData.get("description") || "").trim() || null,
    },
  });
  revalidatePath("/admin/forums");
  revalidatePath("/student/forums");
  return { ok: true as const };
}

export async function createForumThread(formData: FormData) {
  const session = await requireStudent();
  const categoryId = String(formData.get("categoryId") || "");
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  if (!categoryId || !title || !content) return { error: "All fields required." };
  const category = await prisma.forumCategory.findFirst({
    where: { id: categoryId, organizationId: session.user.organizationId },
  });
  if (!category) return { error: "Category not found." };
  const thread = await prisma.forumThread.create({
    data: {
      categoryId,
      authorId: session.user.id,
      title,
      content,
      programId: String(formData.get("programId") || "") || null,
      tags: csvList(String(formData.get("tags") || "")),
    },
  });
  revalidatePath("/student/forums");
  return { ok: true as const, id: thread.id };
}

export async function upsertPaymentSettings(formData: FormData) {
  const session = await requireCapability("managePricing");
  const orgId = session.user.organizationId;
  await prisma.paymentSettings.upsert({
    where: { organizationId: orgId },
    create: {
      organizationId: orgId,
      currency: String(formData.get("currency") || "INR"),
      gstPercent: Number(formData.get("gstPercent") || 18),
      convenienceFeePercent: Number(formData.get("convenienceFeePercent") || 0),
      razorpayEnabled: formData.get("razorpayEnabled") === "on",
      stripeEnabled: formData.get("stripeEnabled") === "on",
    },
    update: {
      currency: String(formData.get("currency") || "INR"),
      gstPercent: Number(formData.get("gstPercent") || 18),
      convenienceFeePercent: Number(formData.get("convenienceFeePercent") || 0),
      razorpayEnabled: formData.get("razorpayEnabled") === "on",
      stripeEnabled: formData.get("stripeEnabled") === "on",
    },
  });
  revalidatePath("/admin/payment-settings");
  return { ok: true as const };
}

export async function createProgramOffer(formData: FormData) {
  const session = await requireCapability("managePricing");
  const userId = String(formData.get("userId") || "");
  const programId = String(formData.get("programId") || "");
  if (!userId || !programId) return { error: "User and program required." };
  await prisma.programOffer.create({
    data: {
      organizationId: session.user.organizationId,
      userId,
      programId,
      customPrice: Number(formData.get("customPrice") || 0),
      tokenRequired: Number(formData.get("tokenRequired") || 0),
      discountAmount: Number(formData.get("discountAmount") || 0),
      discountType: String(formData.get("discountType") || "").trim() || null,
      status: OfferStatus.OFFERED,
    },
  });
  revalidatePath("/admin/offers");
  return { ok: true as const };
}

export async function updateProgramCompassFields(
  programId: string,
  formData: FormData,
) {
  const session = await requireCapability("managePrograms");
  const existing = await prisma.program.findFirst({
    where: { id: programId, organizationId: session.user.organizationId },
  });
  if (!existing) return { error: "Program not found." };

  const outcomes = csvList(String(formData.get("learningOutcomes") || ""));
  const tags = csvList(String(formData.get("tags") || ""));

  await prisma.program.update({
    where: { id: programId },
    data: {
      sku: String(formData.get("sku") || "").trim() || null,
      duration: String(formData.get("duration") || "").trim() || null,
      weeks: formData.get("weeks") ? Number(formData.get("weeks")) : null,
      originalPrice: formData.get("originalPrice")
        ? Number(formData.get("originalPrice"))
        : null,
      learningOutcomes: outcomes,
      tags,
      specialization: String(formData.get("specialization") || "").trim() || null,
      location: String(formData.get("location") || "").trim() || null,
      brochureUrl: String(formData.get("brochureUrl") || "").trim() || null,
      requiresEntranceExam: formData.get("requiresEntranceExam") === "on",
      isHybridOnly: formData.get("isHybridOnly") === "on",
      isInventoryOnly: formData.get("isInventoryOnly") === "on",
      domainSlug: String(formData.get("domainSlug") || "").trim() || null,
      batchId: String(formData.get("batchId") || "").trim() || null,
    },
  });
  revalidatePath(`/admin/programs/${programId}`);
  revalidatePath("/courses");
  return { ok: true as const };
}


/** Form-action wrappers (must return void). */
export async function createAnnouncementAction(formData: FormData) {
  await createAnnouncement(formData);
}
export async function createCouponAction(formData: FormData) {
  await createCoupon(formData);
}
export async function createTicketAction(formData: FormData) {
  await createTicket(formData);
}
export async function replyTicketAction(ticketId: string, formData: FormData) {
  await replyTicket(ticketId, formData);
}
export async function createBadgeAction(formData: FormData) {
  await createBadge(formData);
}
export async function awardBadgeAction(formData: FormData) {
  await awardBadge(formData);
}
export async function createForumCategoryAction(formData: FormData) {
  await createForumCategory(formData);
}
export async function createForumThreadAction(formData: FormData) {
  await createForumThread(formData);
}
export async function upsertPaymentSettingsAction(formData: FormData) {
  await upsertPaymentSettings(formData);
}
export async function createProgramOfferAction(formData: FormData) {
  await createProgramOffer(formData);
}
