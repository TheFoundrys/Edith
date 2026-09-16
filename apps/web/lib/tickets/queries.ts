import "server-only";

import {
  createCompassTicket,
  findCompassTicketForReply,
  getCompassTicketForAdmin,
  getCompassTicketForUser,
  listCompassTicketMessages,
  listCompassTicketsAdmin,
  listCompassTicketsForUser,
  normalizeStatus,
  replyCompassTicket,
} from "@/lib/compass/tickets";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import {
  TicketCategory,
  TicketPriority,
  type TicketStatus,
} from "@prisma/client";

export type TicketListItem = {
  id: string;
  subject: string;
  status: string;
  category?: string;
  priority?: string;
  user?: { name: string; email: string };
};

export type TicketMessageView = {
  id: string;
  content: string;
  isStaff: boolean;
  createdAt: Date;
  user: { name: string };
};

export type TicketDetail = {
  id: string;
  subject: string;
  status: string;
  user?: { name: string; email: string };
  messages: TicketMessageView[];
};

export async function listStudentTickets(
  userId: string,
): Promise<TicketListItem[]> {
  if (isCompassDatabase()) {
    const rows = await listCompassTicketsForUser(userId);
    return rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      status: row.status,
    }));
  }

  return prisma.ticket.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, subject: true, status: true },
  });
}

export async function loadStudentTicketDetail(
  userId: string,
  ticketId: string,
): Promise<TicketDetail | null> {
  if (isCompassDatabase()) {
    const ticket = await getCompassTicketForUser(userId, ticketId);
    if (!ticket) return null;
    const messages = await listCompassTicketMessages(ticketId);
    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      messages: messages.map((message) => ({
        id: message.id,
        content: message.message,
        isStaff: message.isAdmin,
        createdAt: message.createdAt,
        user: { name: message.senderName },
      })),
    };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!ticket) return null;

  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    messages: ticket.messages.map((message) => ({
      id: message.id,
      content: message.content,
      isStaff: message.isStaff,
      createdAt: message.createdAt,
      user: { name: message.user.name },
    })),
  };
}

export async function listAdminTickets(
  organizationId: string,
): Promise<TicketListItem[]> {
  if (isCompassDatabase()) {
    void organizationId;
    const rows = await listCompassTicketsAdmin();
    return rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      status: row.status,
      category: row.category,
      priority: row.priority,
      user: { name: row.userName, email: row.userEmail },
    }));
  }

  return prisma.ticket.findMany({
    where: { organizationId },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });
}

export async function loadAdminTicketDetail(
  organizationId: string,
  ticketId: string,
): Promise<TicketDetail | null> {
  if (isCompassDatabase()) {
    void organizationId;
    const ticket = await getCompassTicketForAdmin(ticketId);
    if (!ticket) return null;
    const messages = await listCompassTicketMessages(ticketId);
    return {
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      user: { name: ticket.userName, email: ticket.userEmail },
      messages: messages.map((message) => ({
        id: message.id,
        content: message.message,
        isStaff: message.isAdmin,
        createdAt: message.createdAt,
        user: { name: message.senderName },
      })),
    };
  }

  const ticket = await prisma.ticket.findFirst({
    where: { id: ticketId, organizationId },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!ticket) return null;

  return {
    id: ticket.id,
    subject: ticket.subject,
    status: ticket.status,
    user: ticket.user,
    messages: ticket.messages.map((message) => ({
      id: message.id,
      content: message.content,
      isStaff: message.isStaff,
      createdAt: message.createdAt,
      user: { name: message.user.name },
    })),
  };
}

export async function createSupportTicket(input: {
  userId: string;
  organizationId: string;
  subject: string;
  content: string;
  category: string;
  priority: string;
}) {
  if (isCompassDatabase()) {
    return createCompassTicket({
      userId: input.userId,
      subject: input.subject,
      content: input.content,
      category: input.category,
      priority: input.priority,
    });
  }

  const category = Object.values(TicketCategory).includes(
    input.category as TicketCategory,
  )
    ? (input.category as TicketCategory)
    : TicketCategory.OTHER;
  const priority = Object.values(TicketPriority).includes(
    input.priority as TicketPriority,
  )
    ? (input.priority as TicketPriority)
    : TicketPriority.MEDIUM;

  const ticket = await prisma.ticket.create({
    data: {
      organizationId: input.organizationId,
      userId: input.userId,
      subject: input.subject,
      category,
      priority,
      messages: {
        create: {
          userId: input.userId,
          content: input.content,
          isStaff: false,
        },
      },
    },
  });
  return { id: ticket.id };
}

export async function replySupportTicket(input: {
  ticketId: string;
  userId: string;
  organizationId: string;
  content: string;
  isStaff: boolean;
  status?: string;
}) {
  if (isCompassDatabase()) {
    const ticket = await findCompassTicketForReply({
      ticketId: input.ticketId,
      userId: input.userId,
      isStaff: input.isStaff,
    });
    if (!ticket) return { error: "Ticket not found." as const };

    await replyCompassTicket({
      ticketId: input.ticketId,
      senderId: input.userId,
      content: input.content,
      isStaff: input.isStaff,
      status: input.status ? normalizeStatus(input.status) : undefined,
    });
    return { ok: true as const };
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: input.ticketId,
      organizationId: input.organizationId,
      ...(input.isStaff ? {} : { userId: input.userId }),
    },
  });
  if (!ticket) return { error: "Ticket not found." as const };

  await prisma.ticketMessage.create({
    data: {
      ticketId: input.ticketId,
      userId: input.userId,
      senderId: input.userId,
      content: input.content,
      message: input.content,
      isStaff: input.isStaff,
      isAdmin: input.isStaff,
    },
  });

  if (input.isStaff && input.status) {
    const status = normalizeStatus(input.status) as TicketStatus;
    await prisma.ticket.update({
      where: { id: input.ticketId },
      data: { status },
    });
  }

  return { ok: true as const };
}
