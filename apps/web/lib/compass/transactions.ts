import "server-only";

import { prisma } from "@/lib/db";

export type CompassPaymentView = {
  id: string;
  userId: string;
  programId: string | null;
  enrollmentId: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  invoiceId: string;
};

export type CompassTransactionDetail = {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  paymentDate: Date;
  createdAt: Date;
  couponCode: string | null;
  principalAmount: number | null;
  discountAmount: number;
  gstAmount: number | null;
  convenienceFee: number;
  utr: string | null;
  courseId: string | null;
  courseTitle: string | null;
  userName: string;
  userEmail: string;
};

type TransactionRow = {
  id: string;
  invoiceId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: Date;
  courseId: string | null;
};

function mapTransaction(row: TransactionRow): CompassPaymentView {
  return {
    id: row.id,
    userId: row.userId,
    programId: row.courseId,
    enrollmentId: null,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    createdAt: row.createdAt,
    invoiceId: row.invoiceId,
  };
}

export function isCompassPaidStatus(status: string) {
  return ["PAID", "SUCCESS", "COMPLETED"].includes(status.toUpperCase());
}

/** Map Compass transaction status to Edith-style payment status for UI. */
export function compassStatusToPaymentStatus(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS" || normalized === "COMPLETED") return "PAID";
  if (normalized === "PAID") return "PAID";
  return normalized;
}

/** List transactions for a user, optionally scoped to a course. */
export async function listCompassTransactionsForUser(
  userId: string,
  courseId?: string,
): Promise<CompassPaymentView[]> {
  const rows = courseId
    ? await prisma.$queryRaw<TransactionRow[]>`
        SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency, t.status::text AS status, t."createdAt", ct."B" AS "courseId"
        FROM "Transaction" t
        INNER JOIN "_CourseTransactions" ct ON ct."A" = t.id
        WHERE t."userId" = ${userId} AND ct."B" = ${courseId}
        ORDER BY t."createdAt" DESC
      `
    : await prisma.$queryRaw<TransactionRow[]>`
        SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency, t.status::text AS status, t."createdAt", NULL::text AS "courseId"
        FROM "Transaction" t
        WHERE t."userId" = ${userId}
        ORDER BY t."createdAt" DESC
      `;
  return rows.map(mapTransaction);
}

export async function hasCompassPaidCourseAccess(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "Transaction" t
    INNER JOIN "_CourseTransactions" ct ON ct."A" = t.id
    WHERE t."userId" = ${userId}
      AND ct."B" = ${courseId}
      AND t.status IN ('PAID', 'SUCCESS', 'COMPLETED')
  `;
  return Number(rows[0]?.count ?? 0) > 0;
}

export async function getCompassTransactionById(
  transactionId: string,
  userId?: string,
): Promise<CompassPaymentView | null> {
  const rows = userId
    ? await prisma.$queryRaw<TransactionRow[]>`
        SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency, t.status::text AS status, t."createdAt", NULL::text AS "courseId"
        FROM "Transaction" t
        WHERE t.id = ${transactionId} AND t."userId" = ${userId}
        LIMIT 1
      `
    : await prisma.$queryRaw<TransactionRow[]>`
        SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency, t.status::text AS status, t."createdAt", NULL::text AS "courseId"
        FROM "Transaction" t
        WHERE t.id = ${transactionId}
        LIMIT 1
      `;
  return rows[0] ? mapTransaction(rows[0]) : null;
}

/** Admin transaction list scoped to a Domain (synthetic organizationId). */
export async function listCompassTransactionsAdmin(
  domainId: string,
  limit = 100,
): Promise<CompassTransactionDetail[]> {
  return prisma.$queryRaw<CompassTransactionDetail[]>`
    SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency,
      t.status::text AS status, t.provider::text AS provider,
      t."paymentDate", t."createdAt", t."couponCode",
      t."principalAmount", t."discountAmount", t."gstAmount", t."convenienceFee",
      t.utr,
      c.id AS "courseId", c.title AS "courseTitle",
      u.name AS "userName", u.email AS "userEmail"
    FROM "Transaction" t
    INNER JOIN "User" u ON u.id = t."userId"
    INNER JOIN "_CourseTransactions" ct ON ct."A" = t.id
    INNER JOIN "Course" c ON c.id = ct."B" AND c."domainId" = ${domainId}
    ORDER BY t."paymentDate" DESC, t."createdAt" DESC
    LIMIT ${limit}
  `;
}

export async function getCompassTransactionDetail(
  transactionId: string,
  options?: { userId?: string; domainId?: string },
): Promise<CompassTransactionDetail | null> {
  const { userId, domainId } = options ?? {};
  let rows: CompassTransactionDetail[];

  if (userId && domainId) {
    rows = await prisma.$queryRaw<CompassTransactionDetail[]>`
      SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency,
        t.status::text AS status, t.provider::text AS provider,
        t."paymentDate", t."createdAt", t."couponCode",
        t."principalAmount", t."discountAmount", t."gstAmount", t."convenienceFee",
        t.utr,
        c.id AS "courseId", c.title AS "courseTitle",
        u.name AS "userName", u.email AS "userEmail"
      FROM "Transaction" t
      INNER JOIN "User" u ON u.id = t."userId"
      LEFT JOIN "_CourseTransactions" ct ON ct."A" = t.id
      LEFT JOIN "Course" c ON c.id = ct."B"
      WHERE t.id = ${transactionId}
        AND t."userId" = ${userId}
        AND c."domainId" = ${domainId}
      LIMIT 1
    `;
  } else if (userId) {
    rows = await prisma.$queryRaw<CompassTransactionDetail[]>`
      SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency,
        t.status::text AS status, t.provider::text AS provider,
        t."paymentDate", t."createdAt", t."couponCode",
        t."principalAmount", t."discountAmount", t."gstAmount", t."convenienceFee",
        t.utr,
        c.id AS "courseId", c.title AS "courseTitle",
        u.name AS "userName", u.email AS "userEmail"
      FROM "Transaction" t
      INNER JOIN "User" u ON u.id = t."userId"
      LEFT JOIN "_CourseTransactions" ct ON ct."A" = t.id
      LEFT JOIN "Course" c ON c.id = ct."B"
      WHERE t.id = ${transactionId} AND t."userId" = ${userId}
      LIMIT 1
    `;
  } else if (domainId) {
    rows = await prisma.$queryRaw<CompassTransactionDetail[]>`
      SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency,
        t.status::text AS status, t.provider::text AS provider,
        t."paymentDate", t."createdAt", t."couponCode",
        t."principalAmount", t."discountAmount", t."gstAmount", t."convenienceFee",
        t.utr,
        c.id AS "courseId", c.title AS "courseTitle",
        u.name AS "userName", u.email AS "userEmail"
      FROM "Transaction" t
      INNER JOIN "User" u ON u.id = t."userId"
      LEFT JOIN "_CourseTransactions" ct ON ct."A" = t.id
      LEFT JOIN "Course" c ON c.id = ct."B"
      WHERE t.id = ${transactionId} AND c."domainId" = ${domainId}
      LIMIT 1
    `;
  } else {
    rows = await prisma.$queryRaw<CompassTransactionDetail[]>`
      SELECT t.id, t."invoiceId", t."userId", t.amount, t.currency,
        t.status::text AS status, t.provider::text AS provider,
        t."paymentDate", t."createdAt", t."couponCode",
        t."principalAmount", t."discountAmount", t."gstAmount", t."convenienceFee",
        t.utr,
        c.id AS "courseId", c.title AS "courseTitle",
        u.name AS "userName", u.email AS "userEmail"
      FROM "Transaction" t
      INNER JOIN "User" u ON u.id = t."userId"
      LEFT JOIN "_CourseTransactions" ct ON ct."A" = t.id
      LEFT JOIN "Course" c ON c.id = ct."B"
      WHERE t.id = ${transactionId}
      LIMIT 1
    `;
  }
  return rows[0] ?? null;
}

export function mapCompassTransactionToAdminPayment(row: CompassTransactionDetail) {
  const status = compassStatusToPaymentStatus(row.status);
  const courseTitle = row.courseTitle ?? "Programme";
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    purpose: "COURSE_FEE" as const,
    status,
    provider: row.provider,
    paymentDate: row.paymentDate,
    createdAt: row.createdAt,
    invoiceId: row.invoiceId,
    providerPaymentId: row.utr,
    couponCode: row.couponCode,
    program: row.courseTitle ? { title: row.courseTitle } : null,
    enrollment: {
      program: { title: courseTitle },
      user: { name: row.userName, email: row.userEmail },
    },
    application: null,
    user: { name: row.userName, email: row.userEmail },
  };
}

export function mapCompassTransactionToInvoicePayment(
  row: CompassTransactionDetail,
  organizationTitle: string,
) {
  const status = compassStatusToPaymentStatus(row.status);
  const courseTitle = row.courseTitle ?? "Programme";
  return {
    id: row.id,
    amount: row.amount,
    currency: row.currency,
    purpose: "COURSE_FEE" as const,
    status,
    provider: row.provider,
    paymentDate: row.paymentDate,
    createdAt: row.createdAt,
    invoiceId: row.invoiceId,
    providerPaymentId: row.utr,
    principalAmount: row.principalAmount,
    discountAmount: row.discountAmount,
    gstAmount: row.gstAmount,
    convenienceFee: row.convenienceFee,
    couponCode: row.couponCode,
    organization: { title: organizationTitle },
    program: row.courseTitle ? { title: row.courseTitle } : null,
    enrollment: {
      program: { title: courseTitle },
      user: { name: row.userName, email: row.userEmail },
    },
    application: null,
    user: { name: row.userName, email: row.userEmail },
  };
}
