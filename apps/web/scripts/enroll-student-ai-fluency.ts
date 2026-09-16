/**
 * Register a demo student, enroll in AI Fluency, record a paid transaction,
 * and verify my-courses / learning access.
 *
 *   npx tsx scripts/enroll-student-ai-fluency.ts
 *   npx tsx scripts/enroll-student-ai-fluency.ts --email=aifluency.demo@example.com
 */
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";
import { resolveCourseListPrice } from "../lib/programs/pricing";

function buildInvoiceNumber(paymentId: string, paidAt: Date) {
  const y = paidAt.getUTCFullYear();
  const m = String(paidAt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(paidAt.getUTCDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-${paymentId.slice(-8).toUpperCase()}`;
}

async function markCoursePaymentPaid(paymentId: string, enrollmentId: string) {
  const paidAt = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        paymentDate: paidAt,
        providerPaymentId: `demo_pay_${Date.now()}`,
        invoiceId: buildInvoiceNumber(paymentId, paidAt),
      },
    });
    await tx.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: "ACTIVE",
        enrolledAt: paidAt,
      },
    });
  });
}

function arg(name: string) {
  const hit = process.argv.find((row) => row.startsWith(`--${name}=`));
  return hit?.split("=").slice(1).join("=")?.trim();
}

async function main() {
  const email = (arg("email") ?? "aifluency.demo@example.com").toLowerCase();
  const password = arg("password") ?? "password123";
  const name = arg("name") ?? "AI Fluency Demo Student";

  const orgSlug = process.env.DEFAULT_ORG_SLUG?.trim() || "the-foundrys";
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) {
    throw new Error(`Organization "${orgSlug}" not found. Run db:seed first.`);
  }

  const program = await prisma.program.findFirst({
    where: {
      organizationId: org.id,
      slug: "ai-fluency",
      status: "PUBLISHED",
    },
    include: {
      syllabus: {
        select: {
          status: true,
          modules: {
            orderBy: { order: "asc" },
            take: 1,
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                take: 1,
              },
            },
          },
        },
      },
    },
  });

  if (!program) {
    throw new Error('Published program "ai-fluency" not found.');
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    const hashed = await bcrypt.hash(password, 12);
    user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashed,
        memberships: {
          create: { organizationId: org.id, role: "STUDENT" },
        },
      },
    });
    console.log(`Created student ${email}`);
  } else {
    console.log(`Using existing student ${email}`);
  }

  let enrollment = await prisma.enrollment.findUnique({
    where: {
      userId_programId: { userId: user.id, programId: program.id },
    },
    include: { payments: { orderBy: { createdAt: "desc" } } },
  });

  const listPrice = resolveCourseListPrice(program);
  const isFree = listPrice === 0;

  if (!enrollment) {
    enrollment = await prisma.enrollment.create({
      data: {
        organizationId: org.id,
        programId: program.id,
        userId: user.id,
        status: isFree ? "ACTIVE" : "PENDING",
        enrolledAt: isFree ? new Date() : null,
      },
      include: { payments: { orderBy: { createdAt: "desc" } } },
    });
    console.log(`Created enrollment ${enrollment.id} (${enrollment.status})`);
  } else if (enrollment.status !== "ACTIVE" && isFree) {
    enrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: "ACTIVE", enrolledAt: new Date() },
      include: { payments: { orderBy: { createdAt: "desc" } } },
    });
  }

  let payment = enrollment.payments.find((row) => row.status === "PAID");
  if (!payment && !isFree) {
    payment = await prisma.payment.create({
      data: {
        organizationId: org.id,
        enrollmentId: enrollment.id,
        userId: user.id,
        programId: program.id,
        amount: listPrice,
        currency: "INR",
        status: "PENDING",
        provider: "OFFLINE",
        purpose: "COURSE_FEE",
        principalAmount: listPrice,
        discountAmount: 0,
        gstAmount: 0,
        convenienceFee: 0,
        totalAmount: listPrice,
        providerOrderId: `demo_order_${Date.now()}`,
        metadataJson: JSON.stringify({ source: "enroll-student-ai-fluency script" }),
      },
    });
    console.log(`Created payment ${payment.id} for ₹${listPrice}`);

    await markCoursePaymentPaid(payment.id, enrollment.id);
    console.log("Payment marked PAID — enrollment activated");
  } else if (payment) {
    console.log(`Existing paid transaction ${payment.id}`);
    if (enrollment.status !== "ACTIVE") {
      await markCoursePaymentPaid(payment.id, enrollment.id);
    }
  } else {
    console.log("Free course — no transaction required");
  }

  const refreshed = await prisma.enrollment.findMany({
    where: { userId: user.id, programId: program.id },
    select: { id: true, status: true, enrolledAt: true },
  });
  const row = refreshed[0];
  const firstLesson =
    program.syllabus?.modules[0]?.lessons[0] ?? null;
  const learningHref = firstLesson
    ? `/student/learning/${program.id}/lessons/${firstLesson.id}`
    : `/student/learning/${program.id}`;

  const paidPayments = await prisma.payment.findMany({
    where: {
      userId: user.id,
      status: "PAID",
      programId: program.id,
    },
    select: { id: true, amount: true, invoiceId: true, paymentDate: true },
  });

  console.log("\n--- Result ---");
  console.log(`Student: ${email} / ${password}`);
  console.log(`Program: ${program.title} (${program.id})`);
  console.log(`Enrollment: ${row?.status ?? "missing"} — ${row?.id ?? "—"}`);
  console.log(`My courses: /student/my-courses`);
  console.log(`Start learning: ${learningHref}`);
  console.log(`Transactions: /student/transactions`);
  if (paidPayments.length > 0) {
    for (const tx of paidPayments) {
      console.log(
        `  PAID ${tx.id} ₹${tx.amount} invoice=${tx.invoiceId ?? "pending"} date=${tx.paymentDate?.toISOString() ?? "—"}`,
      );
    }
  } else {
    console.log("  (no paid transactions — course is free)");
  }

  if (!row || row.status !== "ACTIVE") {
    throw new Error("Enrollment is not ACTIVE — check payment or CRM callback settings.");
  }
  if (program.syllabus?.status !== "PUBLISHED") {
    console.warn("Warning: syllabus is not PUBLISHED — my-courses may hide progress.");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
