type TokenCache = { token: string; expiresAt: number };

let tokenCache: TokenCache | null = null;

export function getCrmConfig() {
  return {
    baseUrl: (process.env.CRM_BASE_URL ?? "https://dev-crm.thefoundrys.com/api/v1").replace(
      /\/$/,
      "",
    ),
    tenantId: process.env.CRM_TENANT_ID ?? "",
    email: process.env.CRM_EMAIL ?? "",
    password: process.env.CRM_PASSWORD ?? "",
    apiKey: process.env.CRM_API_KEY ?? "",
    defaultCatalogId: process.env.CRM_DEFAULT_CATALOG_ID ?? "",
  };
}

export class CrmHttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown,
  ) {
    super(message);
    this.name = "CrmHttpError";
  }
}

export async function crmFetch<T = unknown>(
  path: string,
  init: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { baseUrl } = getCrmConfig();
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (init.auth) {
    const token = await getAccessToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const message =
      typeof body === "object" &&
      body &&
      "message" in body &&
      typeof (body as { message: unknown }).message === "string"
        ? (body as { message: string }).message
        : `CRM request failed (${res.status})`;
    throw new CrmHttpError(message, res.status, body);
  }

  return body as T;
}

async function getAccessToken(): Promise<string> {
  const { email, password } = getCrmConfig();
  if (!email || !password) {
    throw new Error("CRM_EMAIL and CRM_PASSWORD are required for authenticated CRM calls");
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const body = await crmFetch<{
    token?: string;
    accessToken?: string;
    data?: { token?: string; accessToken?: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  const token =
    body.token ||
    body.accessToken ||
    body.data?.token ||
    body.data?.accessToken;

  if (!token) {
    throw new Error("CRM login succeeded but no token was returned");
  }

  tokenCache = {
    token,
    expiresAt: Date.now() + 50 * 60 * 1000,
  };
  return token;
}

export type CrmPublicProgram = {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  location?: string | null;
  status?: string;
  baseFee?: number;
};

export async function listPublicPrograms(): Promise<CrmPublicProgram[]> {
  return crmFetch<CrmPublicProgram[]>("/programs/public");
}

export function matchCatalogId(
  programs: CrmPublicProgram[],
  programName: string,
  tenantId?: string,
): string | null {
  const scoped = tenantId
    ? programs.filter((p) => p.tenantId === tenantId)
    : programs;
  const needle = programName.toLowerCase();

  const exact = scoped.find((p) => p.name.toLowerCase() === needle);
  if (exact) return exact.id;

  const partial = scoped.find(
    (p) =>
      p.name.toLowerCase().includes(needle) ||
      needle.includes(p.name.toLowerCase()) ||
      overlapScore(p.name, programName) >= 2,
  );
  return partial?.id ?? null;
}

function overlapScore(a: string, b: string) {
  const aw = new Set(a.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  const bw = b.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return bw.filter((w) => aw.has(w) && w.length > 2).length;
}
