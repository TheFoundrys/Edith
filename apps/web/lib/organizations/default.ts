import "server-only";

import { prisma } from "@/lib/db";

/**
 * Resolves the tenant used by public catalog routes.
 * Multi-tenant deployments must set DEFAULT_ORG_SLUG explicitly.
 */
export async function getDefaultOrganizationId(): Promise<string> {
  const configuredSlug = process.env.DEFAULT_ORG_SLUG?.trim();
  if (configuredSlug) {
    const organization = await prisma.organization.findUnique({
      where: { slug: configuredSlug },
      select: { id: true },
    });
    if (!organization) {
      throw new Error(
        `DEFAULT_ORG_SLUG does not match an organization: ${configuredSlug}`,
      );
    }
    return organization.id;
  }

  const organizations = await prisma.organization.findMany({
    orderBy: { createdAt: "asc" },
    take: 2,
    select: { id: true },
  });
  if (organizations.length !== 1) {
    throw new Error(
      "DEFAULT_ORG_SLUG is required when the deployment contains multiple organizations.",
    );
  }
  return organizations[0].id;
}
