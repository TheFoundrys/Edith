import { api } from "./client";
import type { SessionUser } from "@shared/types/session";
import type { Capability, StaffNavItem } from "@shared/constants/roles";

export type MeResponse = {
  user: SessionUser;
  capabilities: Capability[];
  isStaff: boolean;
  staffNav: StaffNavItem[];
};

export function login(email: string, password: string) {
  return api<{ user: SessionUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  name: string;
  email: string;
  password: string;
  consent: boolean;
}) {
  return api<{ ok: true }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function logout() {
  return api<{ ok: true }>("/api/auth/logout", { method: "POST" });
}

export function me() {
  return api<MeResponse>("/api/auth/me");
}

export function forgotPassword(email: string) {
  return api<{ ok: true; resetUrl?: string; message: string }>(
    "/api/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) },
  );
}

export function resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}) {
  return api<{ ok: true } | { error: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
