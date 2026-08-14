import { cn } from "@/lib/utils";

/** Circuit legs of the AI chip: [x1, y1, x2, y2, dotX, dotY]. */
const CIRCUIT_LEGS: Array<[number, number, number, number, number, number]> = [
  [122, 265, 111, 265, 107, 265],
  [122, 276, 111, 276, 107, 276],
  [122, 287, 111, 287, 107, 287],
  [166, 265, 177, 265, 181, 265],
  [166, 276, 177, 276, 181, 276],
  [166, 287, 177, 287, 181, 287],
  [132, 256, 132, 245, 132, 241],
  [144, 256, 144, 245, 144, 241],
  [156, 256, 156, 245, 156, 241],
  [132, 294, 132, 305, 132, 309],
  [144, 294, 144, 305, 144, 309],
  [156, 294, 156, 305, 156, 309],
];

/* Pole-to-pole meridians, 16 apart so the spin loops. Each bows from the
   same pole pair — pairing opposite bows is what read as a basketball. */
const MERIDIAN_OFFSETS = [-48, -32, -16, 0, 16, 32, 48];

const BOOK_RULE_Y = [107, 113, 119, 125, 131];
const BOOK_RULES_LEFT = BOOK_RULE_Y.map(
  (y) => `M 128 ${y} C 120 ${y - 6} 111 ${y - 9} 102 ${y - 10}`,
);
const BOOK_RULES_RIGHT = BOOK_RULE_Y.map(
  (y) => `M 142 ${y} C 150 ${y - 6} 159 ${y - 9} 168 ${y - 10}`,
);

const BOOK_PAGE_LEFT =
  "M 135 104 C 124 93 109 89 95 89 L 95 125 C 109 125 124 130 135 139 Z";
const BOOK_PAGE_RIGHT =
  "M 135 104 C 146 93 161 89 175 89 L 175 125 C 161 125 146 130 135 139 Z";
const BOOK_SPINE = "M 135 103 V 140";

/* Four sharp tips, broad through the shoulders: 364 wide × 384 tall. */
const SHIELD_OUTER =
  "M 18 46 L 200 16 L 382 46 C 382 200 342 320 200 400 C 58 320 18 200 18 46 Z";
const SHIELD_INNER =
  "M 34 59 L 200 32 L 366 59 C 366 203 328 313 200 382 C 72 313 34 203 34 59 Z";

/**
 * The Foundry shield as oversized line art, anchored to the right of the home
 * hero. Stroke-only in the same blues as the wordmark.
 *
 * Pass `animated={false}` where the mark is a still backdrop behind a form.
 */
export function HomeEmblemArt({ animated = true }: { animated?: boolean }) {
  return (
    <div
      className={cn(
        "home-emblem-art pointer-events-none absolute inset-0 overflow-hidden",
        !animated && "is-static",
      )}
      aria-hidden
    >
      <svg
        className="home-emblem-mark"
        viewBox="0 0 400 416"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="geometricPrecision"
      >
        <defs>
          <linearGradient
            id="he-line"
            gradientUnits="userSpaceOnUse"
            x1="18"
            y1="16"
            x2="382"
            y2="400"
          >
            <stop offset="0" stopColor="#3f5ad2" />
            <stop offset="0.45" stopColor="#22349f" />
            <stop offset="1" stopColor="#131f6b" />
          </linearGradient>

          {/* Opaque plate: lit from the top-left so the field reads as a
              solid, slightly modelled surface rather than a hole. */}
          <linearGradient
            id="he-plate"
            gradientUnits="userSpaceOnUse"
            x1="80"
            y1="20"
            x2="300"
            y2="390"
          >
            <stop offset="0" stopColor="#f8f9fd" />
            <stop offset="0.55" stopColor="#eef0f8" />
            <stop offset="1" stopColor="#e2e6f4" />
          </linearGradient>

          <clipPath id="he-shield-clip">
            <path d={SHIELD_OUTER} />
          </clipPath>

          <clipPath id="he-globe-clip">
            <circle cx="258" cy="274" r="24.5" />
          </clipPath>

          {/* Raised rim: inner shadow falls bottom-right. */}
          <filter
            id="he-rim"
            x="-8%"
            y="-8%"
            width="116%"
            height="116%"
            colorInterpolationFilters="sRGB"
          >
            <feOffset dx="2.2" dy="2.8" />
            <feGaussianBlur stdDeviation="2.2" result="off" />
            <feComposite
              in="SourceAlpha"
              in2="off"
              operator="arithmetic"
              k2="-1"
              k3="1"
              result="inner"
            />
            <feFlood floodColor="#1a2468" floodOpacity="0.22" result="tint" />
            <feComposite in="tint" in2="inner" operator="in" result="shadow" />
            <feComposite in="shadow" in2="SourceGraphic" operator="over" />
          </filter>

          {/* Incised groove: shadow on the top-left wall, highlight on the
              bottom-right — the inverse of a raised stroke. */}
          <filter
            id="he-engrave"
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
            colorInterpolationFilters="sRGB"
          >
            <feOffset in="SourceAlpha" dx="-0.9" dy="-0.9" result="offDark" />
            <feFlood floodColor="#0c1450" floodOpacity="0.55" result="darkFill" />
            <feComposite
              in="darkFill"
              in2="offDark"
              operator="in"
              result="dark"
            />
            <feOffset in="SourceAlpha" dx="0.9" dy="0.9" result="offLight" />
            <feFlood floodColor="#ffffff" floodOpacity="0.75" result="lightFill" />
            <feComposite
              in="lightFill"
              in2="offLight"
              operator="in"
              result="light"
            />
            <feMerge>
              <feMergeNode in="dark" />
              <feMergeNode in="light" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          className="home-emblem-float"
          strokeLinejoin="miter"
          strokeMiterlimit={8}
        >
          <path
            d={SHIELD_OUTER}
            fill="url(#he-plate)"
            stroke="url(#he-line)"
            strokeWidth="3.6"
            filter="url(#he-rim)"
          />
          <path d={SHIELD_INNER} fill="#e6e9f5" stroke="none" />

          <g
            fill="none"
            stroke="url(#he-line)"
            filter="url(#he-engrave)"
            clipPath="url(#he-shield-clip)"
          >
          <path d={SHIELD_INNER} strokeWidth="1.8" opacity="0.75" />
          <g strokeWidth="1.2" opacity="0.4">
            <path d="M 200 38 V 368" />
            <path d="M 63 204 H 337" />
          </g>

          {/* 1 — Knowledge */}
          <g transform="translate(-26.2 -2.74) scale(1.12)">
            <g strokeWidth="2">
              <path d={BOOK_PAGE_LEFT} />
              <path d={BOOK_SPINE} />
            </g>
            <g strokeWidth="1.2" opacity="0.5">
              {BOOK_RULES_LEFT.map((d) => (
                <path key={d} d={d} />
              ))}
            </g>
            <g className="home-emblem-page">
              <path d={BOOK_PAGE_RIGHT} strokeWidth="2" />
              <g strokeWidth="1.2" opacity="0.5">
                {BOOK_RULES_RIGHT.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
            </g>
          </g>

          {/* 2 — Craftsmanship */}
          <g strokeWidth="2" transform="translate(-8.2 7.33) scale(1.07)">
            <path d="M 228 121 L 286 118.5 C 291 118.5 292.5 122 290 126 L 236 126 C 231 126 228 124.5 228 121 Z" />
            <path d="M 257 126 C 260 131 260 136 258 140 L 272 140 C 270 136 270 131 273 126 Z" />
            <path d="M 246 140 L 284 140 L 287 147.5 L 243 147.5 Z" />
            <g className="home-emblem-hammer">
              <path
                d="M 289 74 L 266 96"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <g transform="rotate(47.5 256 101)">
                <rect x="243" y="94.5" width="26" height="13" rx="2.5" />
                <rect x="240.5" y="92.5" width="6" height="17" rx="1.5" />
              </g>
            </g>
            {/* Burst sits on the anvil face, timed to the strike in CSS. */}
            <g
              className="home-emblem-strike"
              strokeLinecap="round"
              fill="none"
            >
              <circle cx="266" cy="121" r="5.5" strokeWidth="1.2" />
              <path d="M 266 121 L 259 109" strokeWidth="1.8" />
              <path d="M 266 121 L 274 110" strokeWidth="1.8" />
              <path d="M 266 121 L 280 118" strokeWidth="1.8" />
              <path d="M 266 121 L 258 118" strokeWidth="1.6" />
              <path d="M 266 121 L 272 128" strokeWidth="1.4" />
            </g>
          </g>

          {/* 3 — Innovation */}
          <g
            className="home-emblem-chip"
            transform="translate(-1.2 -7.75) scale(1.05)"
          >
            <g strokeWidth="1.8" opacity="0.8">
              {CIRCUIT_LEGS.map(([x1, y1, x2, y2]) => (
                <path
                  key={`leg-${x1}-${y1}-${x2}-${y2}`}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                />
              ))}
            </g>
            <g className="home-emblem-nodes" fill="url(#he-line)" stroke="none">
              {CIRCUIT_LEGS.map(([, , , , cx, cy]) => (
                <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r="2.4" />
              ))}
            </g>
            <rect
              x="122"
              y="256"
              width="44"
              height="38"
              rx="4"
              strokeWidth="2.4"
            />
            <text
              x="144"
              y="281"
              fill="url(#he-line)"
              stroke="none"
              fontFamily="var(--font-sans)"
              fontSize="17"
              fontWeight="500"
              textAnchor="middle"
              letterSpacing="0.06em"
            >
              AI
            </text>
          </g>

          {/* 4 — Global leadership: wireframe sphere, not basketball seams. */}
          <g transform="translate(-117.52 -114.56) scale(1.44)">
            <circle cx="258" cy="274" r="26" strokeWidth="1.7" />
            <g clipPath="url(#he-globe-clip)" strokeWidth="1.05" opacity="0.85">
              <g className="home-emblem-globe">
                {MERIDIAN_OFFSETS.map((offset) => (
                  <path
                    key={`mer-${offset}`}
                    d={`M 258 248 C ${258 + offset} 261 ${258 + offset} 287 258 300`}
                  />
                ))}
              </g>
              <ellipse cx="258" cy="274" rx="24.5" ry="6.5" />
              <ellipse cx="258" cy="261" rx="20" ry="4" />
              <ellipse cx="258" cy="287" rx="20" ry="4" />
            </g>
          </g>
          </g>
        </g>
      </svg>
    </div>
  );
}
