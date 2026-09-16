import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  for (const table of ["Course", "Module", "Lesson"]) {
    const cols = await prisma.$queryRaw<
      {
        column_name: string;
        is_nullable: string;
        column_default: string | null;
        data_type: string;
      }[]
    >`
      SELECT column_name, is_nullable, column_default, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = ${table}
      ORDER BY ordinal_position
    `;
    console.log(`\n${table}:`);
    for (const col of cols) {
      console.log(
        `  ${col.column_name} ${col.data_type} nullable=${col.is_nullable} default=${col.column_default ?? "—"}`,
      );
    }
  }
  await prisma.$disconnect();
}

void main();
