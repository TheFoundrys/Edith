const ADMIT_STATUSES = new Set([
  "ENROLLED",
  "ADMITTED",
  "APPROVED",
  "ACCEPTED",
]);

const REJECT_STATUSES = new Set(["REJECTED", "DECLINED", "WITHDRAWN"]);

function normalizeAdmissionStatus(status: string) {
  return status.trim().toUpperCase().replace(/\s+/g, "_");
}

export function parseAdmissionCallbackStatus(status: string) {
  const normalized = normalizeAdmissionStatus(status);
  if (ADMIT_STATUSES.has(normalized)) return "ADMIT" as const;
  if (REJECT_STATUSES.has(normalized)) return "REJECT" as const;
  return null;
}
