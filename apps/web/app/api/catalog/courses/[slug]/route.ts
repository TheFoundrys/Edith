import { jsonError, jsonOk } from "@/lib/api/http";
import { getPublishedCatalogCourseBySlug } from "@/lib/catalog/service";

/**
 * GET /api/catalog/courses/[slug]
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const course = await getPublishedCatalogCourseBySlug(slug);
  if (!course) {
    return jsonError("Course not found", 404);
  }
  return jsonOk({ course });
}
