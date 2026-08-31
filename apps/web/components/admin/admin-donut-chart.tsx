import Link from "next/link";
import type { AdminDonutSlice } from "@/lib/admin/dashboard-data";

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export function AdminDonutChart({
  title,
  subtitle,
  centerLabel,
  centerValue,
  slices,
  href,
}: {
  title: string;
  subtitle?: string;
  centerLabel: string;
  centerValue: string;
  slices: AdminDonutSlice[];
  href?: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0) || 1;
  const cx = 90;
  const cy = 90;
  const radius = 62;
  const stroke = 22;

  const arcs = slices.map((slice, index) => {
    const angle = (slice.value / total) * 360;
    const start = slices
      .slice(0, index)
      .reduce((sum, previous) => sum + (previous.value / total) * 360, 0);
    const end = start + angle;
    return { ...slice, path: describeArc(cx, cy, radius, start, end - 0.4) };
  });

  return (
    <section className="admin-dash-panel admin-dash-donut-panel">
      <div className="admin-dash-panel-head">
        <div>
          <h2 className="admin-dash-panel-title">{title}</h2>
          {subtitle ? <p className="admin-dash-panel-lead">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link href={href} className="admin-dash-panel-link">
            View all
          </Link>
        ) : null}
      </div>

      <div className="admin-dash-donut-layout">
        <div className="admin-dash-donut-wrap">
          <svg viewBox="0 0 180 180" className="admin-dash-donut" role="img" aria-label={title}>
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="color-mix(in srgb, var(--border) 70%, transparent)"
              strokeWidth={stroke}
            />
            {arcs.map((arc) => (
              <path
                key={arc.id}
                d={arc.path}
                fill="none"
                stroke={arc.color}
                strokeWidth={stroke}
                strokeLinecap="butt"
              />
            ))}
          </svg>
          <div className="admin-dash-donut-center">
            <span className="admin-dash-donut-center-value">{centerValue}</span>
            <span className="admin-dash-donut-center-label">{centerLabel}</span>
          </div>
        </div>

        <ul className="admin-dash-donut-legend">
          {slices.map((slice) => (
            <li key={slice.id}>
              <span className="admin-dash-donut-swatch" style={{ background: slice.color }} />
              <span className="admin-dash-donut-legend-label">{slice.label}</span>
              <span className="admin-dash-donut-legend-value">
                {Math.round((slice.value / total) * 1000) / 10}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
