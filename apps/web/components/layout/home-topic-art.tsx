function QuantumMark({
  ink,
  className,
}: {
  ink: string;
  className?: string;
}) {
  return (
    <g className={className}>
      <g className="home-topic-orbit-spin">
        <ellipse
          cx="70"
          cy="70"
          rx="62"
          ry="22"
          fill="none"
          stroke={ink}
          strokeWidth="1.75"
          transform="rotate(-28 70 70)"
        />
        <ellipse
          cx="70"
          cy="70"
          rx="54"
          ry="18"
          fill="none"
          stroke={ink}
          strokeWidth="1.35"
          opacity="0.7"
          transform="rotate(48 70 70)"
        />
        <ellipse
          cx="70"
          cy="70"
          rx="38"
          ry="14"
          fill="none"
          stroke={ink}
          strokeWidth="1.1"
          opacity="0.4"
          transform="rotate(112 70 70)"
        />
      </g>
      <circle cx="70" cy="70" r="7" fill={ink} />
      <circle cx="70" cy="70" r="12" fill="none" stroke={ink} strokeWidth="1" opacity="0.3" />
      <circle cx="118" cy="48" r="3.5" fill={ink} />
      <circle cx="38" cy="92" r="2.8" fill={ink} opacity="0.8" />
      <circle cx="96" cy="108" r="2.4" fill={ink} opacity="0.65" />
    </g>
  );
}

/** Background topic icons for the marketing home hero. */
export function HomeTopicArt() {
  const ink = "rgb(25, 40, 144)";

  return (
    <div className="home-topic-art pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1200 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="home-lock-glow" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor={ink} stopOpacity="0.7" />
            <stop offset="40%" stopColor={ink} stopOpacity="0.22" />
            <stop offset="100%" stopColor={ink} stopOpacity="0" />
          </radialGradient>
          <filter id="home-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="3.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="home-shield-sheen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={ink} stopOpacity="0.1" />
            <stop offset="55%" stopColor={ink} stopOpacity="0.02" />
            <stop offset="100%" stopColor={ink} stopOpacity="0.08" />
          </linearGradient>
        </defs>

        {/* Cybersecurity */}
        <g
          className="home-topic-icon home-topic-cyber"
          transform="translate(820 90) rotate(8) scale(0.78)"
        >
          <path
            d="M90 6 L168 36 V98 C168 148 136 186 90 206 C44 186 12 148 12 98 V36 Z"
            fill="url(#home-shield-sheen)"
            stroke={ink}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M90 6 L90 206"
            fill="none"
            stroke={ink}
            strokeWidth="1.1"
            opacity="0.28"
          />
          <path
            d="M12 36 L90 58 L168 36"
            fill="none"
            stroke={ink}
            strokeWidth="1.2"
            opacity="0.4"
          />
          <path
            d="M28 72 L90 92 L152 72"
            fill="none"
            stroke={ink}
            strokeWidth="1.1"
            opacity="0.32"
          />
          <path
            d="M34 118 L90 142 L146 118"
            fill="none"
            stroke={ink}
            strokeWidth="1.1"
            opacity="0.28"
          />
          <path
            d="M90 24 L150 48 V96 C150 134 126 164 90 180 C54 164 30 134 30 96 V48 Z"
            fill="none"
            stroke={ink}
            strokeWidth="1.5"
            opacity="0.55"
            strokeLinejoin="round"
          />
          <g stroke={ink} strokeWidth="1.4" strokeLinecap="round" opacity="0.55">
            <path d="M54 34 L66 28" />
            <path d="M126 28 L138 34" />
            <path d="M38 160 L50 170" />
            <path d="M142 170 L154 160" />
          </g>
          <circle cx="90" cy="108" r="36" fill="url(#home-lock-glow)" />
          <circle
            className="home-topic-lock-ring"
            cx="90"
            cy="108"
            r="28"
            fill="none"
            stroke={ink}
            strokeWidth="1"
            opacity="0.22"
          />
          <g filter="url(#home-soft-glow)">
            <rect
              x="72"
              y="104"
              width="36"
              height="28"
              rx="4"
              fill={ink}
              fillOpacity="0.12"
              stroke={ink}
              strokeWidth="2.25"
            />
            <path
              d="M80 104 V94 C80 84.6 87.2 78 97 78 C106.8 78 114 84.6 114 94 V104"
              fill="none"
              stroke={ink}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <circle cx="90" cy="116" r="3.2" fill={ink} />
            <path
              d="M90 119.5 V126"
              stroke={ink}
              strokeWidth="2.25"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Data */}
        <g
          className="home-topic-icon home-topic-data"
          transform="translate(940 340) rotate(-12) scale(0.92)"
        >
          <g fill="none" stroke={ink} strokeWidth="1.15" opacity="0.4">
            <path d="M20 70 L70 40 L120 70 L70 100 Z" />
            <path d="M20 70 L20 120 L70 150 L70 100" />
            <path d="M120 70 L120 120 L70 150" />
            <path d="M70 40 L70 10 L120 40 L120 70" />
            <path d="M70 10 L20 40 L20 70" />
            <path d="M45 55 L70 40 L95 55 L70 70 Z" opacity="0.7" />
            <path d="M45 85 L70 70 L95 85 L70 100 Z" />
          </g>
          <g stroke={ink} strokeWidth="1.1" opacity="0.55">
            <line x1="28" y1="58" x2="70" y2="28" />
            <line x1="70" y1="28" x2="118" y2="52" />
            <line x1="118" y1="52" x2="102" y2="98" />
            <line x1="102" y1="98" x2="48" y2="112" />
            <line x1="48" y1="112" x2="28" y2="58" />
            <line x1="70" y1="28" x2="70" y2="78" />
            <line x1="28" y1="58" x2="70" y2="78" />
            <line x1="118" y1="52" x2="70" y2="78" />
          </g>
          <circle cx="70" cy="28" r="4.5" fill={ink} />
          <circle cx="28" cy="58" r="3.2" fill={ink} opacity="0.85" />
          <circle cx="118" cy="52" r="3.8" fill={ink} />
          <circle cx="102" cy="98" r="3" fill={ink} opacity="0.75" />
          <circle cx="48" cy="112" r="3.4" fill={ink} opacity="0.9" />
          <circle cx="70" cy="78" r="5" fill={ink} className="home-topic-node-pulse" />
          <circle cx="70" cy="78" r="10" fill="none" stroke={ink} strokeWidth="1" opacity="0.25" />
        </g>

        {/* Quantum — scattered on the right */}
        <g
          className="home-topic-icon home-topic-quantum"
          transform="translate(680 280) rotate(-18) scale(0.72)"
          opacity="0.85"
        >
          <QuantumMark ink={ink} />
        </g>
        <g
          className="home-topic-icon home-topic-quantum home-topic-quantum-b"
          transform="translate(880 520) rotate(14) scale(0.95)"
        >
          <QuantumMark ink={ink} />
        </g>
        <g
          className="home-topic-icon home-topic-quantum home-topic-quantum-c"
          transform="translate(760 640) rotate(-8) scale(0.58)"
          opacity="0.75"
        >
          <QuantumMark ink={ink} />
        </g>
        <g
          className="home-topic-icon home-topic-quantum home-topic-quantum-d"
          transform="translate(980 180) rotate(22) scale(0.48)"
          opacity="0.7"
        >
          <QuantumMark ink={ink} />
        </g>
      </svg>
    </div>
  );
}
