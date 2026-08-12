export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
};

export type ApiError = { error: string };
export type ApiOk = { ok: true };
