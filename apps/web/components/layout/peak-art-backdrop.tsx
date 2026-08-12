/** Decorative monochrome art plane — sits behind app content. */
export function PeakArtBackdrop({
  variant = "workspace",
}: {
  variant?: "workspace" | "marketing";
}) {
  const bold = variant === "marketing";
  const ink = bold ? "rgb(25, 40, 144)" : "#0a0a0a";
  const paper = "#f2f2f2";

  return (
    <div
      className="peak-art pointer-events-none absolute inset-0 overflow-hidden"
      data-variant={variant}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="peak-art-soft" cx="70%" cy="18%" r="55%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Paper field */}
        <rect width="1200" height="900" fill={paper} />
        <rect width="1200" height="900" fill="url(#peak-art-soft)" />

        {/* Large ink disc — primary art mark */}
        <circle
          className="peak-art-disc"
          cx={bold ? 980 : 1040}
          cy={bold ? 120 : 80}
          r={bold ? 280 : 220}
          fill={ink}
          opacity={bold ? 1 : 0.9}
        />

        {/* Counterform ring */}
        <circle
          className="peak-art-ring"
          cx={bold ? 980 : 1040}
          cy={bold ? 120 : 80}
          r={bold ? 168 : 132}
          fill="none"
          stroke={paper}
          strokeWidth={bold ? 18 : 14}
          opacity="0.35"
        />

        {/* Offset frame */}
        <rect
          className="peak-art-frame"
          x={bold ? 720 : 820}
          y={bold ? 280 : 240}
          width={bold ? 320 : 260}
          height={bold ? 400 : 340}
          fill="none"
          stroke={ink}
          strokeWidth="1.25"
          opacity={bold ? 0.28 : 0.16}
        />

        {/* Secondary disc */}
        <circle
          className="peak-art-disc-2"
          cx="70"
          cy="820"
          r={bold ? 160 : 120}
          fill={ink}
          opacity={bold ? 0.12 : 0.08}
        />

        {/* Hairline composition rules */}
        <line
          x1="40"
          y1="640"
          x2="420"
          y2="640"
          stroke={ink}
          strokeWidth="1"
          opacity="0.12"
        />
        <line
          x1="900"
          y1="760"
          x2="1160"
          y2="760"
          stroke={ink}
          strokeWidth="1"
          opacity="0.12"
        />

        {/* Small solid square accent */}
        <rect
          className="peak-art-square"
          x={bold ? 760 : 860}
          y={bold ? 520 : 460}
          width="28"
          height="28"
          fill={ink}
          opacity={bold ? 0.85 : 0.55}
        />
      </svg>
    </div>
  );
}
