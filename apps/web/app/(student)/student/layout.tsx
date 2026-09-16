import { AppShell } from "@/components/layout/app-shell";
import { requireStudent } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";
import { prisma } from "@/lib/db";

const navGroups = [
  {
    label: "Learn",
    items: [
      { href: "/student/dashboard", label: "Dashboard" },
      { href: "/student/my-courses", label: "My Learning" },
      { href: "/student/enroll", label: "Courses" },
      { href: "/student/personality-profile", label: "Personality Profile" },
      { href: "/student/assessments", label: "Assessments" },
      { href: "/student/progress", label: "Progress" },
      { href: "/student/submissions", label: "Submissions" },
      { href: "/student/certificates", label: "Certificates" },
      { href: "/student/badges", label: "Badges" },
    ],
  },
  {
    label: "Community",
    items: [{ href: "/student/forums", label: "Forums" }],
  },
  {
    label: "Admissions",
    items: [{ href: "/student/transactions", label: "Transactions" }],
  },
  {
    label: "Support",
    items: [
      { href: "/student/announcements", label: "Announcements" },
      { href: "/student/tickets", label: "Help tickets" },
      { href: "/student/settings", label: "Settings" },
    ],
  },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudent();
  const unreadNotifications = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null },
  });

  return (
    <AppShell
      brand={APP_NAME}
      navGroups={navGroups}
      profileHref="/student/profile"
      notificationsHref="/student/notifications"
      unreadNotifications={unreadNotifications}
      workspaceHref="/student/dashboard"
      workspaceLabel="Continue learning"
    >
      {children}
    </AppShell>
  );
}
