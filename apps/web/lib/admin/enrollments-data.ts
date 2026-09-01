import { prisma } from "@/lib/db";
import { displayProgramName, programCategoryLabel } from "@/lib/programs/categories";
import type { AdminRecentEnrollment } from "@/lib/admin/dashboard-data";

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export async function getAdminEnrollments(orgId: string): Promise<AdminRecentEnrollment[]> {
  const rows = await prisma.enrollment.findMany({
    where: { organizationId: orgId },
    include: {
      user: { select: { name: true, email: true } },
      program: { select: { id: true, title: true, category: true } },
    },
    orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((row) => {
    const when = row.enrolledAt ?? row.createdAt;
    const completed = row.status === "COMPLETED" || row.completedAt != null;
    return {
      id: row.id,
      userName: row.user.name,
      userEmail: row.user.email,
      courseTitle: displayProgramName(row.program.title, row.program.category),
      categoryLabel: programCategoryLabel(row.program.category),
      dateLabel: formatShortDate(when),
      timeLabel: formatTime(when),
      status: completed ? "Completed" : "In Progress",
      userHref: `/admin/members?q=${encodeURIComponent(row.user.email)}`,
      courseHref: `/admin/programs/${row.program.id}`,
    };
  });
}
