/* Every mark in here is decoration. Coordinates are authored against a
   1440x900 field and slice-fitted, so nothing is pinned to a real pixel. */

const BRAND_LINE = "rgba(25, 40, 144, 0.34)";
const LAVENDER_LINE = "rgba(104, 96, 198, 0.32)";

/** One band of the bottom current. Amplitude grows down the stack so the rows
    fan apart slightly instead of reading as a printed rule. */
function wave(y: number, amp: number): string {
  return [
    `M 0 ${y}`,
    `C 210 ${y - amp * 1.15} 382 ${y + amp * 0.85} 560 ${y + amp * 0.4}`,
    `C 754 ${y - amp * 0.1} 882 ${y - amp * 1.35} 1080 ${y - amp * 1.05}`,
    `C 1244 ${y - amp * 0.8} 1348 ${y - amp * 0.2} 1440 ${y - amp * 0.45}`,
  ].join(" ");
}

const WAVES = Array.from({ length: 9 }, (_, i) =>
  wave(148 + i * 19, 30 + i * 2.2),
);

/* Long sweeps that pass behind the copy. They carry the most reach of anything
   here, so they also run the faintest. */
const DEPTH_CURVES = [
  "M -140 900 C 180 720 400 520 520 240 C 580 100 620 20 660 -80",
  "M -180 900 C 140 762 380 580 520 300 C 600 142 650 40 690 -70",
  "M -60 900 C 260 700 470 470 590 180 C 640 60 672 -20 700 -100",
  "M 1520 -60 C 1380 200 1180 380 940 470 C 780 530 660 600 560 720",
];

/* Sparse marks, all of them clear of the copy block (x 100-600, y 240-720)
   and thinned out where the shield sits (x 808-1237). */
const GLYPH_CIRCLES: Array<[number, number, number]> = [
  [152, 96, 4],
  [292, 62, 2.5],
  [432, 128, 3],
  [676, 88, 3.5],
  [858, 140, 2.5],
  [1064, 74, 3],
  [1268, 132, 2.5],
  [1386, 66, 2],
  [54, 348, 2.5],
  [72, 512, 3],
  [46, 646, 2],
  [690, 322, 2.5],
  [742, 486, 3],
  [664, 620, 2.5],
  [196, 812, 3],
  [370, 856, 2.5],
  [560, 796, 3],
  [724, 848, 2.5],
];

const GLYPH_CROSSES: Array<[number, number, number]> = [
  [228, 148, 5],
  [548, 68, 4],
  [956, 92, 5],
  [1176, 178, 4.5],
  [62, 430, 4],
  [716, 404, 4],
  [292, 774, 4.5],
  [634, 736, 4],
];

const GLYPH_TRIANGLES: Array<[number, number, number]> = [
  [368, 92, 6],
  [800, 62, 5],
  [1330, 178, 5.5],
  [120, 758, 6.5],
  [470, 820, 5.5],
];

const GLYPH_LINKS: Array<[number, number, number, number]> = [
  [152, 96, 292, 62],
  [292, 62, 368, 92],
  [676, 88, 800, 62],
  [1064, 74, 1176, 178],
  [196, 812, 370, 856],
  [560, 796, 724, 848],
  [690, 322, 742, 486],
];

/* Lattice at the right edge. Latitude spans are the sphere's true chord widths
   at each height, so the rings sit on the globe rather than across it. */
const GLOBE_LATITUDES = [
  "M 61.7 158 Q 220 176 378.3 158",
  "M 97.6 102 Q 220 122 342.4 102",
  "M 61.7 282 Q 220 300 378.3 282",
  "M 97.6 338 Q 220 356 342.4 338",
];

const NET_NODES: Array<[number, number]> = [
  [40, 62],
  [148, 24],
  [318, 40],
  [412, 116],
  [436, 292],
  [352, 408],
  [188, 432],
  [58, 376],
  [12, 210],
];

const NET_EDGES: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [8, 0],
  [1, 4],
  [2, 6],
  [0, 5],
];

/**
 * The atmosphere behind the home hero: a soft wash carrying a bottom current,
 * particle drifts in the left corners, scattered survey marks, and a network
 * globe off the right edge.
 *
 * Sits below the emblem and takes no pointer events — it is never interactive
 * and never announces itself.
 */
export function HomeHeroBackdrop() {
  return (
    <div className="home-backdrop" aria-hidden>
      <div className="home-backdrop-dots home-backdrop-dots-tl" />
      <div className="home-backdrop-dots home-backdrop-dots-bl" />

      <svg
        className="home-backdrop-curves"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke={LAVENDER_LINE} strokeWidth="1.1" opacity="0.26">
          {DEPTH_CURVES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>

      <svg
        className="home-backdrop-glyphs"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke={BRAND_LINE} strokeWidth="1.1">
          <g opacity="0.5">
            {GLYPH_LINKS.map(([x1, y1, x2, y2]) => (
              <path
                key={`link-${x1}-${y1}-${x2}-${y2}`}
                d={`M ${x1} ${y1} L ${x2} ${y2}`}
              />
            ))}
          </g>
          {GLYPH_CIRCLES.map(([cx, cy, r]) => (
            <circle key={`c-${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
          {GLYPH_CROSSES.map(([x, y, r]) => (
            <path
              key={`x-${x}-${y}`}
              d={`M ${x - r} ${y} H ${x + r} M ${x} ${y - r} V ${y + r}`}
            />
          ))}
          {GLYPH_TRIANGLES.map(([x, y, r]) => (
            <path
              key={`t-${x}-${y}`}
              d={`M ${x} ${y - r} L ${x + r * 0.87} ${y + r * 0.5} L ${x - r * 0.87} ${y + r * 0.5} Z`}
              strokeLinejoin="round"
            />
          ))}
        </g>
      </svg>

      <svg
        className="home-backdrop-network"
        viewBox="0 0 448 448"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke={BRAND_LINE} strokeWidth="1.1">
          <g opacity="0.6">
            <circle cx="220" cy="220" r="170" />
            <ellipse cx="220" cy="220" rx="58" ry="170" />
            <ellipse cx="220" cy="220" rx="116" ry="170" />
            <path d="M 220 50 V 390" />
            <path d="M 50 220 H 390" />
            {GLOBE_LATITUDES.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
          <g opacity="0.45">
            {NET_EDGES.map(([a, b]) => (
              <path
                key={`e-${a}-${b}`}
                d={`M ${NET_NODES[a][0]} ${NET_NODES[a][1]} L ${NET_NODES[b][0]} ${NET_NODES[b][1]}`}
              />
            ))}
          </g>
          <g fill={BRAND_LINE} stroke="none" opacity="0.7">
            {NET_NODES.map(([cx, cy]) => (
              <circle key={`n-${cx}-${cy}`} cx={cx} cy={cy} r="3.2" />
            ))}
          </g>
        </g>
      </svg>

      <svg
        className="home-backdrop-waves"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none" stroke={BRAND_LINE} strokeWidth="1.1" opacity="0.44">
          {WAVES.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}
