/**
 * Verify DATABASE_URL reaches Postgres and the expected schema is present.
 * Read-only — does not migrate or modify the database.
 *
 *   npx tsx scripts/check-db-connection.ts
 */
import { databaseTargetFromEnv } from "../lib/db/datasource";
import { isCompassDatabase } from "../lib/db/profile";
import { prisma } from "../lib/db";

async function main() {
  const target = databaseTargetFromEnv();
  if (!target) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const compass = isCompassDatabase();
  console.log(
    `Checking ${target.host}:${target.port}/${target.database} (schema ${target.schema})…`,
  );
  console.log(`Profile: ${compass ? "compass (Course/Domain)" : "edith (Program/Organization)"}`);

  try {
    await prisma.$queryRaw`SELECT 1 AS ok`;

    if (compass) {
      const courses = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "Course" WHERE "isPublished" = true
      `;
      const users = await prisma.user.count();
      const domains = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM "Domain"
      `;
      console.log("Connection OK (compass_dev).");
      console.log(`  Published courses: ${Number(courses[0]?.count ?? 0)}`);
      console.log(`  Users: ${users}`);
      console.log(`  Domains: ${Number(domains[0]?.count ?? 0)}`);
      console.log(
        "  Tip: set DEFAULT_ORG_SLUG to a Domain slug (e.g. ai) to filter the catalogue.",
      );
      return;
    }

    const programs = await prisma.program.count();
    const memberships = await prisma.membership.count();
    console.log("Connection OK (edith schema).");
    console.log(`  Program rows: ${programs}`);
    console.log(`  Membership rows: ${memberships}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Connection failed:", message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
