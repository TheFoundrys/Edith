import { api } from "./client";

export function listPublishedPrograms() {
  return api<{ programs: Array<Record<string, unknown>> }>("/api/programs/published");
}

export function getProgramBySlug(slug: string) {
  return api<{ program: Record<string, unknown> }>(`/api/programs/slug/${slug}`);
}

export function listAdminPrograms() {
  return api<{ programs: Array<Record<string, unknown>> }>("/api/programs/admin");
}

export function createProgram(data: Record<string, unknown>) {
  return api<{ program: Record<string, unknown> }>("/api/programs/admin", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function myEnrollments() {
  return api<{ enrollments: Array<Record<string, unknown>> }>(
    "/api/programs/enrollments/me",
  );
}

export function enroll(programId: string) {
  return api<{ ok: true }>("/api/programs/enroll", {
    method: "POST",
    body: JSON.stringify({ programId }),
  });
}

export function modulesGet<T>(path: string) {
  return api<T>(`/api/modules${path}`);
}

export function modulesPost<T>(path: string, body: unknown) {
  return api<T>(`/api/modules${path}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function modulesPut<T>(path: string, body: unknown) {
  return api<T>(`/api/modules${path}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
