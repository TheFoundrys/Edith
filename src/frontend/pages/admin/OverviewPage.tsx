import { useEffect, useState } from "react";
import { modulesGet } from "@frontend/services/api/programs";
import { PageHeader, Panel } from "@frontend/components/layout/page";

export function AdminOverviewPage() {
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    void modulesGet<Record<string, number>>("/overview").then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <div>
      <PageHeader title="Overview" description="Organization snapshot." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(["programs", "applications", "enrollments", "openTickets"] as const).map((key) => (
          <Panel key={key} className="p-4">
            <p className="text-xs text-fg-muted uppercase tracking-wide">{key}</p>
            <p className="mt-2 text-2xl font-display text-brand">{stats?.[key] ?? "—"}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
