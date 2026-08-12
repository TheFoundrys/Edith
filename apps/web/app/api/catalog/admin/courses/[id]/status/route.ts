import { requireApiCapability } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { catalogStatusSchema } from "@/lib/catalog/schemas";
import { setAdminCatalogCourseStatus } from "@/lib/catalog/service";

/**
 * POST /api/catalog/admin/courses/[id]/status
 * Body: { "status": "DRAFT" | "PUBLISHED" | "ARCHIVED" }
 */
export async function POST(
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

  const parsed = catalogStatusSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid status payload", 400, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await setAdminCatalogCourseStatus(
    authResult.user,
    id,
    parsed.data.status,
  );
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }
  return jsonOk({ course: result.course });
}
