import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { isStaffRole } from "@/lib/auth/roles";

// Edge-safe instance only — never import `@/lib/auth` (Prisma) from middleware.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isAdmin = pathname.startsWith("/admin");
  const isStudent = pathname.startsWith("/student");
  const isCheckoutFlow =
    pathname.startsWith("/enroll") || pathname.startsWith("/checkout");
  const forceReauth =
    pathname.startsWith("/login") &&
    req.nextUrl.searchParams.get("error") === "session_expired";

  const hasUser =
    Boolean(session?.user?.id) && session?.error !== "InvalidSession";

  // Stale JWT after DB reseed: bounce through a Node route that can clear the
  // cookie (Auth.js middleware would re-set it if we cleared here).
  if (forceReauth) {
    const url = new URL("/api/auth/clear-stale", req.nextUrl.origin);
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    if (callbackUrl) url.searchParams.set("callbackUrl", callbackUrl);
    return NextResponse.redirect(url);
  }

  if ((isAdmin || isStudent || isCheckoutFlow) && !hasUser) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set(
      "callbackUrl",
      `${pathname}${req.nextUrl.search || ""}`,
    );
    return NextResponse.redirect(url);
  }

  if (isAdmin && hasUser && !isStaffRole(session?.user?.role)) {
    return NextResponse.redirect(new URL("/student/dashboard", req.nextUrl.origin));
  }

  if (isStudent && hasUser && isStaffRole(session?.user?.role)) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  if (isCheckoutFlow && hasUser && isStaffRole(session?.user?.role)) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  if (isAuthPage && hasUser) {
    const dest = isStaffRole(session?.user?.role) ? "/admin" : "/student/dashboard";
    return NextResponse.redirect(new URL(dest, req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/student/:path*",
    "/enroll/:path*",
    "/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
