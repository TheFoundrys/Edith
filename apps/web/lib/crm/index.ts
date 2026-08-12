import { CrmSyncAction, CrmSyncStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { CentraCrmAdapter } from "./centracrm";
import { MockCrmAdapter } from "./mock";
import type { CrmPort, SyncStatusInput, UpsertLeadInput } from "./types";

function createAdapter(): CrmPort {
  const kind = (process.env.CRM_ADAPTER ?? "mock").toLowerCase();
  switch (kind) {
    case "centracrm":
    case "foundrys":
    case "onecrm":
      return new CentraCrmAdapter();
    case "mock":
      return new MockCrmAdapter();
    default:
      console.warn(`[CRM] Unknown adapter "${kind}" — using mock`);
      return new MockCrmAdapter();
  }
}

export const crm: CrmPort = createAdapter();

export async function crmUpsertLeadSafe(input: UpsertLeadInput) {
  const action = input.enrollmentId
    ? CrmSyncAction.ENROLL_NOTIFY
    : CrmSyncAction.UPSERT_LEAD;
  try {
    const result = await crm.upsertLead(input);
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
    await crm.syncApplicationStatus(input);
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
