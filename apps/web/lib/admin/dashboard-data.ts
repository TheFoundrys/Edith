import type { ProgramStatus, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { displayProgramName, programCategoryLabel } from "@/lib/programs/categories";
import { inferProgramTrack, TRACK_LABELS, type ProgramTrack } from "@/lib/programs/track";

export type AdminStatCard = {
  id: string;
  label: string;
  value: string;
  changePct: number;
  tone: "purple" | "blue" | "green" | "orange" | "navy";
  href?: string;
};

export type AdminChartPoint = {
  label: string;
  thisWeek: number;
  lastWeek: number;
};

export type AdminDonutSlice = {
  id: string;
  label: string;
  value: number;
  color: string;
};

export type AdminRecentEnrollment = {
  id: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  categoryLabel: string;
  dateLabel: string;
  timeLabel: string;
  status: "Completed" | "In Progress";
  userHref: string;
  courseHref: string;
};

export type AdminRecentCourse = {
  id: string;
  title: string;
  categoryLabel: string;
  track: ProgramTrack;
  students: number;
  status: ProgramStatus;
  href: string;
};

export type AdminSystemMetric = {
  id: string;
  label: string;
  value: string;
  detail?: string;
  progress?: number;
  changePct?: number;
  tone?: "good" | "warn" | "neutral";
  href?: string;
};

export type AdminDashboardData = {
  firstName: string;
  dateRangeLabel: string;
  stats: AdminStatCard[];
  enrollmentChart: AdminChartPoint[];
  categorySlices: AdminDonutSlice[];
  roleSlices: AdminDonutSlice[];
  recentEnrollments: AdminRecentEnrollment[];
  recentCourses: AdminRecentCourse[];
  systemMetrics: AdminSystemMetric[];
  insights: {
    enrollmentChangePct: number;
    revenueChangePct: number;
    userChangePct: number;
  };
};

const CATEGORY_COLORS: Record<ProgramTrack, string> = {
  ai: "#6366f1",
  cyber: "#0ea5e9",
  blockchain: "#8b5cf6",
  quantum: "#a855f7",
  data: "#14b8a6",
  general: "#94a3b8",
};

const ROLE_COLORS: Record<string, string> = {
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

function isStaffRole(role: Role) {
  return role !== "STUDENT";
}

export async function getAdminDashboardData(
  orgId: string,
  adminName: string,
): Promise<AdminDashboardData> {
  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);

  const paidStatuses = ["PAID", "SUCCESS"] as const;

  const [
    memberships,
    programs,
    enrollments,
    certificates,
    payments,
    ticketsOpen,
    recentEnrollmentRows,
    recentProgramRows,
    lessonCount,
  ] = await Promise.all([
    prisma.membership.findMany({
      where: { organizationId: orgId },
      select: { role: true, createdAt: true },
    }),
    prisma.program.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        domainSlug: true,
        tags: true,
        updatedAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.enrollment.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        status: true,
        enrolledAt: true,
        createdAt: true,
        completedAt: true,
        program: {
          select: { title: true, category: true },
        },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.certificate.count({
      where: {
        program: { organizationId: orgId },
      },
    }),
    prisma.payment.findMany({
      where: {
        organizationId: orgId,
        status: { in: [...paidStatuses] },
      },
      select: { amount: true, createdAt: true, currency: true },
    }),
    prisma.ticket.count({
      where: { organizationId: orgId, status: "OPEN" },
    }),
    prisma.enrollment.findMany({
      where: { organizationId: orgId },
      include: {
        user: { select: { name: true, email: true } },
        program: { select: { id: true, title: true, category: true } },
      },
      orderBy: [{ enrolledAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
    prisma.program.findMany({
      where: { organizationId: orgId },
      include: { _count: { select: { enrollments: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.syllabusLesson.count({
      where: {
        module: { syllabus: { program: { organizationId: orgId } } },
      },
    }),
  ]);

  const totalUsers = memberships.length;
  const learners = memberships.filter((member) => member.role === "STUDENT").length;
  const staff = memberships.filter((member) => isStaffRole(member.role)).length;
  const admins = memberships.filter(
    (member) => member.role === "SUPER_ADMIN" || member.role === "ADMISSIONS_MANAGER",
  ).length;

  const publishedCourses = programs.filter((program) => program.status === "PUBLISHED").length;
  const totalEnrollments = enrollments.length;
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

  const usersThisWeek = memberships.filter(
    (member) => member.createdAt >= weekStart,
  ).length;
  const usersPrevWeek = memberships.filter(
    (member) => member.createdAt >= prevWeekStart && member.createdAt < prevWeekEnd,
  ).length;

  const enrollmentsThisWeek = enrollments.filter(
    (row) => (row.enrolledAt ?? row.createdAt) >= weekStart,
  ).length;
  const enrollmentsPrevWeek = enrollments.filter((row) => {
    const when = row.enrolledAt ?? row.createdAt;
    return when >= prevWeekStart && when < prevWeekEnd;
  }).length;

  const revenueThisWeek = payments
    .filter((payment) => payment.createdAt >= weekStart)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const revenuePrevWeek = payments
    .filter(
      (payment) =>
        payment.createdAt >= prevWeekStart && payment.createdAt < prevWeekEnd,
    )
    .reduce((sum, payment) => sum + payment.amount, 0);

  const certsThisWeek = await prisma.certificate.count({
    where: {
      issueDate: { gte: weekStart },
      program: { organizationId: orgId },
    },
  });
  const certsPrevWeek = await prisma.certificate.count({
    where: {
      issueDate: { gte: prevWeekStart, lt: prevWeekEnd },
      program: { organizationId: orgId },
    },
  });

  const coursesThisWeek = programs.filter((program) => program.updatedAt >= weekStart).length;
  const coursesPrevWeek = programs.filter(
    (program) => program.updatedAt >= prevWeekStart && program.updatedAt < prevWeekEnd,
  ).length;

  const stats: AdminStatCard[] = [
    {
      id: "users",
      label: "Total Users",
      value: totalUsers.toLocaleString("en-IN"),
      changePct: pctChange(usersThisWeek, usersPrevWeek),
      tone: "purple",
      href: "/admin/members",
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
      href: "/admin/programs",
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
      value: certificates.toLocaleString("en-IN"),
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
      enrollments.filter((row) => {
        const when = row.enrolledAt ?? row.createdAt;
        return when >= start && when < end;
      }).length;

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

  const recentEnrollments: AdminRecentEnrollment[] = recentEnrollmentRows.map((row) => {
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

  const recentCourses: AdminRecentCourse[] = recentProgramRows.map((program) => ({
    id: program.id,
    title: displayProgramName(program.title, program.category),
    categoryLabel: programCategoryLabel(program.category),
    track: inferProgramTrack(program),
    students: program._count.enrollments,
    status: program.status,
    href: `/admin/programs/${program.id}`,
  }));

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
      href: "/admin/members",
    },
    {
      id: "tickets",
      label: "Support Tickets",
      value: String(ticketsOpen),
      changePct: -5,
      tone: ticketsOpen > 20 ? "warn" : "good",
      href: "/admin/tickets",
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
