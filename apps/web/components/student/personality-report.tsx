import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/page";
import {
  DIMENSION_LABELS,
  PERSONALITY_PROFILE_NAME,
  dimensionBand,
  type PersonalityReport,
} from "@/lib/assessments/personality-profile";

export function PersonalityReportView({
  report,
  titles,
  rank,
  ragGuidance,
}: {
  report: PersonalityReport;
  titles: Record<string, string>;
  rank?: {
    place: number;
    total: number;
    composite: number;
    percentile?: number;
    aptitudePercent?: number;
    aptitudeBand?: string;
    quantitativePercent?: number;
    quantitativeBand?: string;
    psycheLabel?: string;
  } | null;
  ragGuidance?: string[];
}) {
  const dimensions = (
    ["drive", "structure", "people", "risk"] as const
  ).map((key) => ({
    key,
    label: DIMENSION_LABELS[key],
    value: report.psyche[key],
    band: dimensionBand(report.psyche[key]),
  }));
  const guidance = ragGuidance?.length ? ragGuidance : report.insights;

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
          Assessment
        </p>
        <h2 className="mt-2 font-display text-xl">{PERSONALITY_PROFILE_NAME}</h2>
        {rank ? (
          <p className="mt-2 text-sm">
            Rank #{rank.place} of {rank.total}
            {typeof rank.percentile === "number"
              ? ` · ${rank.percentile}th percentile`
              : ""}{" "}
            · composite {rank.composite}
          </p>
        ) : (
          <p className="mt-2 text-sm text-fg-muted">Ranked result after the sitting.</p>
        )}
      </Panel>

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
        <h2 className="font-display text-xl">Guidance</h2>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-fg">
          {guidance.map((item) => (
            <li key={item}>{item}</li>
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
