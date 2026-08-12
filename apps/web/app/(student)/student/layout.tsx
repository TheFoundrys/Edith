import { AppShell } from "@/components/layout/app-shell";
import { requireStudent } from "@/lib/auth/session";
import { APP_NAME } from "@/lib/brand";

/** Primary student paths — Enroll, Payment, Assignments & Quizzes. */
const nav = [
  { href: "/student/dashboard", label: "Home" },
  { href: "/student/enroll", label: "Enroll" },
  { href: "/student/applications", label: "Applications" },
  { href: "/student/payment", label: "Payment" },
  { href: "/student/assessments", label: "Assignments & Quizzes" },
  { href: "/student/my-courses", label: "My Courses" },
  { href: "/student/announcements", label: "Announcements" },
  { href: "/student/forums", label: "Forums" },
  { href: "/student/tickets", label: "Support" },
  { href: "/student/profile", label: "Profile" },
  { href: "/student/settings", label: "Settings" },
];

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireStudent();
  return (
    <AppShell
      brand={APP_NAME}
      nav={nav}
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
      }}
    >
      {children}
    </AppShell>
  );
}
