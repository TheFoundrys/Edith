import "server-only";

import { isCompassDatabase } from "@/lib/db/profile";

/** Features that require Edith-only tables (Membership, Application, …). */
export type EdithOnlyFeature =
  | "members"
  | "invites"
  | "roles-matrix"
  | "applications"
  | "offers"
  | "coupons"
  | "payment-settings"
  | "ai-plugins"
  | "intakes"
  | "rag"
  | "workspace-search"
  | "edith-mcq-admin"
  | "edith-quizzes"
  | "forms";

export function isEdithOnlyFeature(feature: EdithOnlyFeature): boolean {
  if (!isCompassDatabase()) return false;
  return true;
}

export function compassFeatureUnavailableMessage(feature: EdithOnlyFeature): string {
  const labels: Record<EdithOnlyFeature, string> = {
    members: "Member management",
    invites: "Staff invites",
    "roles-matrix": "Roles & access matrix",
    applications: "Application inbox",
    offers: "Personal offers",
    coupons: "Coupons",
    "payment-settings": "Payment settings",
    "ai-plugins": "AI plugins",
    intakes: "Intake scheduling",
    rag: "AI retrieval index",
    "workspace-search": "Workspace search",
    "edith-mcq-admin": "Edith MCQ banks",
    "edith-quizzes": "Edith quizzes",
    forms: "Application forms",
  };
  return `${labels[feature]} is not available on compass_dev. Use edith_dev for full LMS admin, or manage content in Skill Compass.`;
}
