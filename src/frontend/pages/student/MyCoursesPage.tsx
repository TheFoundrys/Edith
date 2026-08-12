import { useEffect, useState } from "react";
import { myEnrollments } from "@frontend/services/api/programs";
import { PageHeader, Panel } from "@frontend/components/layout/page";

export function StudentMyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    void myEnrollments().then((r) => setEnrollments(r.enrollments)).catch(() => undefined);
  }, []);

  return (
    <div>
      <PageHeader title="My courses" />
      <div className="grid sm:grid-cols-2 gap-4">
        {enrollments.map((e) => {
          const program = e.program as Record<string, unknown> | undefined;
          return (
            <Panel key={String(e.id)} className="p-4">
              <h2 className="font-medium text-brand">{String(program?.name)}</h2>
              <p className="text-xs text-fg-muted mt-1">Status: {String(e.status)}</p>
            </Panel>
          );
        })}
        {enrollments.length === 0 ? (
          <p className="text-sm text-fg-muted">No courses yet.</p>
        ) : null}
      </div>
    </div>
  );
}
