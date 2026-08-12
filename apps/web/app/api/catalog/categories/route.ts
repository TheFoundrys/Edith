import { jsonOk } from "@/lib/api/http";
import { getCatalogCategories } from "@/lib/catalog/service";

/**
 * GET /api/catalog/categories
 * Programme suites (YGP, PGP, Fellowship, AMP, CoE).
 */
export async function GET() {
  return jsonOk(getCatalogCategories());
}
