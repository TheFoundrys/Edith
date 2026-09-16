import "server-only";

import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

export type CompassTicketRow = {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CompassTicketMessageRow = {
  id: string;
  ticketId: string;
  senderId: string;
  message: string;
  isAdmin: boolean;
  createdAt: Date;
  senderName: string;
};

function newCompassId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

function normalizeCategory(value: string): TicketCategory {
  return Object.values(TicketCategory).includes(value as TicketCategory)
    ? (value as TicketCategory)
    : TicketCategory.OTHER;
}

function normalizePriority(value: string): TicketPriority {
  return Object.values(TicketPriority).includes(value as TicketPriority)
    ? (value as TicketPriority)
    : TicketPriority.MEDIUM;
}

function normalizeStatus(value: string): TicketStatus {
  return Object.values(TicketStatus).includes(value as TicketStatus)
    ? (value as TicketStatus)
    : TicketStatus.OPEN;
}

export async function listCompassTicketsForUser(
  userId: string,
): Promise<CompassTicketRow[]> {
  return prisma.$queryRaw<CompassTicketRow[]>`
    SELECT id, "userId", subject, category::text AS category,
      priority::text AS priority, status::text AS status,
      "createdAt", "updatedAt"
    FROM "Ticket"
    WHERE "userId" = ${userId}
    ORDER BY "updatedAt" DESC
  `;
}

export async function listCompassTicketsAdmin(): Promise<
  (CompassTicketRow & { userName: string; userEmail: string })[]
> {
  return prisma.$queryRaw<
    (CompassTicketRow & { userName: string; userEmail: string })[]
  >`
    SELECT t.id, t."userId", t.subject, t.category::text AS category,
      t.priority::text AS priority, t.status::text AS status,
      t."createdAt", t."updatedAt", u.name AS "userName", u.email AS "userEmail"
    FROM "Ticket" t
    INNER JOIN "User" u ON u.id = t."userId"
    ORDER BY t."updatedAt" DESC
  `;
}

export async function getCompassTicketForUser(
  userId: string,
  ticketId: string,
): Promise<CompassTicketRow | null> {
  const rows = await prisma.$queryRaw<CompassTicketRow[]>`
    SELECT id, "userId", subject, category::text AS category,
      priority::text AS priority, status::text AS status,
      "createdAt", "updatedAt"
    FROM "Ticket"
    WHERE id = ${ticketId} AND "userId" = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getCompassTicketForAdmin(
  ticketId: string,
): Promise<
  | (CompassTicketRow & { userName: string; userEmail: string })
  | null
> {
  const rows = await prisma.$queryRaw<
    (CompassTicketRow & { userName: string; userEmail: string })[]
  >`
    SELECT t.id, t."userId", t.subject, t.category::text AS category,
      t.priority::text AS priority, t.status::text AS status,
      t."createdAt", t."updatedAt", u.name AS "userName", u.email AS "userEmail"
    FROM "Ticket" t
    INNER JOIN "User" u ON u.id = t."userId"
    WHERE t.id = ${ticketId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function listCompassTicketMessages(
  ticketId: string,
): Promise<CompassTicketMessageRow[]> {
  return prisma.$queryRaw<CompassTicketMessageRow[]>`
    SELECT m.id, m."ticketId", m."senderId", m.message, m."isAdmin",
      m."createdAt", COALESCE(u.name, 'User') AS "senderName"
    FROM "TicketMessage" m
    LEFT JOIN "User" u ON u.id = m."senderId"
    WHERE m."ticketId" = ${ticketId}
    ORDER BY m."createdAt" ASC
  `;
}

export async function createCompassTicket(input: {
  userId: string;
  subject: string;
  content: string;
  category: string;
  priority: string;
}): Promise<{ id: string }> {
  const ticketId = newCompassId();
  const messageId = newCompassId();
  const category = normalizeCategory(input.category);
  const priority = normalizePriority(input.priority);

  await prisma.$executeRaw`
    INSERT INTO "Ticket" (
      id, "userId", subject, category, priority, status, "createdAt", "updatedAt"
    ) VALUES (
      ${ticketId}, ${input.userId}, ${input.subject},
      ${category}::"TicketCategory", ${priority}::"TicketPriority",
      'OPEN'::"TicketStatus", NOW(), NOW()
    )
  `;
  await prisma.$executeRaw`
    INSERT INTO "TicketMessage" (
      id, "ticketId", "senderId", message, "isAdmin", "createdAt", "updatedAt"
    ) VALUES (
      ${messageId}, ${ticketId}, ${input.userId}, ${input.content},
      false, NOW(), NOW()
    )
  `;
  return { id: ticketId };
}

export async function replyCompassTicket(input: {
  ticketId: string;
  senderId: string;
  content: string;
  isStaff: boolean;
  status?: TicketStatus;
}) {
  const messageId = newCompassId();
  await prisma.$executeRaw`
    INSERT INTO "TicketMessage" (
      id, "ticketId", "senderId", message, "isAdmin", "createdAt", "updatedAt"
    ) VALUES (
      ${messageId}, ${input.ticketId}, ${input.senderId}, ${input.content},
      ${input.isStaff}, NOW(), NOW()
    )
  `;
  if (input.status) {
    await prisma.$executeRaw`
      UPDATE "Ticket"
      SET status = ${input.status}::"TicketStatus", "updatedAt" = NOW()
      WHERE id = ${input.ticketId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE "Ticket" SET "updatedAt" = NOW() WHERE id = ${input.ticketId}
    `;
  }
}

export async function findCompassTicketForReply(input: {
  ticketId: string;
  userId: string;
  isStaff: boolean;
}): Promise<CompassTicketRow | null> {
  if (input.isStaff) {
    const rows = await prisma.$queryRaw<CompassTicketRow[]>`
      SELECT id, "userId", subject, category::text AS category,
        priority::text AS priority, status::text AS status,
        "createdAt", "updatedAt"
      FROM "Ticket"
      WHERE id = ${input.ticketId}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
  return getCompassTicketForUser(input.userId, input.ticketId);
}

export { normalizeStatus };
