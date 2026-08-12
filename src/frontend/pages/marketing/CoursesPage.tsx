import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listPublishedPrograms } from "@frontend/services/api/programs";
import { PageHeader, Panel } from "@frontend/components/layout/page";
import { formatCurrency } from "@shared/utils/string";

export function CoursesPage() {
  const [programs, setPrograms] = useState<Array<Record<string, unknown>>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void listPublishedPrograms()
      .then((r) => setPrograms(r.programs))
      .catch(() => setError("Could not load courses."));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="Courses" description="Published programmes you can enroll in." />
      {error ? <p className="text-sm">{error}</p> : null}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((p) => (
          <Panel key={String(p.id)} className="p-4">
            <h2 className="font-medium text-brand">{String(p.name)}</h2>
            <p className="mt-1 text-xs text-fg-muted line-clamp-3">{String(p.summary || "")}</p>
            <p className="mt-3 text-sm">
              {formatCurrency(p.tuitionAmount as number | null, String(p.tuitionCurrency || "INR"))}
            </p>
            <Link
              to={`/courses/${p.slug}`}
              className="mt-3 inline-block text-sm underline text-brand"
            >
              View
            </Link>
          </Panel>
        ))}
        {programs.length === 0 && !error ? (
          <p className="text-sm text-fg-muted">No published courses yet.</p>
        ) : null}
      </div>
    </div>
  );
}
