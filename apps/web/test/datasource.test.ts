import assert from "node:assert/strict";
import test from "node:test";
import {
  databaseTargetFromEnv,
  prismaDatasourceUrl,
} from "@/lib/db/datasource";

test("databaseTargetFromEnv parses host and database name", () => {
  const target = databaseTargetFromEnv(
    "postgresql://postgres:secret@192.168.1.3:5432/compass_dev?schema=public",
  );
  assert.deepEqual(target, {
    host: "192.168.1.3",
    port: "5432",
    database: "compass_dev",
    schema: "public",
  });
});

test("prismaDatasourceUrl adds connection timeouts", () => {
  const url = prismaDatasourceUrl(
    "postgresql://postgres:secret@192.168.1.3:5432/compass_dev?schema=public",
  );
  assert.ok(url?.includes("connect_timeout=5"));
  assert.ok(url?.includes("pool_timeout=8"));
});
