import { CrmSyncAction, CrmSyncStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CentraCrmAdapter } from "./centracrm";
import { MockCrmAdapter } from "./mock";
import type { CrmPort, SyncStatusInput, UpsertLeadInput } from "./types";

function createAdapter(): CrmPort {
  const configured = process.env.CRM_ADAPTER?.trim().toLowerCase();
  const kind = configured || (process.env.NODE_ENV === "production" ? "" : "mock");
  switch (kind) {
    case "centracrm":
    case "foundrys":
    case "onecrm":
      return new CentraCrmAdapter();
    case "mock":
      if (process.env.NODE_ENV === "production") {
        throw new Error("Mock CRM is disabled in production.");
      }
      return new MockCrmAdapter();
    case "":
      throw new Error("CRM_ADAPTER must be configured in production.");
    default:
      throw new Error(`Unsupported CRM adapter: ${kind}`);
  }
}

export async function crmUpsertLeadSafe(input: UpsertLeadInput) {
  const action = input.enrollmentId
    ? CrmSyncAction.ENROLL_NOTIFY
    : CrmSyncAction.UPSERT_LEAD;
  try {
    const result = await createAdapter().upsertLead(input);
    await prisma.crmSyncLog.create({
      data: {
        organizationId: input.organizationId,
        applicationId: input.applicationId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        action,
        status: CrmSyncStatus.SUCCESS,
        requestJson: JSON.stringify(input),
        responseJson: JSON.stringify(result),
      },
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CRM error";
    await prisma.crmSyncLog.create({
      data: {
        organizationId: input.organizationId,
        applicationId: input.applicationId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        action,
        status: CrmSyncStatus.FAILED,
        requestJson: JSON.stringify(input),
        errorMessage: message,
      },
    });
    console.error("[CRM] upsertLead failed", message);
    return null;
  }
}

export async function crmSyncStatusSafe(input: SyncStatusInput) {
  try {
    await createAdapter().syncApplicationStatus(input);
    await prisma.crmSyncLog.create({
      data: {
        organizationId: input.organizationId,
        applicationId: input.applicationId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        action: CrmSyncAction.SYNC_STATUS,
        status: CrmSyncStatus.SUCCESS,
        requestJson: JSON.stringify(input),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown CRM error";
    await prisma.crmSyncLog.create({
      data: {
        organizationId: input.organizationId,
        applicationId: input.applicationId ?? null,
        enrollmentId: input.enrollmentId ?? null,
        action: CrmSyncAction.SYNC_STATUS,
        status: CrmSyncStatus.FAILED,
        requestJson: JSON.stringify(input),
        errorMessage: message,
      },
    });
    console.error("[CRM] syncApplicationStatus failed", message);
  }
}
