export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret-change-me",
  apiPort: Number(process.env.API_PORT || 3001),
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:5173",
  allowPublicRegistration: process.env.ALLOW_PUBLIC_REGISTRATION !== "false",
  defaultOrgSlug: process.env.DEFAULT_ORG_SLUG?.trim() || "",
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: process.env.NODE_ENV === "production",
};
