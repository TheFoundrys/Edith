import "server-only";

import { AnnouncementPriority } from "@prisma/client";
import { prisma } from "@/lib/db";

export type CompassAnnouncementRow = {
  id: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  authorName?: string;
};

const DEFAULT_TARGET_AUDIENCE = {
  type: "all",
  roles: [],
  userIds: [],
  groupIds: [],
  courseIds: [],
};

function newCompassId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

function normalizePriority(value: string): AnnouncementPriority {
  return Object.values(AnnouncementPriority).includes(value as AnnouncementPriority)
    ? (value as AnnouncementPriority)
    : AnnouncementPriority.INFO;
}

export async function listCompassPublishedAnnouncements(): Promise<
  CompassAnnouncementRow[]
> {
  return prisma.$queryRaw<CompassAnnouncementRow[]>`
    SELECT id, title, content, priority::text AS priority,
      "isPinned", "publishedAt", "expiresAt", "createdAt"
    FROM "Announcement"
    WHERE "publishedAt" IS NOT NULL
      AND ("expiresAt" IS NULL OR "expiresAt" > NOW())
    ORDER BY "isPinned" DESC, "publishedAt" DESC
  `;
}

export async function listCompassAnnouncementsAdmin(): Promise<
  CompassAnnouncementRow[]
> {
  return prisma.$queryRaw<CompassAnnouncementRow[]>`
    SELECT a.id, a.title, a.content, a.priority::text AS priority,
      a."isPinned", a."publishedAt", a."expiresAt", a."createdAt",
      u.name AS "authorName"
    FROM "Announcement" a
    INNER JOIN "User" u ON u.id = a."authorId"
    ORDER BY a."createdAt" DESC
  `;
}

export async function createCompassAnnouncement(input: {
  authorId: string;
  title: string;
  content: string;
  priority: string;
  isPinned: boolean;
  publishedAt: Date | null;
  mediaUrls: string[];
}) {
  const id = newCompassId();
  const priority = normalizePriority(input.priority);

  await prisma.$executeRaw`
    INSERT INTO "Announcement" (
      id, title, content, priority, "targetAudience", "mediaUrls",
      "isPinned", "publishedAt", "authorId", "createdAt", "updatedAt"
    ) VALUES (
      ${id}, ${input.title}, ${input.content},
      ${priority}::"AnnouncementPriority",
      ${JSON.stringify(DEFAULT_TARGET_AUDIENCE)}::jsonb,
      ${input.mediaUrls}::text[],
      ${input.isPinned}, ${input.publishedAt}, ${input.authorId}, NOW(), NOW()
    )
  `;

  return { id };
}
