import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getSiteOrigin } from "@/lib/urls";

const COOKIE = "edith_digilocker";

export function digilockerConfigured() {
  return Boolean(
    process.env.DIGILOCKER_CLIENT_ID?.trim() &&
      process.env.DIGILOCKER_CLIENT_SECRET?.trim(),
  );
}

export function digilockerBaseUrl() {
  return (
    process.env.DIGILOCKER_BASE_URL?.trim() ||
    "https://digilocker.meripehchaan.gov.in/public/oauth2"
  );
}

export function digilockerRedirectUri(requestOrigin?: string) {
  const explicit = process.env.DIGILOCKER_REDIRECT_URI?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const origin = getSiteOrigin() || requestOrigin || "http://localhost:3059";
  return `${origin.replace(/\/$/, "")}/api/digilocker/callback`;
}

function signingKey() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.DIGILOCKER_CLIENT_SECRET?.trim() ||
    "edith-digilocker-dev"
  );
}

export type DigilockerOauthState = {
  nonce: string;
  userId: string;
  organizationId: string;
  ts: number;
  verifier: string;
};

function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function createOauthState(userId: string, organizationId: string) {
  const payload: DigilockerOauthState = {
    nonce: randomBytes(16).toString("hex"),
    userId,
    organizationId,
    ts: Date.now(),
    verifier: randomBytes(32).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", signingKey()).update(body).digest("base64url");
  return { token: `${body}.${sig}`, nonce: payload.nonce, verifier: payload.verifier };
}

export function readOauthState(token: string | undefined): DigilockerOauthState | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", signingKey()).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as DigilockerOauthState;
    if (Date.now() - payload.ts > 10 * 60 * 1000) return null;
    if (!payload.nonce || !payload.userId || !payload.organizationId || !payload.verifier) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function oauthCookieName() {
  return COOKIE;
}

export function authorizationUrl(
  nonce: string,
  redirectUri: string,
  codeChallenge?: string,
) {
  const clientId = process.env.DIGILOCKER_CLIENT_ID?.trim() ?? "";
  const url = new URL(`${digilockerBaseUrl()}/1/authorize`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", nonce);
  url.searchParams.set("scope", "openid");
  url.searchParams.set("acr", "aadhaar");
  if (codeChallenge) {
    url.searchParams.set("code_challenge", codeChallenge);
    url.searchParams.set("code_challenge_method", "S256");
  }
  return url.toString();
}

function compactHmac(value: string) {
  return value.replace(/\s+/g, "");
}

function sameHmac(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

export function fileHmacMatches(body: Buffer, hmacHeader: string | null, secret: string) {
  if (!hmacHeader) return false;
  const header = compactHmac(hmacHeader);
  const b64 = compactHmac(createHmac("sha256", secret).update(body).digest("base64"));
  const hex = createHmac("sha256", secret).update(body).digest("hex");
  return (
    sameHmac(header, b64) ||
    sameHmac(header.toLowerCase(), hex) ||
    sameHmac(header.toUpperCase(), hex.toUpperCase())
  );
}

export type DigilockerToken = {
  accessToken: string;
  eaadhaar: boolean | null;
  name: string;
};

export async function exchangeAuthorizationCode(
  code: string,
  redirectUri: string,
  codeVerifier?: string,
): Promise<DigilockerToken> {
  const clientId = process.env.DIGILOCKER_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET?.trim() ?? "";
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });
  if (codeVerifier) body.set("code_verifier", codeVerifier);

  const response = await fetch(`${digilockerBaseUrl()}/2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await response.text();
  let json: {
    access_token?: string;
    eaadhaar?: string;
    name?: string;
    error?: string;
    error_description?: string;
  };
  try {
    json = JSON.parse(text) as typeof json;
  } catch {
    throw new Error("DigiLocker token exchange returned an unreadable response.");
  }
  if (!response.ok || !json.access_token) {
    throw new Error(json.error_description || json.error || "DigiLocker token exchange failed.");
  }
  return {
    accessToken: json.access_token,
    eaadhaar:
      json.eaadhaar === "Y" ? true : json.eaadhaar === "N" ? false : null,
    name: (json.name ?? "").trim(),
  };
}

export async function fetchEaadhaarXml(accessToken: string) {
  const secret = process.env.DIGILOCKER_CLIENT_SECRET?.trim() ?? "";
  const response = await fetch(`${digilockerBaseUrl()}/3/xml/eaadhaar`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      response.status === 404
        ? "NO_EAADHAAR"
        : text.slice(0, 200) || "Could not fetch e-Aadhaar from DigiLocker.",
    );
  }
  const body = Buffer.from(await response.arrayBuffer());
  const hmac =
    response.headers.get("hmac") ||
    response.headers.get("HMAC") ||
    response.headers.get("x-hmac");
  if (hmac && secret && !fileHmacMatches(body, hmac, secret)) {
    throw new Error("DigiLocker e-Aadhaar failed integrity check.");
  }
  return body.toString("utf8");
}

export function pkceChallengeFor(verifier: string) {
  return pkceChallenge(verifier);
}

/** Pull uid / name from DigiLocker or UIDAI e-Aadhaar XML without keeping the full UID. */
export function parseEaadhaarXml(xml: string) {
  const uid =
    xml.match(/\buid=["']([Xx0-9]{4,12})["']/i)?.[1] ??
    xml.match(/<Uid>([Xx0-9]{4,12})<\/Uid>/i)?.[1] ??
    "";
  const name =
    xml.match(/\bname=["']([^"']+)["']/i)?.[1] ??
    xml.match(/<Poi[^>]*\bname=["']([^"']+)["']/i)?.[1] ??
    xml.match(/<name>([^<]+)<\/name>/i)?.[1] ??
    "";
  const digits = uid.replace(/\D/g, "");
  if (digits.length < 4) {
    return { error: "DigiLocker did not return a usable Aadhaar reference." };
  }
  return {
    uidDigits: digits.length === 12 ? digits : "",
    last4: digits.slice(-4),
    name: name.trim(),
  };
}
