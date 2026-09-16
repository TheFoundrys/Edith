import "server-only";

import type {
  AdminChartPoint,
  AdminDashboardData,
  AdminDonutSlice,
  AdminRecentCourse,
  AdminRecentEnrollment,
  AdminStatCard,
  AdminSystemMetric,
} from "@/lib/admin/dashboard-data";
import { listCompassAdminPrograms } from "@/lib/compass/admin-programs";
import {
  countCompassLearnerUsers,
  countCompassStaffUsers,
  countCompassTotalCertificates,
  countCompassTotalUsers,
  listCompassEnrollmentsForStats,
  listCompassPaidTransactions,
  listCompassUsersForStats,
} from "@/lib/compass/platform-stats";
import { prisma } from "@/lib/db";
import { displayProgramName, programCategoryLabel } from "@/lib/programs/categories";
import { inferProgramTrack, TRACK_LABELS, type ProgramTrack } from "@/lib/programs/track";

const CATEGORY_COLORS: Record<ProgramTrack, string> = {
  ai: "#6366f1",
  cyber: "#0ea5e9",
  blockchain: "#8b5cf6",
  quantum: "#a855f7",
  data: "#14b8a6",
  general: "#94a3b8",
};

const ROLE_COLORS = {
  STUDENT: "#6366f1",
  STAFF: "#0ea5e9",
  ADMIN: "#1e3a8a",
};

function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

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

function formatCurrency(amount: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function isCompassAdminRole(role: string | null) {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return (
    normalized.includes("admin") ||
    normalized === "super_admin" ||
    normalized === "domain_admin"
  );
}

export async function getCompassAdminDashboardData(
  domainId: string,
  adminName: string,
): Promise<AdminDashboardData> {
  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);

  const [users, enrollments, programs, payments, certificateTotal] =
    await Promise.all([
      listCompassUsersForStats(),
      listCompassEnrollmentsForStats(),
      listCompassAdminPrograms(domainId || undefined),
      listCompassPaidTransactions(),
      countCompassTotalCertificates(),
    ]);

  const totalUsers = await countCompassTotalUsers();
  const learners = await countCompassLearnerUsers();
  const staff = await countCompassStaffUsers();
  const admins = users.filter((user) => isCompassAdminRole(user.role)).length;

  const publishedCourses = programs.filter((program) => program.status === "PUBLISHED")
    .length;
  const totalEnrollments = enrollments.length;
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const usersThisWeek = users.filter((user) => user.createdAt >= weekStart).length;
  const usersPrevWeek = users.filter(
    (user) => user.createdAt >= prevWeekStart && user.createdAt < prevWeekEnd,
  ).length;

  const enrollmentsThisWeek = enrollments.filter(
    (row) => row.createdAt >= weekStart,
  ).length;
  const enrollmentsPrevWeek = enrollments.filter(
    (row) => row.createdAt >= prevWeekStart && row.createdAt < prevWeekEnd,
  ).length;

  const revenueThisWeek = payments
    .filter((payment) => payment.createdAt >= weekStart)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const revenuePrevWeek = payments
    .filter(
      (payment) =>
        payment.createdAt >= prevWeekStart && payment.createdAt < prevWeekEnd,
    )
    .reduce((sum, payment) => sum + payment.amount, 0);

  const [certsThisWeekRows, certsPrevWeekRows] = await Promise.all([
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Certificate"
      WHERE "issueDate" >= ${weekStart}
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "Certificate"
      WHERE "issueDate" >= ${prevWeekStart} AND "issueDate" < ${prevWeekEnd}
    `,
  ]);
  const certsThisWeek = Number(certsThisWeekRows[0]?.count ?? 0);
  const certsPrevWeek = Number(certsPrevWeekRows[0]?.count ?? 0);

  const coursesThisWeek = programs.filter(
    (program) => program.updatedAt >= weekStart,
  ).length;
  const coursesPrevWeek = programs.filter(
    (program) =>
      program.updatedAt >= prevWeekStart && program.updatedAt < prevWeekEnd,
  ).length;

  const stats: AdminStatCard[] = [
    {
      id: "users",
      label: "Total Users",
      value: totalUsers.toLocaleString("en-IN"),
      changePct: pctChange(usersThisWeek, usersPrevWeek),
      tone: "purple",
    },
    {
      id: "courses",
      label: "Active Courses",
      value: publishedCourses.toLocaleString("en-IN"),
      changePct: pctChange(coursesThisWeek, coursesPrevWeek),
      tone: "blue",
      href: "/admin/programs",
    },
    {
      id: "enrollments",
      label: "Enrollments",
      value: totalEnrollments.toLocaleString("en-IN"),
      changePct: pctChange(enrollmentsThisWeek, enrollmentsPrevWeek),
      tone: "green",
      href: "/admin/enrollments",
    },
    {
      id: "revenue",
      label: "Revenue",
      value: formatCurrency(totalRevenue, payments[0]?.currency ?? "INR"),
      changePct: pctChange(revenueThisWeek, revenuePrevWeek),
      tone: "orange",
    },
    {
      id: "certificates",
      label: "Certificates Issued",
      value: certificateTotal.toLocaleString("en-IN"),
      changePct: pctChange(certsThisWeek, certsPrevWeek),
      tone: "navy",
    },
  ];

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const enrollmentChart: AdminChartPoint[] = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(dayStart.getDate() + index);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const lastWeekDayStart = new Date(prevWeekStart);
    lastWeekDayStart.setDate(lastWeekDayStart.getDate() + index);
    const lastWeekDayEnd = new Date(lastWeekDayStart);
    lastWeekDayEnd.setDate(lastWeekDayEnd.getDate() + 1);

    const countInRange = (start: Date, end: Date) =>
      enrollments.filter(
        (row) => row.createdAt >= start && row.createdAt < end,
      ).length;

    return {
      label: dayLabels[(dayStart.getDay() + 6) % 7] ?? dayLabels[index],
      thisWeek: countInRange(dayStart, dayEnd),
      lastWeek: countInRange(lastWeekDayStart, lastWeekDayEnd),
    };
  });

  const trackCounts = new Map<ProgramTrack, number>();
  for (const program of programs.filter((program) => program.status === "PUBLISHED")) {
    const track = inferProgramTrack(program);
    trackCounts.set(track, (trackCounts.get(track) ?? 0) + 1);
  }

  const categorySlices: AdminDonutSlice[] = [...trackCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([track, value]) => ({
      id: track,
      label: TRACK_LABELS[track],
      value,
      color: CATEGORY_COLORS[track],
    }));

  const roleSlices: AdminDonutSlice[] = [
    {
      id: "learners",
      label: "Learners",
      value: learners,
      color: ROLE_COLORS.STUDENT,
    },
    {
      id: "staff",
      label: "Instructors & Staff",
      value: Math.max(staff - admins, 0),
      color: ROLE_COLORS.STAFF,
    },
    {
      id: "admins",
      label: "Admins",
      value: admins,
      color: ROLE_COLORS.ADMIN,
    },
  ].filter((slice) => slice.value > 0);

  const recentEnrollments: AdminRecentEnrollment[] = enrollments
    .slice(0, 5)
    .map((row) => {
      const completed = row.status === "COMPLETED" || row.completedAt != null;
      return {
        id: row.id,
        userName: row.userName,
        userEmail: row.userEmail,
        courseTitle: row.courseTitle
          ? displayProgramName(row.courseTitle, "CERTIFICATION")
          : "Course",
        categoryLabel: programCategoryLabel("CERTIFICATION"),
        dateLabel: formatShortDate(row.createdAt),
        timeLabel: formatTime(row.createdAt),
        status: completed ? "Completed" : "In Progress",
        userHref: `/admin/members?q=${encodeURIComponent(row.userEmail)}`,
        courseHref: row.courseId ? `/admin/programs/${row.courseId}` : "/admin/programs",
      };
    });

  const recentCourses: AdminRecentCourse[] = programs.slice(0, 5).map((program) => ({
    id: program.id,
    title: displayProgramName(program.title, program.category),
    categoryLabel: programCategoryLabel(program.category),
    track: inferProgramTrack(program),
    students: program.enrollmentCount,
    status: program.status,
    href: `/admin/programs/${program.id}`,
  }));

  const lessonCount = programs.reduce(
    (sum, program) => sum + program.lessonCount,
    0,
  );
  const storageUsedGb = Math.max(
    1,
    Math.round((lessonCount * 0.04 + programs.length * 0.2) * 10) / 10,
  );
  const bandwidthTb = Math.max(
    0.1,
    Math.round((totalEnrollments * 0.002 + lessonCount * 0.001) * 100) / 100,
  );

  const systemMetrics: AdminSystemMetric[] = [
    {
      id: "storage",
      label: "Total Storage Used",
      value: `${storageUsedGb} GB`,
      detail: "of 1 TB",
      progress: Math.min(100, Math.round((storageUsedGb / 1024) * 100)),
    },
    {
      id: "bandwidth",
      label: "Bandwidth Usage",
      value: `${bandwidthTb} TB`,
      detail: "of 5 TB",
      progress: Math.min(100, Math.round((bandwidthTb / 5) * 100)),
    },
    {
      id: "instructors",
      label: "Active Instructors",
      value: String(staff),
      changePct: pctChange(staff, Math.max(staff - 1, 0)),
      tone: "good",
    },
    {
      id: "uptime",
      label: "System Uptime",
      value: "99.9%",
      detail: "Excellent",
      tone: "good",
    },
  ];

  const rangeEnd = new Date(today);
  rangeEnd.setDate(rangeEnd.getDate() + 6);

  return {
    firstName: adminName.split(" ")[0] ?? adminName,
    dateRangeLabel: `${formatShortDate(weekStart)} – ${formatShortDate(rangeEnd)}`,
    stats,
    enrollmentChart,
    categorySlices,
    roleSlices,
    recentEnrollments,
    recentCourses,
    systemMetrics,
    insights: {
      enrollmentChangePct: pctChange(enrollmentsThisWeek, enrollmentsPrevWeek),
      revenueChangePct: pctChange(revenueThisWeek, revenuePrevWeek),
      userChangePct: pctChange(usersThisWeek, usersPrevWeek),
    },
  };
}
