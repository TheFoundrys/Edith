import {
  crmFetch,
  getCrmConfig,
  listPublicPrograms,
  matchCatalogId,
} from "./client";
import { mapApplicationStatus, mapLeadStage } from "./status-map";
import type {
  CounselorRef,
  CrmLeadRef,
  CrmPort,
  SyncStatusInput,
  UpsertLeadInput,
} from "./types";
import { APP_NAME } from "@/lib/brand";

type PublicLeadResponse = {
  success?: boolean;
  leadId?: string;
  applicationId?: string | null;
  lead?: {
    id: string;
    assignedId?: string | null;
    stage?: string;
  };
};

/**
 * CentraCRM adapter for https://dev-crm.thefoundrys.com/api/v1
 * Docs: https://dev-crm.thefoundrys.com/api-docs/
 */
export class CentraCrmAdapter implements CrmPort {
  async upsertLead(input: UpsertLeadInput): Promise<CrmLeadRef> {
    const config = getCrmConfig();
    if (!config.tenantId) {
      throw new Error("CRM_TENANT_ID is required for CentraCRM public lead ingestion");
    }

    const programs = await listPublicPrograms().catch(() => []);
    const catalogId =
      input.crmCatalogId ||
      config.defaultCatalogId ||
      matchCatalogId(programs, input.programName, config.tenantId) ||
      null;

    const qualification =
      typeof input.answers?.highest_qualification === "string"
        ? String(input.answers.highest_qualification)
        : undefined;
    const eduBackground =
      typeof input.answers?.stream === "string"
        ? String(input.answers.stream).toUpperCase()
        : undefined;

    const payload = {
      tenantId: config.tenantId,
      name: input.name,
      email: input.email,
      phone: input.phone || undefined,
      leadSource: APP_NAME,
      interestedCatalogId: catalogId || undefined,
      qualification,
      eduBackground,
      location:
        typeof input.answers?.preferred_campus === "string"
          ? String(input.answers.preferred_campus)
          : undefined,
      additionalData: {
        atlasApplicationId: input.applicationId || undefined,
        atlasEnrollmentId: input.enrollmentId || undefined,
        programId: input.programId,
        programName: input.programName,
        intakeName: input.intakeName,
        status: input.status,
        // Do not forward full form answers (may include documents / PII blobs).
        preferredCampus:
          typeof input.answers?.preferred_campus === "string"
            ? String(input.answers.preferred_campus)
            : undefined,
        highestQualification:
          typeof input.answers?.highest_qualification === "string"
            ? String(input.answers.highest_qualification)
            : undefined,
        stream:
          typeof input.answers?.stream === "string"
            ? String(input.answers.stream)
            : undefined,
        requiresCrmCallback: true,
        callbackHint: input.enrollmentId
          ? "POST /api/crm/enrollment-callback with enrollmentId + status APPROVED|REJECTED"
          : undefined,
      },
    };

    const result = await crmFetch<PublicLeadResponse>("/leads/public", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const externalLeadId = result.leadId || result.lead?.id;
    if (!externalLeadId) {
      throw new Error("CentraCRM did not return a leadId");
    }

    return {
      externalLeadId,
      externalApplicationId: result.applicationId ?? null,
      raw: result,
    };
  }

  async syncApplicationStatus(input: SyncStatusInput): Promise<void> {
    const config = getCrmConfig();
    const appStatus = mapApplicationStatus(input.status);
    const leadStage = mapLeadStage(input.status);

    // Prefer authenticated application status + lead stage updates when credentials exist.
    if (config.email && config.password) {
      if (input.externalApplicationId) {
        await crmFetch(`/applications/${input.externalApplicationId}/status`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({
            status: appStatus,
            note: input.note,
          }),
        });
      }

      if (input.externalLeadId) {
        await crmFetch(`/leads/${input.externalLeadId}`, {
          method: "PATCH",
          auth: true,
          body: JSON.stringify({
            stage: leadStage,
            additionalData: {
              atlasApplicationId: input.applicationId || undefined,
              atlasEnrollmentId: input.enrollmentId || undefined,
              atlasStatus: input.status,
              note: input.note,
            },
          }),
        });
      }
      return;
    }

    // Without service credentials we cannot PATCH; surface a clear error for CrmSyncLog.
    if (!input.externalLeadId && !input.externalApplicationId) {
      throw new Error("No CRM lead/application id available for status sync");
    }

    throw new Error(
      "CRM status sync requires CRM_EMAIL and CRM_PASSWORD (Bearer auth). Lead was created via public API.",
    );
  }

  async getCounselorAssignment(externalLeadId: string): Promise<CounselorRef | null> {
    const config = getCrmConfig();
    if (!config.email || !config.password) return null;

    const lead = await crmFetch<{
      id: string;
      assignedId?: string | null;
      assignedTo?: { id?: string; name?: string; email?: string } | null;
    }>(`/leads/${externalLeadId}`, { auth: true });

    if (lead.assignedTo?.id || lead.assignedId) {
      return {
        externalId: String(lead.assignedTo?.id || lead.assignedId),
        name: lead.assignedTo?.name ?? "Assigned counselor",
        email: lead.assignedTo?.email,
      };
    }
    return null;
  }
}
