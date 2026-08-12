import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { myEnrollments, modulesGet } from "@frontend/services/api/programs";
import { useAuth } from "@frontend/store/auth";
import { PageHeader, Panel } from "@frontend/components/layout/page";

export function StudentDashboardPage() {
  const { me } = useAuth();
  const [enrollments, setEnrollments] = useState<Array<Record<string, unknown>>>([]);
  const [announcements, setAnnouncements] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    void myEnrollments().then((r) => setEnrollments(r.enrollments)).catch(() => undefined);
    void modulesGet<{ announcements: Array<Record<string, unknown>> }>("/announcements")
      .then((r) => setAnnouncements(r.announcements.slice(0, 5)))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${me?.user.name ?? "student"}`}
        description="Your learning hub."
      />
      <div className="grid lg:grid-cols-2 gap-6">
        <Panel className="p-5">
          <h2 className="text-sm font-medium mb-3">My courses</h2>
          <ul className="space-y-2 text-sm">
            {enrollments.map((e) => {
              const program = e.program as Record<string, unknown> | undefined;
              return (
                <li key={String(e.id)}>
                  <Link to="/student/my-courses" className="underline text-brand">
                    {String(program?.name || e.programId)}
                  </Link>
                </li>
              );
            })}
            {enrollments.length === 0 ? (
              <p className="text-fg-muted">
                No enrollments. <Link to="/courses">Browse courses</Link>
              </p>
            ) : null}
          </ul>
        </Panel>
        <Panel className="p-5">
          <h2 className="text-sm font-medium mb-3">Announcements</h2>
          <ul className="space-y-2 text-sm">
            {announcements.map((a) => (
              <li key={String(a.id)} className="border-b border-border py-2">
                {String(a.title)}
              </li>
            ))}
            {announcements.length === 0 ? (
              <p className="text-fg-muted">No announcements.</p>
            ) : null}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
