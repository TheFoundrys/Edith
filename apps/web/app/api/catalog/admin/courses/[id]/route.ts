import { requireApiCapability } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { catalogCoursePatchSchema } from "@/lib/catalog/schemas";
import {
  getAdminCatalogCourse,
  updateAdminCatalogCourse,
} from "@/lib/catalog/service";

/**
 * GET /api/catalog/admin/courses/[id]
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiCapability("managePrograms");
  if (!authResult.ok) return authResult.response;

  const { id } = await ctx.params;
  const course = await getAdminCatalogCourse(authResult.user, id);
  if (!course) return jsonError("Course not found", 404);
  return jsonOk({ course });
}

/**
 * PATCH /api/catalog/admin/courses/[id]
 */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiCapability("managePrograms");
  if (!authResult.ok) return authResult.response;

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = catalogCoursePatchSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid course payload", 400, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await updateAdminCatalogCourse(
    authResult.user,
    id,
    parsed.data,
  );
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }
  return jsonOk({ course: result.course });
}
