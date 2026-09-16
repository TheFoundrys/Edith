/** Browser origin for CentraCRM (not the `/api/v1` base). */
export function getCrmAppOrigin(): string {
  const explicit = process.env.CRM_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const api = (
    process.env.CRM_BASE_URL ?? "https://dev-crm.thefoundrys.com/api/v1"
  ).replace(/\/$/, "");
  return api.replace(/\/api\/v\d+$/i, "") || "https://dev-crm.thefoundrys.com";
}

export function crmApplicationsHref(applicationId?: string | null) {
  const origin = getCrmAppOrigin();
  if (applicationId) {
    return `${origin}/applications/${encodeURIComponent(applicationId)}`;
  }
  return `${origin}/applications`;
}

export function crmApplyHref(opts?: {
  programSlug?: string | null;
  catalogId?: string | null;
}) {
  const url = new URL("/applications", `${getCrmAppOrigin()}/`);
  url.searchParams.set("source", "edith");
  if (opts?.programSlug) url.searchParams.set("program", opts.programSlug);
  if (opts?.catalogId) url.searchParams.set("catalogId", opts.catalogId);
  return url.toString();
}
