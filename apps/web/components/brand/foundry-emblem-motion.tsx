import "./foundry-emblem-motion.css";

const GOLD = "url(#fx-gold)";
/** Line work needs a user-space gradient: strokes with a flat bbox never paint
    an objectBoundingBox gradient. */
const GOLD_LINE = "url(#fx-gold-line)";
const INK = "#080b14";

/** Circuit legs of the Innovation chip: [x1, y1, x2, y2, dotX, dotY]. */
const CIRCUIT_LEGS: Array<[number, number, number, number, number, number]> = [
  [122, 265, 108, 265, 104, 265],
  [122, 276, 108, 276, 104, 276],
  [122, 287, 108, 287, 104, 287],
  [166, 265, 180, 265, 184, 265],
  [166, 276, 180, 276, 184, 276],
  [166, 287, 180, 287, 184, 287],
  [132, 256, 132, 242, 132, 238],
  [144, 256, 144, 242, 144, 238],
  [156, 256, 156, 242, 156, 238],
  [132, 294, 132, 308, 132, 312],
  [144, 294, 144, 308, 144, 312],
  [156, 294, 156, 308, 156, 312],
];

/** Legs that carry a travelling pulse, paired with a phase-offset class. */
const CIRCUIT_PULSES: Array<{ d: string; phase: string }> = [
  { d: "M 122 276 H 108", phase: "" },
  { d: "M 144 256 V 242", phase: " fx-pulse-b" },
  { d: "M 166 265 H 180", phase: " fx-pulse-c" },
  { d: "M 144 294 V 308", phase: " fx-pulse-b" },
];

/** Meridian tiles: the pattern repeats every 28px so the spin loops seamlessly. */
const MERIDIAN_TILES = [-56, -28, 0, 28, 56];

/**
 * The Foundry emblem, shield only (no outer seal), with a 7s seamless loop:
 * book opens, hammer strikes, circuits pulse, globe turns, book closes.
 * The shield itself never moves.
 */
export function FoundryEmblemMotion({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `fx-emblem ${className}` : "fx-emblem"}
      viewBox="0 0 400 470"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="The Foundry's shield: knowledge, craftsmanship, innovation, global leadership"
    >
      <defs>
        <linearGradient id="fx-gold" x1="0.1" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fbebbf" />
          <stop offset="0.26" stopColor="#e8c86a" />
          <stop offset="0.54" stopColor="#c99a33" />
          <stop offset="0.78" stopColor="#ebce79" />
          <stop offset="1" stopColor="#a8791f" />
        </linearGradient>

        <linearGradient id="fx-gold-deep" x1="0" y1="0" x2="0.5" y2="1">
          <stop offset="0" stopColor="#d9b559" />
          <stop offset="0.5" stopColor="#a87f24" />
          <stop offset="1" stopColor="#7d5a15" />
        </linearGradient>

        <linearGradient
          id="fx-gold-line"
          gradientUnits="userSpaceOnUse"
          x1="58"
          y1="34"
          x2="342"
          y2="424"
        >
          <stop offset="0" stopColor="#f2dda0" />
          <stop offset="0.34" stopColor="#d0a744" />
          <stop offset="0.68" stopColor="#a8791f" />
          <stop offset="1" stopColor="#dfbc62" />
        </linearGradient>

        <linearGradient id="fx-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff6dc" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff6dc" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
        </linearGradient>

        <radialGradient id="fx-ambient-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#e8c86a" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#c99a33" stopOpacity="0.09" />
          <stop offset="1" stopColor="#c99a33" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="fx-chip-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffe9b0" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffe9b0" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="fx-shield-light" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.055" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.012" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>

        <radialGradient id="fx-vignette" cx="0.5" cy="0.44" r="0.62">
          <stop offset="0" stopColor="#0d1220" />
          <stop offset="0.62" stopColor="#070a12" />
          <stop offset="1" stopColor="#03040a" />
        </radialGradient>

        <filter id="fx-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>

        <clipPath id="fx-book-clip">
          <path d="M 135 104 C 124 93 109 89 95 89 L 95 125 C 109 125 124 130 135 139 Z" />
          <path d="M 135 104 C 146 93 161 89 175 89 L 175 125 C 161 125 146 130 135 139 Z" />
        </clipPath>

        <clipPath id="fx-globe-clip">
          <circle cx="258" cy="274" r="24.5" />
        </clipPath>
      </defs>

      {/* Dark textured stage */}
      <rect width="400" height="470" fill="url(#fx-vignette)" />
      <rect
        width="400"
        height="470"
        filter="url(#fx-grain)"
        opacity="0.055"
        style={{ mixBlendMode: "overlay" }}
      />
      <ellipse
        className="fx-ambient"
        cx="200"
        cy="215"
        rx="185"
        ry="205"
        fill="url(#fx-ambient-glow)"
      />

      {/* Shield — always static */}
      <path
        d="M 74 34 H 326 Q 342 34 342 50 V 252 C 342 322 288 374 200 424 C 112 374 58 322 58 252 V 50 Q 58 34 74 34 Z"
        fill="#0a0e1a"
        stroke={GOLD}
        strokeWidth="5"
      />
      <path
        d="M 84 46 H 316 Q 330 46 330 60 V 250 C 330 312 282 358 200 402 C 118 358 70 312 70 250 V 60 Q 70 46 84 46 Z"
        fill="none"
        stroke={GOLD_LINE}
        strokeWidth="2.2"
      />
      <path
        d="M 84 46 H 316 Q 330 46 330 60 V 250 C 330 312 282 358 200 402 C 118 358 70 312 70 250 V 60 Q 70 46 84 46 Z"
        fill="url(#fx-shield-light)"
      />
      <line x1="200" y1="46" x2="200" y2="356" stroke={GOLD_LINE} strokeWidth="2.2" />
      <line x1="70" y1="224" x2="330" y2="224" stroke={GOLD_LINE} strokeWidth="2.2" />

      {/* Quadrant labels */}
      <g
        fill={GOLD}
        fontFamily="var(--font-display), Georgia, serif"
        textAnchor="middle"
        letterSpacing="0.12em"
      >
        <text x="135" y="180" fontSize="13">
          KNOWLEDGE
        </text>
        <text x="265" y="180" fontSize="11.5">
          CRAFTSMANSHIP
        </text>
        <text x="144" y="332" fontSize="10.5">
          INNOVATION
        </text>
        <text x="258" y="322" fontSize="10.5">
          GLOBAL
        </text>
        <text x="258" y="336" fontSize="10.5">
          LEADERSHIP
        </text>
      </g>

      {/* 1 — KNOWLEDGE: book opens, holds, closes */}
      <g className="fx-book-closed">
        <rect x="121" y="95" width="28" height="44" rx="2.5" fill={GOLD} />
        <rect x="121" y="95" width="7" height="44" rx="2.5" fill={INK} opacity="0.32" />
        <rect x="143.5" y="99" width="5.5" height="36" fill="#fff3d0" opacity="0.5" />
        <rect
          x="126"
          y="100"
          width="14"
          height="34"
          rx="1"
          fill="none"
          stroke={INK}
          strokeWidth="1"
          opacity="0.35"
        />
      </g>

      <g className="fx-book-pages">
        <g className="fx-page-l">
          <path
            d="M 135 104 C 124 93 109 89 95 89 L 95 125 C 109 125 124 130 135 139 Z"
            fill={GOLD}
          />
          <g fill="none" stroke={INK} strokeWidth="1.1" opacity="0.4">
            <path d="M 128 106 C 120 100 111 97 102 97" vectorEffect="non-scaling-stroke" />
            <path d="M 128 114 C 120 108 111 105 102 105" vectorEffect="non-scaling-stroke" />
            <path d="M 128 122 C 120 116 111 113 102 113" vectorEffect="non-scaling-stroke" />
          </g>
        </g>
        <g className="fx-page-r">
          <path
            d="M 135 104 C 146 93 161 89 175 89 L 175 125 C 161 125 146 130 135 139 Z"
            fill={GOLD}
          />
          <g fill="none" stroke={INK} strokeWidth="1.1" opacity="0.4">
            <path d="M 142 106 C 150 100 159 97 168 97" vectorEffect="non-scaling-stroke" />
            <path d="M 142 114 C 150 108 159 105 168 105" vectorEffect="non-scaling-stroke" />
            <path d="M 142 122 C 150 116 159 113 168 113" vectorEffect="non-scaling-stroke" />
          </g>
        </g>
        <line x1="135" y1="103" x2="135" y2="140" stroke={INK} strokeWidth="2.2" opacity="0.55" />
        <g clipPath="url(#fx-book-clip)">
          <rect
            className="fx-book-sheen"
            x="88"
            y="85"
            width="20"
            height="60"
            fill="url(#fx-sheen)"
          />
        </g>
      </g>

      {/* 2 — CRAFTSMANSHIP: anvil fixed, hammer strikes once */}
      <g fill={GOLD}>
        <path d="M 228 121 L 286 118.5 C 291 118.5 292.5 122 290 126 L 236 126 C 231 126 228 124.5 228 121 Z" />
        <path d="M 257 126 C 260 131 260 136 258 140 L 272 140 C 270 136 270 131 273 126 Z" />
        <path d="M 246 140 L 284 140 L 287 147.5 L 243 147.5 Z" />
      </g>
      <line x1="238" y1="122.5" x2="288" y2="122.5" stroke={INK} strokeWidth="1" opacity="0.22" />

      <g className="fx-hammer">
        <line
          x1="289"
          y1="74"
          x2="266"
          y2="96"
          stroke={GOLD}
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        <g transform="rotate(47.5 256 101)">
          <rect x="243" y="94.5" width="26" height="13" rx="2.5" fill={GOLD} />
          <rect x="240.5" y="92.5" width="6" height="17" rx="1.5" fill={GOLD} />
        </g>
      </g>

      <g className="fx-spark">
        <g className="fx-spark-burst">
          <circle cx="262" cy="119" r="3.2" fill="#fff6dc" />
          <circle
            cx="262"
            cy="119"
            r="8"
            fill="none"
            stroke="#ffe9b0"
            strokeWidth="1.3"
            opacity="0.75"
          />
          <g stroke="#fff3d0" strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
            <line x1="262" y1="109" x2="262" y2="104" />
            <line x1="252" y1="114" x2="248" y2="110" />
            <line x1="272" y1="114" x2="276" y2="110" />
            <line x1="250" y1="121" x2="245" y2="122" />
            <line x1="274" y1="121" x2="279" y2="122" />
          </g>
        </g>
      </g>

      {/* 3 — INNOVATION: chip with travelling circuit pulses */}
      <ellipse className="fx-chip-glow" cx="144" cy="275" rx="36" ry="32" fill="url(#fx-chip-glow)" />
      <g fill="none" stroke={GOLD_LINE} strokeWidth="2" opacity="0.85">
        {CIRCUIT_LEGS.map(([x1, y1, x2, y2]) => (
          <line key={`leg-${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
      <g fill={GOLD}>
        {CIRCUIT_LEGS.map(([, , , , cx, cy]) => (
          <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r="2.4" />
        ))}
      </g>
      <g fill="none" stroke="#fff6dc" strokeWidth="2.6" strokeLinecap="round">
        {CIRCUIT_PULSES.map(({ d, phase }) => (
          <path key={d} className={`fx-pulse${phase}`} d={d} />
        ))}
      </g>
      <rect
        x="122"
        y="256"
        width="44"
        height="38"
        rx="4"
        fill="#0a0e1a"
        stroke={GOLD}
        strokeWidth="2.4"
      />
      <text
        className="fx-ai-core"
        x="144"
        y="281"
        fill={GOLD}
        fontFamily="var(--font-display), Georgia, serif"
        fontSize="17"
        textAnchor="middle"
        letterSpacing="0.06em"
      >
        AI
      </text>

      {/* 4 — GLOBAL LEADERSHIP: globe turns continuously */}
      <circle cx="258" cy="274" r="26" fill="#0a0e1a" stroke={GOLD} strokeWidth="2.4" />
      <g clipPath="url(#fx-globe-clip)">
        <g className="fx-globe-spin" fill="none" stroke={GOLD_LINE} strokeWidth="1.5" opacity="0.9">
          {MERIDIAN_TILES.map((offset) => (
            <g key={`tile-${offset}`}>
              <path
                d={`M ${258 + offset} 246 C ${250 + offset} 261 ${250 + offset} 287 ${258 + offset} 302`}
              />
              <path
                d={`M ${272 + offset} 246 C ${280 + offset} 261 ${280 + offset} 287 ${272 + offset} 302`}
              />
            </g>
          ))}
        </g>
        <g fill="none" stroke={GOLD_LINE} strokeWidth="1.5" opacity="0.9">
          <line x1="232" y1="274" x2="284" y2="274" />
          <path d="M 236 262 Q 258 270 280 262" />
          <path d="M 236 286 Q 258 278 280 286" />
        </g>
        <rect
          className="fx-globe-sheen"
          x="228"
          y="246"
          width="22"
          height="58"
          fill="url(#fx-sheen)"
        />
      </g>

      {/* Base flourish from the reference lockup */}
      <g fill={GOLD} opacity="0.85">
        <path d="M 200 360 C 192 356.5 185 358.5 182 363 C 190 364 196 362.8 200 361 Z" />
        <path d="M 200 360 C 208 356.5 215 358.5 218 363 C 210 364 204 362.8 200 361 Z" />
        <path d="M 200 362 L 203.5 368.5 L 200 375 L 196.5 368.5 Z" />
      </g>
    </svg>
  );
}
