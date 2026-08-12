import { ProgramStatus } from "@prisma/client";
import { requireApiCapability } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { catalogCourseWriteSchema } from "@/lib/catalog/schemas";
import {
  createAdminCatalogCourse,
  listAdminCatalogCourses,
} from "@/lib/catalog/service";

/**
 * GET /api/catalog/admin/courses
 * Query: status, q
 */
export async function GET(req: Request) {
  const authResult = await requireApiCapability("managePrograms");
  if (!authResult.ok) return authResult.response;

  const url = new URL(req.url);
  const statusRaw = url.searchParams.get("status");
  const status =
    statusRaw &&
    (Object.values(ProgramStatus) as string[]).includes(statusRaw)
      ? (statusRaw as ProgramStatus)
      : undefined;

  const result = await listAdminCatalogCourses(authResult.user, {
    status,
    q: url.searchParams.get("q") ?? undefined,
  });
  return jsonOk(result);
}

/**
 * POST /api/catalog/admin/courses
 */
export async function POST(req: Request) {
  const authResult = await requireApiCapability("managePrograms");
  if (!authResult.ok) return authResult.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = catalogCourseWriteSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid course payload", 400, {
      issues: parsed.error.flatten(),
    });
  }

  const result = await createAdminCatalogCourse(authResult.user, parsed.data);
  if (!result.ok) {
    return jsonError(result.error, result.status);
  }
  return jsonOk({ course: result.course }, { status: 201 });
}
