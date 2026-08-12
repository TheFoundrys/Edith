import { cn } from "@/lib/utils";

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

/** Meridian tiles: the pattern repeats every 28px so the spin loops seamlessly. */
const MERIDIAN_TILES = [-56, -28, 0, 28, 56];

/* Split by leaf: the right page riffles about the spine, so its rules have to
   travel with it rather than stay pinned to the flat side. */
const BOOK_RULES_LEFT = [
  "M 128 106 C 120 100 111 97 102 97",
  "M 128 114 C 120 108 111 105 102 105",
  "M 128 122 C 120 116 111 113 102 113",
];
const BOOK_RULES_RIGHT = [
  "M 142 106 C 150 100 159 97 168 97",
  "M 142 114 C 150 108 159 105 168 105",
  "M 142 122 C 150 116 159 113 168 113",
];

const BOOK_PAGE_LEFT =
  "M 135 104 C 124 93 109 89 95 89 L 95 125 C 109 125 124 130 135 139 Z";
const BOOK_PAGE_RIGHT =
  "M 135 104 C 146 93 161 89 175 89 L 175 125 C 161 125 146 130 135 139 Z";
const BOOK_SPINE = "M 135 103 V 140";

const SHIELD_OUTER =
  "M 74 34 H 326 Q 342 34 342 50 V 252 C 342 322 288 374 200 424 C 112 374 58 322 58 252 V 50 Q 58 34 74 34 Z";
const SHIELD_INNER =
  "M 84 46 H 316 Q 330 46 330 60 V 250 C 330 312 282 358 200 402 C 118 358 70 312 70 250 V 60 Q 70 46 84 46 Z";

/**
 * The Foundry shield as oversized line art, anchored to the right of the home
 * hero and cropped by its edge. The seal's gold turns to mud on the light paper
 * backdrop, so this build is stroke-only in the same blues as the wordmark.
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
        viewBox="0 0 400 470"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Strokes have a flat bbox, so the ramp needs user-space units. */}
          <linearGradient
            id="he-line"
            gradientUnits="userSpaceOnUse"
            x1="58"
            y1="34"
            x2="342"
            y2="424"
          >
            <stop offset="0" stopColor="#3f5ad2" />
            <stop offset="0.45" stopColor="#22349f" />
            <stop offset="1" stopColor="#131f6b" />
          </linearGradient>

          <clipPath id="he-globe-clip">
            <circle cx="258" cy="274" r="24.5" />
          </clipPath>
        </defs>

        <g
          className="home-emblem-float"
          fill="none"
          stroke="url(#he-line)"
          strokeLinejoin="round"
        >
          <path d={SHIELD_OUTER} strokeWidth="3.6" />
          <path d={SHIELD_INNER} strokeWidth="1.8" opacity="0.75" />
          <path d="M 200 46 V 356" strokeWidth="1.8" opacity="0.75" />
          <path d="M 70 224 H 330" strokeWidth="1.8" opacity="0.75" />

          {/* 1 — Knowledge */}
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

          {/* 2 — Craftsmanship */}
          <g strokeWidth="2">
            <path d="M 228 121 L 286 118.5 C 291 118.5 292.5 122 290 126 L 236 126 C 231 126 228 124.5 228 121 Z" />
            <path d="M 257 126 C 260 131 260 136 258 140 L 272 140 C 270 136 270 131 273 126 Z" />
            <path d="M 246 140 L 284 140 L 287 147.5 L 243 147.5 Z" />
            {/* Swings from the grip end of the handle, at 289 74. */}
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
          </g>

          {/* 3 — Innovation */}
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
          <rect x="122" y="256" width="44" height="38" rx="4" strokeWidth="2.4" />
          <text
            x="144"
            y="281"
            fill="url(#he-line)"
            stroke="none"
            fontFamily="var(--font-display)"
            fontSize="17"
            fontWeight="600"
            textAnchor="middle"
            letterSpacing="0.06em"
          >
            AI
          </text>

          {/* 4 — Global leadership */}
          <circle cx="258" cy="274" r="26" strokeWidth="2.4" />
          <g clipPath="url(#he-globe-clip)" strokeWidth="1.5" opacity="0.85">
            <g className="home-emblem-globe">
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
            <path d="M 232 274 H 284" />
            <path d="M 236 262 Q 258 270 280 262" />
            <path d="M 236 286 Q 258 278 280 286" />
          </g>

          <g fill="url(#he-line)" stroke="none" opacity="0.8">
            <path d="M 200 360 C 192 356.5 185 358.5 182 363 C 190 364 196 362.8 200 361 Z" />
            <path d="M 200 360 C 208 356.5 215 358.5 218 363 C 210 364 204 362.8 200 361 Z" />
            <path d="M 200 362 L 203.5 368.5 L 200 375 L 196.5 368.5 Z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
