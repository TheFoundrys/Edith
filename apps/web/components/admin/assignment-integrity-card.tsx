import { Badge } from "@/components/ui/badge";
import {
  parseIntegrityReport,
  type IntegrityRisk,
} from "@/lib/learning/assignment-integrity";

const RISK_TONE: Record<IntegrityRisk, "neutral" | "warning" | "danger"> = {
  none: "neutral",
  low: "neutral",
  medium: "warning",
  high: "danger",
};

const RISK_LABEL: Record<IntegrityRisk, string> = {
  none: "No overlap",
  low: "Low overlap",
  medium: "Review overlap",
  high: "High plagiarism risk",
};

export function AssignmentIntegrityCard({
  report,
}: {
  report: unknown;
}) {
  const parsed = parseIntegrityReport(report);
  if (!parsed) {
    return (
      <p className="mt-3 text-xs text-fg-muted">
        Integrity scan pending. Rescan this assignment to compare submissions.
      </p>
    );
  }

  return (
    <details className="mt-4 rounded-[var(--radius-sm)] border border-border bg-bg p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
        <span>Plagiarism review</span>
        <Badge tone={RISK_TONE[parsed.risk]}>{RISK_LABEL[parsed.risk]}</Badge>
      </summary>
      <p className="mt-2 text-xs text-fg-muted">
        Faculty only. Compared against {parsed.peerCount} other submitted
        {parsed.peerCount === 1 ? " paper" : " papers"}. Top similarity{" "}
        {Math.round(parsed.score * 100)}%.
      </p>
      {parsed.matches.length === 0 ? (
        <p className="mt-2 text-sm text-fg-muted">
          No copied phrasing detected against other students.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {parsed.matches.map((match) => (
            <li key={match.peerSubmissionId} className="text-sm">
              <p className="font-medium">
                {match.peerName} · {Math.round(match.score * 100)}% similar
              </p>
              {match.samplePhrases.length > 0 ? (
                <ul className="mt-1 space-y-1 text-xs text-fg-muted">
                  {match.samplePhrases.map((phrase) => (
                    <li key={phrase} className="italic">
                      “{phrase}”
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
