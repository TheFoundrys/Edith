import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/ui/page";
import { requireStudent } from "@/lib/auth/session";
import { getStudentDeadlines } from "@/lib/learning/student-deadlines";

export default async function StudentDeadlinesPage() {
  const session = await requireStudent();
  const items = await getStudentDeadlines(session.user.id);

  return (
    <div>
      <PageHeader
        title="Upcoming deadlines"
        description="Assignments due across your enrolled courses."
        actions={
          <Link href="/student/dashboard" className="text-sm text-fg-muted underline">
            Back to dashboard
          </Link>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          title="No deadlines approaching"
          description="You're on track — new assignment due dates will show up here."
          action={
            <Link href="/student/assessments">
              <Button size="sm">Open assessments</Button>
            </Link>
          }
        />
      ) : (
        <Panel className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-fg-muted">
                <th className="px-4 py-3 font-medium">Assignment</th>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Due date</th>
                <th className="px-4 py-3 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link href={item.href} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{item.subtitle}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <CalendarClock className="size-4 text-fg-muted" aria-hidden />
                      {item.dateLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge
                      tone={
                        item.dueLabel === "Overdue"
                          ? "danger"
                          : item.dueLabel === "Due today"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {item.dueLabel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}
