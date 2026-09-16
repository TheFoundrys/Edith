import "server-only";

import { prisma } from "@/lib/db";

/** Subset of Compass `User` columns (Edith-only fields like permissionRoleId are omitted). */
export type CompassAuthUser = {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string | null;
};

export async function findCompassUserByEmail(
  email: string,
): Promise<CompassAuthUser | null> {
  const rows = await prisma.$queryRaw<CompassAuthUser[]>`
    SELECT id, email, name, password, role
    FROM "User"
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findCompassUserProfile(userId: string) {
  const rows = await prisma.$queryRaw<
    {
      headline: string | null;
      careerPath: string | null;
      bio: string | null;
      name: string;
    }[]
  >`
    SELECT headline, "careerPath", bio, name
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function findCompassUserById(
  userId: string,
): Promise<Pick<CompassAuthUser, "id" | "email" | "name"> | null> {
  const rows = await prisma.$queryRaw<
    Pick<CompassAuthUser, "id" | "email" | "name">[]
  >`
    SELECT id, email, name
    FROM "User"
    WHERE id = ${userId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function newCompassUserId() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

/** Insert a learner on compass_dev (raw SQL — avoids Edith-only Prisma columns). */
export async function createCompassUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<{ id: string }> {
  const id = newCompassUserId();
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO "User" (
      id, name, email, password, role, status, "isVerified",
      "tokenVersion", theme, "isPersonalizedAccount", "gstWaived",
      "createdAt", "updatedAt"
    ) VALUES (
      ${id},
      ${input.name},
      ${input.email},
      ${input.passwordHash},
      'learner',
      'ACTIVE'::"UserStatus",
      ${process.env.NODE_ENV !== "production"},
      0,
      'system',
      false,
      false,
      ${now},
      ${now}
    )
  `;

  return { id };
}
