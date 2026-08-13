import { jsonOk } from "@/lib/api/http";
import { dumpPublishedCatalog } from "@/lib/catalog/service";

/**
 * GET /api/catalog/dump
 *
 * Full published catalogue in one response: courses (with syllabus outline),
 * categories, and the available Course Finder filters.
 *
 * Query: syllabus=0 to omit module/lesson outlines.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const syllabusParam = url.searchParams.get("syllabus");
  const includeSyllabus = !["0", "false", "no"].includes(
    (syllabusParam ?? "").toLowerCase(),
  );

  const result = await dumpPublishedCatalog({ includeSyllabus });

  return jsonOk(result, {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
    },
  });
}
