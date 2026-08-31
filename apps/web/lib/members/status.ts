export type MembershipAccessState = "active" | "suspended" | "expired";

export function membershipAccessState(input: {
  status: "ACTIVE" | "SUSPENDED";
  expiresAt: Date | string | null;
  now?: Date;
}): MembershipAccessState {
  if (input.status === "SUSPENDED") return "suspended";
  const now = input.now ?? new Date();
  if (input.expiresAt && new Date(input.expiresAt).getTime() <= now.getTime()) {
    return "expired";
  }
  return "active";
}

export function canAuthenticateMembership(input: {
  status: "ACTIVE" | "SUSPENDED";
  expiresAt: Date | string | null;
  now?: Date;
}) {
  return membershipAccessState(input) === "active";
}
