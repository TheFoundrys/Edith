import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

process.env.VITEST = "true";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

describe("api health", () => {
  let app: Awaited<typeof import("../../../src/backend/server")>["app"];

  beforeAll(async () => {
    ({ app } = await import("../../../src/backend/server"));
  });

  it("returns health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
