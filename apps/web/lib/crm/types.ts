export type UpsertLeadInput = {
  organizationId: string;
  /** Admissions application id when present. */
  applicationId?: string | null;
  /** Direct course enrollment id when present. */
  enrollmentId?: string | null;
  email: string;
  name: string;
  phone?: string;
  programName: string;
  programId: string;
  crmCatalogId?: string | null;
  intakeName?: string;
  status: string;
  answers?: Record<string, unknown>;
};

export type SyncStatusInput = {
  organizationId: string;
  applicationId?: string | null;
  enrollmentId?: string | null;
  externalLeadId?: string | null;
  externalApplicationId?: string | null;
  status: string;
  note?: string;
};

export type CrmLeadRef = {
  externalLeadId: string;
  externalApplicationId?: string | null;
  raw?: unknown;
};

export type CounselorRef = {
  externalId: string;
  name: string;
  email?: string;
};

export interface CrmPort {
  upsertLead(input: UpsertLeadInput): Promise<CrmLeadRef>;
  syncApplicationStatus(input: SyncStatusInput): Promise<void>;
  getCounselorAssignment?(externalLeadId: string): Promise<CounselorRef | null>;
}
