import { parsePositiveInt, jsonOk } from "@/lib/api/http";
import { listPublishedCatalogCourses } from "@/lib/catalog/service";

/**
 * GET /api/catalog/courses
 *
 * Query: suite, duration, experience, category (legacy), q, page, pageSize, sort
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const result = await listPublishedCatalogCourses({
    suite: url.searchParams.get("suite") ?? undefined,
    category: url.searchParams.get("category") ?? undefined,
    duration: url.searchParams.get("duration") ?? undefined,
    experience: url.searchParams.get("experience") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    page: parsePositiveInt(url.searchParams.get("page"), 1),
    pageSize: parsePositiveInt(url.searchParams.get("pageSize"), 50, 100),
    sort: (["name", "updated", "tuition"].includes(
      url.searchParams.get("sort") ?? "",
    )
      ? (url.searchParams.get("sort") as "name" | "updated" | "tuition")
      : "name"),
  });

  return jsonOk(result);
}
