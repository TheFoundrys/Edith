import { ProgramCategory } from "@prisma/client";
import { listCompassEnrollmentsForStats } from "@/lib/compass/platform-stats";
import { prisma } from "@/lib/db";
import { isCompassDatabase } from "@/lib/db/profile";
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
  if (isCompassDatabase()) {
    const rows = await listCompassEnrollmentsForStats();
    return rows.map((row) => {
      const when = row.createdAt;
      const completed = row.status === "COMPLETED" || row.completedAt != null;
      const category = ProgramCategory.CERTIFICATION;
      return {
        id: row.id,
        userName: row.userName,
        userEmail: row.userEmail,
        courseTitle: displayProgramName(row.courseTitle ?? "Course", category),
        categoryLabel: programCategoryLabel(category),
        dateLabel: formatShortDate(when),
        timeLabel: formatTime(when),
        status: completed ? "Completed" : "In Progress",
        userHref: `/admin/members?q=${encodeURIComponent(row.userEmail)}`,
        courseHref: row.courseId ? `/admin/programs/${row.courseId}` : "/admin/programs",
      };
    });
  }

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
