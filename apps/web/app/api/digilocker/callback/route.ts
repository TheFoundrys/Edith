import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/roles";
import {
  digilockerRedirectUri,
  exchangeAuthorizationCode,
  fetchEaadhaarXml,
  oauthCookieName,
  parseEaadhaarXml,
  readOauthState,
} from "@/lib/digilocker/client";
import { persistDigilockerAadhaar } from "@/lib/digilocker/persist";
import { PERSONALITY_PROFILE_HREF } from "@/lib/assessments/personality-profile";
import { publicRequestOrigin, publicRequestUrl } from "@/lib/urls";

function hubUrl(request: Request, params?: Record<string, string>) {
  const url = publicRequestUrl(request, PERSONALITY_PROFILE_HREF);
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}

function clearOauthCookie(res: NextResponse, secure: boolean) {
  res.cookies.set(oauthCookieName(), "", {
    expires: new Date(0),
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
  });
  return res;
}

function failCode(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message === "NO_EAADHAAR" || message.includes("not linked")) {
    return "aadhaar_no_document";
  }
  return "aadhaar_failed";
}

export async function GET(request: NextRequest) {
  const origin = publicRequestOrigin(request);
  const secure = origin.startsWith("https://");
  const incoming = request.nextUrl;
  const fail = (code: string) =>
    clearOauthCookie(NextResponse.redirect(hubUrl(request, { error: code })), secure);

  const session = await auth();
  if (!session?.user?.id || session.error === "InvalidSession") {
    const login = publicRequestUrl(request, "/login");
    login.searchParams.set("callbackUrl", PERSONALITY_PROFILE_HREF);
    return clearOauthCookie(NextResponse.redirect(login), secure);
  }
  if (isStaffRole(session.user.role) || session.user.role !== "STUDENT") {
    return fail("aadhaar_failed");
  }

  if (incoming.searchParams.get("error")) {
    return fail("aadhaar_denied");
  }

  const code = incoming.searchParams.get("code");
  const state = incoming.searchParams.get("state");
  if (!code || !state) return fail("aadhaar_failed");

  const payload = readOauthState(request.cookies.get(oauthCookieName())?.value);
  if (
    !payload ||
    payload.nonce !== state ||
    payload.userId !== session.user.id ||
    payload.organizationId !== session.user.organizationId
  ) {
    return fail("aadhaar_failed");
  }

  try {
    const redirectUri = digilockerRedirectUri(origin);
    const token = await exchangeAuthorizationCode(
      code,
      redirectUri,
      payload.verifier,
    );
    if (token.eaadhaar === false) return fail("aadhaar_no_document");

    const xml = await fetchEaadhaarXml(token.accessToken);
    const parsed = parseEaadhaarXml(xml);
    if ("error" in parsed) return fail("aadhaar_failed");

    const saved = await persistDigilockerAadhaar({
      userId: session.user.id,
      organizationId: session.user.organizationId,
      uidDigits: parsed.uidDigits,
      last4: parsed.last4,
      name: parsed.name || token.name || session.user.name || "",
    });
    if ("error" in saved) return fail("aadhaar_failed");

    return clearOauthCookie(
      NextResponse.redirect(hubUrl(request, { aadhaar: "verified" })),
      secure,
    );
  } catch (error) {
    return fail(failCode(error));
  }
}
