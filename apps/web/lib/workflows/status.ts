import { ApplicationStatus } from "@prisma/client";

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  DOCUMENT_VERIFICATION: "Document verification",
  UNDER_REVIEW: "Under review",
  INTERVIEW: "Interview",
  DECISION_PENDING: "Decision pending",
  OFFERED: "Offered",
  REJECTED: "Rejected",
  WAITLISTED: "Waitlisted",
  FEE_REQUESTED: "Fee requested",
  ENROLLED: "Enrolled",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  LOCKED: "Locked",
  CHANGE_REQUESTED: "Change requested",
};

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "DRAFT",
  "SUBMITTED",
  "DOCUMENT_VERIFICATION",
  "UNDER_REVIEW",
  "INTERVIEW",
  "DECISION_PENDING",
  "OFFERED",
  "REJECTED",
  "WAITLISTED",
  "FEE_REQUESTED",
  "ENROLLED",
  "PAYMENT_PENDING",
  "PAID",
  "LOCKED",
  "CHANGE_REQUESTED",
];

const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["DOCUMENT_VERIFICATION", "UNDER_REVIEW", "REJECTED", "PAYMENT_PENDING"],
  DOCUMENT_VERIFICATION: ["UNDER_REVIEW", "SUBMITTED", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW", "DECISION_PENDING", "REJECTED", "WAITLISTED"],
  INTERVIEW: ["DECISION_PENDING", "UNDER_REVIEW", "REJECTED"],
  DECISION_PENDING: ["OFFERED", "REJECTED", "WAITLISTED"],
  OFFERED: ["FEE_REQUESTED", "REJECTED", "PAYMENT_PENDING"],
  REJECTED: [],
  WAITLISTED: ["OFFERED", "REJECTED", "UNDER_REVIEW"],
  FEE_REQUESTED: ["OFFERED", "PAID"],
  ENROLLED: [],
  PAYMENT_PENDING: ["PAID", "REJECTED", "OFFERED"],
  PAID: ["ENROLLED", "LOCKED"],
  LOCKED: ["CHANGE_REQUESTED"],
  CHANGE_REQUESTED: ["UNDER_REVIEW", "LOCKED"],
};

export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatuses(from: ApplicationStatus): ApplicationStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? [];
}
