import { NextResponse } from "next/server";

const AUTH_SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

/** Clears a stale Auth.js cookie then sends the user to a stable login URL. */
export async function GET(request: Request) {
  const incoming = new URL(request.url);
  const dest = new URL("/login", incoming.origin);
  dest.searchParams.set("notice", "session_expired");
  const callbackUrl = incoming.searchParams.get("callbackUrl");
  if (callbackUrl) dest.searchParams.set("callbackUrl", callbackUrl);

  const res = NextResponse.redirect(dest);
  for (const name of AUTH_SESSION_COOKIES) {
    res.cookies.set(name, "", { expires: new Date(0), path: "/" });
  }
  return res;
}
