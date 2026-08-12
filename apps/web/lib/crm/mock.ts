import type { CounselorRef, CrmLeadRef, CrmPort, SyncStatusInput, UpsertLeadInput } from "./types";

/** Development stub — logs payloads and returns synthetic CRM IDs. Replace with OneCrmAdapter when APIs are available. */
export class MockCrmAdapter implements CrmPort {
  async upsertLead(input: UpsertLeadInput): Promise<CrmLeadRef> {
    const externalLeadId = `mock-lead-${input.enrollmentId ?? input.applicationId ?? "anon"}`;
    console.info("[CRM:mock] upsertLead", {
      externalLeadId,
      email: input.email,
      program: input.programName,
      status: input.status,
      enrollmentId: input.enrollmentId,
      applicationId: input.applicationId,
    });
    return { externalLeadId, externalApplicationId: null, raw: { mock: true, input } };
  }

  async syncApplicationStatus(input: SyncStatusInput): Promise<void> {
    console.info("[CRM:mock] syncApplicationStatus", {
      applicationId: input.applicationId,
      externalLeadId: input.externalLeadId,
      status: input.status,
    });
  }

  async getCounselorAssignment(externalLeadId: string): Promise<CounselorRef | null> {
    return {
      externalId: `mock-counselor-${externalLeadId}`,
      name: "Mock Counselor",
      email: "counselor@example.com",
    };
  }
}
