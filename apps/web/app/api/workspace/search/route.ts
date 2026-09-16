import { requireApiSession } from "@/lib/api/auth";
import { isStaffRole } from "@/lib/auth/roles";
import { canUser } from "@/lib/auth/session";
import { jsonOk } from "@/lib/api/http";
import { catalogHrefForProgram } from "@/lib/assessments/personality-profile";
import { searchStaffPrograms } from "@/lib/compass/program-bridge";
import { isCompassDatabase } from "@/lib/db/profile";
import { displayProgramName } from "@/lib/programs/categories";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await requireApiSession();
  if (!session.ok) return session.response;

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return jsonOk({ results: [] as const });

  const user = session.user;
  const staff = isStaffRole(user.role);
  const organizationId = user.organizationId;
  const canEditPrograms = canUser(user, "managePrograms");
  const canViewPrograms = canEditPrograms || canUser(user, "managePricing");
  const results: {
    type: string;
    title: string;
    href: string;
    subtitle?: string;
  }[] = [];

  const programs = await searchStaffPrograms(organizationId, q, {
    staffCanViewDrafts: staff && canViewPrograms,
    limit: 8,
  });

  for (const program of programs) {
    results.push({
      type: "Course",
      title: displayProgramName(program.title, program.category),
      subtitle: staff && canViewPrograms ? "Program" : "Course",
      href: canEditPrograms
        ? `/admin/programs/${program.id}`
        : canViewPrograms
          ? "/admin/programs"
          : catalogHrefForProgram(program),
    });
  }

  if (staff && canUser(user, "manageMembers") && !isCompassDatabase()) {
    const members = await prisma.user.findMany({
      where: {
        memberships: { some: { organizationId } },
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      select: { id: true, name: true, email: true },
    });
    for (const member of members) {
      results.push({
        type: "Person",
        title: member.name,
        subtitle: member.email,
        href: `/admin/members?q=${encodeURIComponent(q)}`,
      });
    }
  }

  return jsonOk({ results: results.slice(0, 12) });
}
