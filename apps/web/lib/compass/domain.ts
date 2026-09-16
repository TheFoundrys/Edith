import "server-only";

import { prisma } from "@/lib/db";

type DomainRow = { id: string; slug: string; title: string };

/** Compass tenants are `Domain` rows — used as synthetic `organizationId`. */
async function findDomainBySlug(slug: string) {
  const rows = await prisma.$queryRaw<DomainRow[]>`
    SELECT id, slug, title
    FROM "Domain"
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

/** Domain id for auth/session (matched slug, else first domain). */
export async function getCompassDefaultDomainId(): Promise<string> {
  const preferred = process.env.DEFAULT_ORG_SLUG?.trim();
  if (preferred) {
    const matched = await findDomainBySlug(preferred);
    if (matched) return matched.id;
  }

  const rows = await prisma.$queryRaw<DomainRow[]>`
    SELECT id, slug, title
    FROM "Domain"
    ORDER BY "order" ASC, title ASC
    LIMIT 1
  `;
  if (!rows[0]) {
    throw new Error(
      "No Domain rows in compass_dev. Set DEFAULT_ORG_SLUG to a Domain slug (e.g. ai).",
    );
  }
  return rows[0].id;
}

/** Optional catalog filter — only when DEFAULT_ORG_SLUG matches a Domain slug. */
export async function getCompassCatalogDomainFilter(): Promise<string | undefined> {
  const preferred = process.env.DEFAULT_ORG_SLUG?.trim();
  if (!preferred) return undefined;
  const matched = await findDomainBySlug(preferred);
  return matched?.id;
}

export async function getCompassDomainTitle(domainId: string): Promise<string> {
  const rows = await prisma.$queryRaw<{ title: string }[]>`
    SELECT title FROM "Domain" WHERE id = ${domainId} LIMIT 1
  `;
  return rows[0]?.title ?? "Organization";
}

export async function readCompassUserRole(userId: string): Promise<string> {
  const rows = await prisma.$queryRaw<{ role: string | null }[]>`
    SELECT role FROM "User" WHERE id = ${userId} LIMIT 1
  `;
  return rows[0]?.role ?? "learner";
}
