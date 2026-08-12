import { Router } from "express";
import * as authService from "../../src/backend/services/auth.service.js";
import {
  authOptional,
  clearSessionCookie,
  requireAuth,
  setSessionCookie,
  signSessionToken,
  type AuthedRequest,
} from "../../src/backend/middleware/auth.js";
import {
  capabilitiesFor,
  isStaffRole,
  staffNavFor,
} from "../../src/shared/constants/roles.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const result = await authService.login(req.body);
  if ("error" in result) {
    res.status(401).json(result);
    return;
  }
  const token = await signSessionToken(result.user);
  setSessionCookie(res, token);
  res.json({ user: result.user });
});

authRouter.post("/register", async (req, res) => {
  const result = await authService.registerStudent(req.body);
  if ("error" in result) {
    res.status(400).json(result);
    return;
  }
  res.status(201).json(result);
});

authRouter.post("/logout", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", authOptional, async (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const user = req.user;
  res.json({
    user,
    capabilities: capabilitiesFor(user.role),
    isStaff: isStaffRole(user.role),
    staffNav: staffNavFor(user.role),
  });
});

authRouter.post("/forgot-password", async (req, res) => {
  const result = await authService.requestPasswordReset(req.body);
  res.json(result);
});

authRouter.post("/reset-password", async (req, res) => {
  const result = await authService.resetPassword(req.body);
  if ("error" in result) {
    res.status(400).json(result);
    return;
  }
  res.json(result);
});

authRouter.post("/clear-stale", (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// silence unused requireAuth import warning by exporting a health that needs auth
authRouter.get("/session-check", requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});
