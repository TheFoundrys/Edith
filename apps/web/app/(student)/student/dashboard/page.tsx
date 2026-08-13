import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { APP_TAGLINE } from "@/lib/brand";

const PRIMARY = [
  {
    href: "/student/enroll",
    label: "Enroll",
    title: "Enroll in a course",
    body: "Browse the catalog and join a free or paid course.",
    cta: "Go to Enroll",
  },
  {
    href: "/student/payment",
    label: "Payment",
    title: "Complete payment",
    body: "Pay course fees to unlock learning on EDITH.",
    cta: "Go to Payment",
  },
  {
    href: "/student/assessments",
    label: "Assignments & Quizzes",
    title: "Do the work",
    body: "Submit assignments and take quizzes from your enrolled courses.",
    cta: "Open assessments",
  },
] as const;

export default async function StudentDashboardPage() {
  const session = await requireStudent();

  const [
    enrollmentCount,
    assignmentCount,
    quizCount,
    enrollableCount,
    payableCount,
  ] = await Promise.all([
    prisma.enrollment.count({
      where: { userId: session.user.id, status: "ACTIVE" },
    }),
    prisma.assignment.count({
      where: {
        isPublished: true,
        program: {
          enrollments: {
            some: { userId: session.user.id, status: "ACTIVE" },
          },
        },
      },
    }),
    prisma.quiz.count({
      where: {
        status: "PUBLISHED",
        program: {
          enrollments: {
            some: { userId: session.user.id, status: "ACTIVE" },
          },
        },
      },
    }),
    prisma.program.count({
      where: {
        status: "PUBLISHED",
        enrollments: {
          none: { userId: session.user.id, status: "ACTIVE" },
        },
      },
    }),
    prisma.program.count({
      where: {
        status: "PUBLISHED",
        OR: [{ price: { gt: 0 } }, { applicationFee: { gt: 0 } }],
        enrollments: {
          none: { userId: session.user.id, status: "ACTIVE" },
        },
      },
    }),
  ]);

  const counts = [enrollableCount, payableCount, assignmentCount + quizCount];

  return (
    <div className="peak-rise">
      <PageHeader
        title={`Welcome, ${session.user.name.split(" ")[0]}`}
        description={`${APP_TAGLINE} Enroll, complete Payment, then Assignments & Quizzes.`}
        actions={
          enrollmentCount > 0 ? (
            <Link href="/student/my-courses">
              <Button variant="secondary" size="sm">
                My courses
              </Button>
            </Link>
          ) : null
        }
      />

      <div className="cm-grid">
        {PRIMARY.map((item, i) => (
          <article key={item.href} className="peak-card min-h-[8cm]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
              {item.label}
              {counts[i] > 0 ? ` · ${counts[i]}` : ""}
            </p>
            <h2 className="mt-[var(--grid-gap)] font-display text-2xl leading-snug text-fg">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-fg-muted leading-relaxed">
              {item.body}
            </p>
            <div className="mt-auto pt-[var(--grid-pad)]">
              <Link href={item.href}>
                <Button size="sm">{item.cta}</Button>
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
