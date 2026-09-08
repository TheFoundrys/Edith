import type { RankedAttempt } from "@/lib/assessments/personality-rank";

export function PersonalityLeaderboardTable({
  rows,
  highlightUserId,
}: {
  rows: RankedAttempt[];
  highlightUserId?: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-fg-muted">
        No completed sittings yet.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-fg-muted">
            <th className="py-2 pr-3 font-medium">Rank</th>
            <th className="py-2 pr-3 font-medium">Percentile</th>
            <th className="py-2 pr-3 font-medium">Name</th>
            <th className="py-2 pr-3 font-medium">Aptitude</th>
            <th className="py-2 pr-3 font-medium">Quantitative</th>
            <th className="py-2 pr-3 font-medium">Psyche</th>
            <th className="py-2 font-medium">Composite</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.userId}
              className={
                row.userId === highlightUserId
                  ? "border-t border-border font-medium"
                  : "border-t border-border"
              }
            >
              <td className="py-2 pr-3">#{row.rank}</td>
              <td className="py-2 pr-3">{row.percentile}th</td>
              <td className="py-2 pr-3">{row.name}</td>
              <td className="py-2 pr-3">
                {row.aptitudeBand} · {row.aptitudePercent}%
              </td>
              <td className="py-2 pr-3">
                {row.quantitativeBand} · {row.quantitativePercent}%
              </td>
              <td className="py-2 pr-3">{row.psycheLabel}</td>
              <td className="py-2">{row.composite}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
