import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/page";
import {
  DIMENSION_LABELS,
  dimensionBand,
  type PersonalityReport,
} from "@/lib/assessments/personality-profile";

export function PersonalityReportView({
  report,
  titles,
}: {
  report: PersonalityReport;
  titles: Record<string, string>;
}) {
  const dimensions = (
    ["drive", "structure", "people", "risk"] as const
  ).map((key) => ({
    key,
    label: DIMENSION_LABELS[key],
    value: report.psyche[key],
    band: dimensionBand(report.psyche[key]),
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Panel className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Aptitude
          </p>
          <p className="mt-2 font-display text-2xl">{report.aptitude.band}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {report.aptitude.score}/{report.aptitude.max} · {report.aptitude.percent}%
          </p>
        </Panel>
        <Panel className="p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            Quantitative
          </p>
          <p className="mt-2 font-display text-2xl">{report.quantitative.band}</p>
          <p className="mt-1 text-sm text-fg-muted">
            {report.quantitative.score}/{report.quantitative.max} ·{" "}
            {report.quantitative.percent}%
          </p>
        </Panel>
      </div>

      <Panel className="p-5">
        <h2 className="font-display text-xl">Psyche profile</h2>
        <ul className="mt-4 space-y-3">
          {dimensions.map((dimension) => (
            <li key={dimension.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span>{dimension.label}</span>
                <Badge tone="neutral">{dimension.band}</Badge>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full bg-accent"
                  style={{ width: `${Math.round((dimension.value / 3) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-display text-xl">Insights</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg">
          {report.insights.map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </Panel>

      <Panel className="p-5">
        <h2 className="font-display text-xl">Recommended programmes</h2>
        <ul className="mt-4 space-y-4">
          {report.recommendations.map((item) => (
            <li key={item.slug} className="border-t border-border pt-4 first:border-0 first:pt-0">
              <p className="font-medium">{titles[item.slug] ?? item.slug}</p>
              <p className="mt-1 text-sm text-fg-muted">{item.reason}</p>
              <Link href={`/courses/${item.slug}`} className="mt-2 inline-block">
                <Button size="sm" variant="secondary">
                  View programme
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
