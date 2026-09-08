import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isStaffRole } from "@/lib/auth/roles";
import {
  authorizationUrl,
  createOauthState,
  digilockerConfigured,
  digilockerRedirectUri,
  oauthCookieName,
  pkceChallengeFor,
} from "@/lib/digilocker/client";
import { loadPersonalityProgram } from "@/lib/digilocker/persist";
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

function loginUrl(request: Request) {
  const url = publicRequestUrl(request, "/login");
  url.searchParams.set("callbackUrl", PERSONALITY_PROFILE_HREF);
  return url;
}

function oauthCookieOptions(origin: string) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
    secure: origin.startsWith("https://"),
  };
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.error === "InvalidSession") {
    return NextResponse.redirect(loginUrl(request));
  }
  if (isStaffRole(session.user.role) || session.user.role !== "STUDENT") {
    return NextResponse.redirect(publicRequestUrl(request, "/admin"));
  }

  const enrolled = await loadPersonalityProgram(
    session.user.organizationId,
  );
  if ("error" in enrolled) {
    return NextResponse.redirect(hubUrl(request, { error: "aadhaar_failed" }));
  }

  if (!digilockerConfigured()) {
    return NextResponse.redirect(
      hubUrl(request, { error: "digilocker_unconfigured" }),
    );
  }

  const origin = publicRequestOrigin(request);
  const redirectUri = digilockerRedirectUri(origin);
  const { token, nonce, verifier } = createOauthState(
    session.user.id,
    session.user.organizationId,
  );
  const res = NextResponse.redirect(
    authorizationUrl(nonce, redirectUri, pkceChallengeFor(verifier)),
  );
  res.cookies.set(oauthCookieName(), token, oauthCookieOptions(origin));
  return res;
}
