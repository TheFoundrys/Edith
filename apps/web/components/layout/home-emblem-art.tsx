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

const GLOBE_CX = 258;
const GLOBE_CY = 274;
const GLOBE_R = 25.2;
const KAPPA = 0.55228475;

/** Pole-to-pole elliptical meridian. `rx` is signed: east positive, west negative. */
function meridianPath(rx: number) {
  const kx = KAPPA * rx;
  const ky = KAPPA * GLOBE_R;
  const x = GLOBE_CX + rx;
  const y0 = GLOBE_CY - GLOBE_R;
  const y3 = GLOBE_CY + GLOBE_R;
  return `M ${GLOBE_CX} ${y0} C ${GLOBE_CX + kx} ${y0} ${x} ${GLOBE_CY - ky} ${x} ${GLOBE_CY} C ${x} ${GLOBE_CY + ky} ${GLOBE_CX + kx} ${y3} ${GLOBE_CX} ${y3}`;
}

const MERIDIAN_STILL = [0, 30, -30, 60, -60].map(
  (deg) => meridianPath(GLOBE_R * Math.sin((deg * Math.PI) / 180)),
);

/* Right limb → centre → left limb, then hold while opacity is 0. */
const MERIDIAN_SPIN_VALUES = [90, 60, 30, 0, -30, -60, -90, -90]
  .map((deg) => meridianPath(GLOBE_R * Math.sin((deg * Math.PI) / 180)))
  .join(";");
const MERIDIAN_SPIN_KEY_TIMES = "0;0.083;0.167;0.25;0.333;0.417;0.5;1";
const MERIDIAN_COUNT = 10;
const MERIDIAN_DUR = "8s";

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

const ANVIL_CROWN =
  "M 228 121 L 286 118.5 C 291 118.5 292.5 122 290 126 L 236 126 C 231 126 228 124.5 228 121 Z";
const ANVIL_NECK =
  "M 257 126 C 260 131 260 136 258 140 L 272 140 C 270 136 270 131 273 126 Z";
const ANVIL_BASE = "M 246 140 L 284 140 L 287 147.5 L 243 147.5 Z";
const HAMMER_SHAFT = "M 289 74 L 266 96";

const INK = "#233B9B";
const INK_MID = "#6176C8";
const INK_LIGHT = "#9AA9E3";
const PLATE = "#F1F4FF";
const GOLD = "#C5A45D";

/* Four sharp tips, broad through the shoulders: 364 wide × 384 tall. */
const SHIELD_OUTER =
  "M 18 46 L 200 16 L 382 46 C 382 200 342 320 200 400 C 58 320 18 200 18 46 Z";
const SHIELD_INNER =
  "M 34 59 L 200 32 L 366 59 C 366 203 328 313 200 382 C 72 313 34 203 34 59 Z";

/**
 * The Foundry shield as a plate on the home hero, with a hammer that strikes.
 * Pass `animated={false}` behind a form.
 */
export function HomeEmblemArt({
  animated = true,
  placement = "overlay",
}: {
  animated?: boolean;
  placement?: "overlay" | "inline";
}) {
  return (
    <div
      className={cn(
        "home-emblem-art pointer-events-none",
        placement === "overlay" && "is-overlay",
        placement === "inline" && "is-inline",
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
          <clipPath id="he-field-clip">
            <path d={SHIELD_INNER} />
          </clipPath>

          <clipPath id="he-globe-clip">
            <circle cx="258" cy="274" r="25.2" />
          </clipPath>

          {/* Cast onto the wave floor so the plate reads as sitting on it. */}
          <filter
            id="he-cast"
            x="-18%"
            y="-8%"
            width="136%"
            height="130%"
            colorInterpolationFilters="sRGB"
          >
            <feDropShadow
              dx="0"
              dy="14"
              stdDeviation="10"
              floodColor={INK}
              floodOpacity="0.18"
            />
          </filter>

          {/* Blur only. Offset lives on the cast group so it can follow motion. */}
          <filter
            id="he-soft-shadow"
            x="-50%"
            y="-50%"
            width="200%"
            height="210%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" />
          </filter>
        </defs>

        <g strokeLinejoin="miter" strokeMiterlimit={8}>
          <path
            d={SHIELD_OUTER}
            fill="#ffffff"
            stroke={INK}
            strokeWidth="3.6"
            filter="url(#he-cast)"
          />
          <path d={SHIELD_INNER} fill={PLATE} stroke="none" />

          <g fill="none" clipPath="url(#he-field-clip)">
            <g stroke={INK_LIGHT} strokeWidth="1.2">
              <path d="M 200 38 V 368" />
              <path d="M 63 204 H 337" />
            </g>

            {/* 1 — Knowledge */}
            <g
              transform="translate(-26.2 -2.74) scale(1.12)"
              stroke={INK}
              fill="none"
            >
              <ellipse
                className="home-emblem-ground"
                cx="135"
                cy="141"
                rx="42"
                ry="9"
                fill={INK}
                stroke="none"
              />
              <g
                className="home-emblem-cast home-emblem-cast-rest"
                filter="url(#he-soft-shadow)"
                strokeWidth="2"
              >
                <path d={BOOK_PAGE_LEFT} />
                <path d={BOOK_SPINE} />
              </g>
              <g strokeWidth="2">
                <path d={BOOK_PAGE_LEFT} />
                <path d={BOOK_SPINE} />
              </g>
              <g stroke={INK_MID} strokeWidth="1.2">
                {BOOK_RULES_LEFT.map((d) => (
                  <path key={d} d={d} />
                ))}
              </g>
              <g transform="translate(135 121)">
                <g className="home-emblem-page">
                  {animated ? (
                    <animateTransform
                      attributeName="transform"
                      attributeType="XML"
                      type="scale"
                      values="1 1; 1 1; 0.12 1; 0.78 1; 1 1"
                      keyTimes="0; 0.58; 0.72; 0.82; 1"
                      dur="5.5s"
                      repeatCount="indefinite"
                      calcMode="spline"
                      keySplines="0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1; 0.42 0 0.58 1"
                    />
                  ) : null}
                  <g transform="translate(-135 -121)" strokeWidth="2">
                    <path d={BOOK_PAGE_RIGHT} />
                    <g stroke={INK_MID} strokeWidth="1.2">
                      {BOOK_RULES_RIGHT.map((d) => (
                        <path key={d} d={d} />
                      ))}
                    </g>
                  </g>
                </g>
              </g>
            </g>

            {/* 2 — Craftsmanship. Hammer shadow lengthens on the lift, bites on impact. */}
            <g
              fill="none"
              stroke={INK}
              strokeWidth="2"
              transform="translate(-8.2 7.33) scale(1.07)"
            >
              <ellipse
                className="home-emblem-ground home-emblem-anvil-ground"
                cx="262"
                cy="150"
                rx="40"
                ry="8"
                fill={INK}
                stroke="none"
              />
              <g
                className="home-emblem-cast home-emblem-cast-rest"
                filter="url(#he-soft-shadow)"
              >
                <path d={ANVIL_CROWN} />
                <path d={ANVIL_NECK} />
                <path d={ANVIL_BASE} />
              </g>
              <g filter="url(#he-soft-shadow)">
                <g className="home-emblem-cast home-emblem-hammer-cast">
                  <path
                    d={HAMMER_SHAFT}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <g transform="rotate(47.5 256 101)">
                    <rect x="243" y="94.5" width="26" height="13" rx="2.5" />
                    <rect x="240.5" y="92.5" width="6" height="17" rx="1.5" />
                  </g>
                </g>
              </g>
              <path d={ANVIL_CROWN} />
              <path d={ANVIL_NECK} />
              <path d={ANVIL_BASE} />
              <g className="home-emblem-hammer">
                <path
                  d={HAMMER_SHAFT}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
                <g transform="rotate(47.5 256 101)">
                  <rect x="243" y="94.5" width="26" height="13" rx="2.5" />
                  <rect x="240.5" y="92.5" width="6" height="17" rx="1.5" />
                </g>
              </g>
              <g
                className="home-emblem-strike"
                stroke={GOLD}
                strokeLinecap="round"
                fill="none"
              >
                <path d="M 266 121 L 260 111" strokeWidth="1.8" />
                <path d="M 266 121 L 274 112" strokeWidth="1.8" />
                <path d="M 266 121 L 278 120" strokeWidth="1.6" />
              </g>
            </g>

            {/* 3 — Innovation. Chip sits still; pads blink without casting. */}
            <g transform="translate(-1.2 -7.75) scale(1.05)" stroke={INK} fill="none">
              <ellipse
                className="home-emblem-ground home-emblem-ground-chip"
                cx="144"
                cy="312"
                rx="38"
                ry="8"
                fill={INK}
                stroke="none"
              />
              <g
                className="home-emblem-cast home-emblem-cast-rest home-emblem-cast-chip"
                filter="url(#he-soft-shadow)"
              >
                <g strokeWidth="1.8">
                  {CIRCUIT_LEGS.map(([x1, y1, x2, y2]) => (
                    <path
                      key={`cast-${x1}-${y1}-${x2}-${y2}`}
                      d={`M ${x1} ${y1} L ${x2} ${y2}`}
                    />
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
              </g>
              <g stroke={INK_MID} strokeWidth="1.8">
                {CIRCUIT_LEGS.map(([x1, y1, x2, y2]) => (
                  <path
                    key={`leg-${x1}-${y1}-${x2}-${y2}`}
                    d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  />
                ))}
              </g>
              <g stroke="none">
                {CIRCUIT_LEGS.map(([, , , , cx, cy], i) => (
                  <circle
                    key={`dot-${cx}-${cy}`}
                    className="home-emblem-chip-node"
                    cx={cx}
                    cy={cy}
                    r="2.4"
                    fill={cx === 144 && cy === 241 ? GOLD : INK_LIGHT}
                    style={{ animationDelay: `${i * 0.16}s` }}
                  />
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
                fill={INK}
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

            {/* 4 — Connect. Sphere umbra on the plate; meridians do not spin a shadow. */}
            <g transform="translate(-117.52 -114.56) scale(1.44)" fill="none">
              <ellipse
                className="home-emblem-ground home-emblem-globe-ground"
                cx="262"
                cy="301"
                rx="24"
                ry="6.5"
                fill={INK}
                stroke="none"
              />
              <circle
                className="home-emblem-cast home-emblem-cast-rest"
                cx="258"
                cy="274"
                r="26"
                stroke={INK}
                strokeWidth="1.6"
                filter="url(#he-soft-shadow)"
              />
              <circle
                cx="258"
                cy="274"
                r="26"
                stroke={INK}
                strokeWidth="1.6"
              />
              <g
                clipPath="url(#he-globe-clip)"
                stroke={INK_MID}
                strokeWidth="1.05"
              >
                <g className="home-emblem-meridians-still" opacity="0.85">
                  {MERIDIAN_STILL.map((d) => (
                    <path key={d} d={d} />
                  ))}
                </g>
                {animated ? (
                  <g className="home-emblem-meridians-spin" opacity="0.85">
                    {Array.from({ length: MERIDIAN_COUNT }, (_, i) => (
                      <path key={`mer-${i}`} d={MERIDIAN_STILL[0]}>
                        <animate
                          attributeName="d"
                          values={MERIDIAN_SPIN_VALUES}
                          keyTimes={MERIDIAN_SPIN_KEY_TIMES}
                          dur={MERIDIAN_DUR}
                          begin={`${-i * 0.8}s`}
                          repeatCount="indefinite"
                          calcMode="linear"
                        />
                        <animate
                          attributeName="opacity"
                          values="1;1;1;1;1;1;0;0"
                          keyTimes={MERIDIAN_SPIN_KEY_TIMES}
                          dur={MERIDIAN_DUR}
                          begin={`${-i * 0.8}s`}
                          repeatCount="indefinite"
                        />
                      </path>
                    ))}
                  </g>
                ) : null}
                <g opacity="0.85">
                  <ellipse cx="258" cy="274" rx="25.2" ry="7.5" />
                  <ellipse cx="258" cy="263" rx="21.5" ry="4.4" />
                  <ellipse cx="258" cy="285" rx="21.5" ry="4.4" />
                </g>
              </g>
            </g>
          </g>

          <path
            d={SHIELD_INNER}
            fill="none"
            stroke={INK}
            strokeWidth="1.8"
          />
        </g>
      </svg>
    </div>
  );
}
