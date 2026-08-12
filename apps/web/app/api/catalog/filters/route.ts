import { jsonOk } from "@/lib/api/http";
import { getCatalogFilters } from "@/lib/catalog/service";

/**
 * GET /api/catalog/filters
 * Available Course Finder options for published courses.
 */
export async function GET() {
  const result = await getCatalogFilters();
  return jsonOk(result);
}
