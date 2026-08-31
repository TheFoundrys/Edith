import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function recordAudit(input: {
  organizationId: string;
  actor: { id: string; name: string };
  action: string;
  entityType: string;
  entityId?: string | null;
  targetResource?: string;
  details?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      adminId: input.actor.id,
      adminName: input.actor.name,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      targetResource: input.targetResource ?? input.entityType,
      details: input.details ?? null,
      metadata: input.metadata,
    },
  });
}
