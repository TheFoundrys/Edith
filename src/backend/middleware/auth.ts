import type { NextFunction, Request, Response } from "express";
import { SignJWT, jwtVerify } from "jose";
import {
  can,
  isStaffRole,
  type AppRole,
  type Capability,
} from "../../shared/constants/roles.js";
import type { SessionUser } from "../../shared/types/session.js";
import { env } from "../config/env.js";
import { prisma } from "../repositories/prisma.js";

const COOKIE_NAME = "edith_session";
const secret = () => new TextEncoder().encode(env.jwtSecret);

export type AuthedRequest = Request & { user?: SessionUser };

export async function signSessionToken(user: SessionUser) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export function setSessionCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export async function readSession(req: Request): Promise<SessionUser | null> {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.organizationId || !payload.role) return null;
    return {
      id: String(payload.id),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role),
      organizationId: String(payload.organizationId),
    };
  } catch {
    return null;
  }
}

/** Refresh role/org from membership (handles reseeds). */
export async function resolveSessionUser(
  base: SessionUser,
): Promise<SessionUser | null> {
  const membership = await prisma.membership.findFirst({
    where: { userId: base.id },
  });
  if (membership) {
    return {
      ...base,
      role: membership.role,
      organizationId: membership.organizationId,
    };
  }
  if (base.email) {
    const byEmail = await prisma.user.findUnique({
      where: { email: base.email.toLowerCase() },
      include: { memberships: { take: 1 } },
    });
    if (byEmail?.memberships[0]) {
      return {
        id: byEmail.id,
        email: byEmail.email,
        name: byEmail.name,
        role: byEmail.memberships[0].role,
        organizationId: byEmail.memberships[0].organizationId,
      };
    }
  }
  return null;
}

export async function authOptional(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const base = await readSession(req);
  if (base) {
    const resolved = await resolveSessionUser(base);
    if (resolved) req.user = resolved;
  }
  next();
}

export async function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  const base = await readSession(req);
  if (!base) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const resolved = await resolveSessionUser(base);
  if (!resolved) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }
  req.user = resolved;
  next();
}

export function requireStaff(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user || !isStaffRole(req.user.role)) {
    res.status(403).json({ error: "Staff only" });
    return;
  }
  next();
}

export function requireCapability(capability: Capability) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !isStaffRole(req.user.role as AppRole)) {
      res.status(403).json({ error: "Staff only" });
      return;
    }
    if (!can(req.user.role, capability)) {
      res.status(403).json({ error: "Missing capability" });
      return;
    }
    next();
  };
}

export function requireStudent(
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) {
  if (!req.user || req.user.role !== "STUDENT") {
    res.status(403).json({ error: "Student only" });
    return;
  }
  next();
}
