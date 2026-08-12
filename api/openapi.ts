/**
 * Minimal OpenAPI stub for EDITH API.
 * Expand with full schemas as routes stabilize.
 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "EDITH API",
    version: "0.1.0",
    description: "Express API for EDITH LMS (SPA + API restructure)",
  },
  servers: [{ url: "/api" }],
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": { description: "OK" } } },
    },
    "/auth/login": {
      post: { summary: "Login", responses: { "200": { description: "Session cookie set" } } },
    },
    "/auth/me": {
      get: { summary: "Current user", responses: { "200": { description: "User + capabilities" } } },
    },
    "/programs/published": {
      get: { summary: "Published programs", responses: { "200": { description: "Program list" } } },
    },
  },
};
