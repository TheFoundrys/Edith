import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const migrationsDir = path.resolve(process.cwd(), "../../database/migrations");

async function main() {
  const files = await readdir(migrationsDir);
  const forward = files
    .filter((file) => file.endsWith(".sql") && !file.endsWith(".down.sql"))
    .sort();

  const timestamps = new Set<string>();
  for (const file of forward) {
    const timestamp = file.split("_", 1)[0];
    if (!/^\d{14}$/.test(timestamp)) {
      throw new Error(`Migration must begin with a 14-digit timestamp: ${file}`);
    }
    if (timestamps.has(timestamp)) {
      throw new Error(`Duplicate migration timestamp: ${timestamp}`);
    }
    timestamps.add(timestamp);

    const down = file.replace(/\.sql$/, ".down.sql");
    if (!files.includes(down)) {
      throw new Error(`Missing rollback migration: ${down}`);
    }
    const sql = await readFile(path.join(migrationsDir, file), "utf8");
    if (!sql.trim()) throw new Error(`Migration is empty: ${file}`);
    const checksum = createHash("sha256").update(sql).digest("hex").slice(0, 12);
    console.log(`${file} ${checksum}`);
  }

  console.log(`Verified ${forward.length} forward/rollback migration pairs.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
