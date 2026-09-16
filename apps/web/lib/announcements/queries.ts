import "server-only";

import {
  createCompassAnnouncement,
  listCompassAnnouncementsAdmin,
  listCompassPublishedAnnouncements,
} from "@/lib/compass/announcements";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
import { AnnouncementPriority } from "@prisma/client";

export type AnnouncementListItem = {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  publishedAt: Date | null;
  author?: { name: string };
};

export async function listPublishedAnnouncements(
  organizationId: string,
): Promise<AnnouncementListItem[]> {
  if (isCompassDatabase()) {
    void organizationId;
    const rows = await listCompassPublishedAnnouncements();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      priority: row.priority,
      isPinned: row.isPinned,
      publishedAt: row.publishedAt,
    }));
  }

  return prisma.announcement.findMany({
    where: {
      organizationId,
      publishedAt: { not: null },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      title: true,
      content: true,
      priority: true,
      isPinned: true,
      publishedAt: true,
    },
  });
}

export async function listAdminAnnouncements(
  organizationId: string,
): Promise<AnnouncementListItem[]> {
  if (isCompassDatabase()) {
    void organizationId;
    const rows = await listCompassAnnouncementsAdmin();
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      priority: row.priority,
      isPinned: row.isPinned,
      publishedAt: row.publishedAt,
      author: { name: row.authorName ?? "Staff" },
    }));
  }

  return prisma.announcement.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });
}

export async function createAnnouncementRecord(input: {
  organizationId: string;
  authorId: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  publishedAt: Date | null;
  mediaUrls: string[];
}) {
  if (isCompassDatabase()) {
    return createCompassAnnouncement({
      authorId: input.authorId,
      title: input.title,
      content: input.content,
      priority: input.priority,
      isPinned: input.isPinned,
      publishedAt: input.publishedAt,
      mediaUrls: input.mediaUrls,
    });
  }

  const priority = Object.values(AnnouncementPriority).includes(
    input.priority as AnnouncementPriority,
  )
    ? (input.priority as AnnouncementPriority)
    : AnnouncementPriority.INFO;

  await prisma.announcement.create({
    data: {
      organizationId: input.organizationId,
      title: input.title,
      content: input.content,
      priority,
      isPinned: input.isPinned,
      publishedAt: input.publishedAt,
      mediaUrls: input.mediaUrls,
      authorId: input.authorId,
    },
  });

  return { id: null };
}
