import * as THREE from "three";

/**
 * Shapes and engraving maps for the 3D emblem. Everything is authored in the
 * same 400x470 coordinate space as the SVG emblem, with y flipped so it reads
 * as a normal three.js scene. The root group scales the whole thing by 0.01.
 */

export const VIEW_W = 400;
export const VIEW_H = 470;
const CX = VIEW_W / 2;
const CY = VIEW_H / 2;

/** SVG x to local x. */
export const px = (v: number) => v - CX;
/** SVG y to local y (y up). */
export const py = (v: number) => CY - v;

/** Compact path data: 2 numbers = line, 4 = quadratic, 6 = cubic. */
type ShieldOutline = ReadonlyArray<readonly number[]>;

const OUTER_D: ShieldOutline = [
  [74, 34],
  [326, 34],
  [342, 34, 342, 50],
  [342, 252],
  [342, 322, 288, 374, 200, 424],
  [112, 374, 58, 322, 58, 252],
  [58, 50],
  [58, 34, 74, 34],
];

const INNER_D: ShieldOutline = [
  [84, 46],
  [316, 46],
  [330, 46, 330, 60],
  [330, 250],
  [330, 312, 282, 358, 200, 402],
  [118, 358, 70, 312, 70, 250],
  [70, 60],
  [70, 46, 84, 46],
];

function traceShield(target: THREE.Shape | THREE.Path, d: ShieldOutline) {
  d.forEach((seg, index) => {
    if (index === 0) {
      target.moveTo(px(seg[0]), py(seg[1]));
      return;
    }
    if (seg.length === 2) {
      target.lineTo(px(seg[0]), py(seg[1]));
    } else if (seg.length === 4) {
      target.quadraticCurveTo(px(seg[0]), py(seg[1]), px(seg[2]), py(seg[3]));
    } else {
      target.bezierCurveTo(
        px(seg[0]),
        py(seg[1]),
        px(seg[2]),
        py(seg[3]),
        px(seg[4]),
        py(seg[5]),
      );
    }
  });
  target.closePath();
}

export function shieldOuterShape() {
  const shape = new THREE.Shape();
  traceShield(shape, OUTER_D);
  return shape;
}

export function shieldInnerShape() {
  const shape = new THREE.Shape();
  traceShield(shape, INNER_D);
  return shape;
}

/** Outer shield with the field cut out, so it extrudes as a raised frame. */
export function shieldRimShape() {
  const rim = shieldOuterShape();
  const inner = new THREE.Path();
  traceShield(inner, INNER_D);
  rim.holes.push(new THREE.Path(inner.getPoints(160)));
  return rim;
}

export function roundedRectShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  const x = w / 2;
  const y = h / 2;
  shape.moveTo(-x + r, -y);
  shape.lineTo(x - r, -y);
  shape.quadraticCurveTo(x, -y, x, -y + r);
  shape.lineTo(x, y - r);
  shape.quadraticCurveTo(x, y, x - r, y);
  shape.lineTo(-x + r, y);
  shape.quadraticCurveTo(-x, y, -x, y - r);
  shape.lineTo(-x, -y + r);
  shape.quadraticCurveTo(-x, -y, -x + r, -y);
  shape.closePath();
  return shape;
}

export function roundedFrameShape(
  w: number,
  h: number,
  r: number,
  innerW: number,
  innerH: number,
  innerR: number,
) {
  const frame = roundedRectShape(w, h, r);
  frame.holes.push(new THREE.Path(roundedRectShape(innerW, innerH, innerR).getPoints(12)));
  return frame;
}

/** Anvil silhouette: top plate with a tapered horn, waist, and base. */
export function anvilShapes() {
  const plate = new THREE.Shape();
  plate.moveTo(px(228), py(121));
  plate.lineTo(px(286), py(118.5));
  plate.bezierCurveTo(px(291), py(118.5), px(292.5), py(122), px(290), py(126));
  plate.lineTo(px(236), py(126));
  plate.bezierCurveTo(px(231), py(126), px(228), py(124.5), px(228), py(121));
  plate.closePath();

  const waist = new THREE.Shape();
  waist.moveTo(px(257), py(126));
  waist.bezierCurveTo(px(260), py(131), px(260), py(136), px(258), py(140));
  waist.lineTo(px(272), py(140));
  waist.bezierCurveTo(px(270), py(136), px(270), py(131), px(273), py(126));
  waist.closePath();

  const base = new THREE.Shape();
  base.moveTo(px(246), py(140));
  base.lineTo(px(284), py(140));
  base.lineTo(px(287), py(147.5));
  base.lineTo(px(243), py(147.5));
  base.closePath();

  return [plate, waist, base];
}

/**
 * Extrudes toward the camera with a small bevel, then shifts the result so the
 * back face sits at z=0 and the front face at z=depth.
 */
export function extrude(
  shapes: THREE.Shape | THREE.Shape[],
  depth: number,
  bevel = 0.8,
  curveSegments = 24,
) {
  const bevelled = bevel > 0 && depth > bevel * 2.5;
  const geometry = new THREE.ExtrudeGeometry(shapes, {
    depth: bevelled ? depth - bevel * 2 : depth,
    bevelEnabled: bevelled,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: 0,
    bevelSegments: 2,
    curveSegments,
  });
  if (bevelled) geometry.translate(0, 0, bevel);
  return geometry;
}

/** Maps every vertex onto the 400x470 emblem space so engraving maps line up. */
export function applyEmblemUv(geometry: THREE.BufferGeometry) {
  const position = geometry.attributes.position;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i += 1) {
    uv[i * 2] = (position.getX(i) + CX) / VIEW_W;
    uv[i * 2 + 1] = (position.getY(i) + CY) / VIEW_H;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

/* ------------------------------------------------------------------ *
 * Engraving maps. Mid grey is the untouched surface, darker is cut in.
 * ------------------------------------------------------------------ */

const FLAT = "#808080";
const CUT = "#1c1c1c";
const LIP = "#c8c8c8";

function canvas2d(width: number, height: number) {
  const el = document.createElement("canvas");
  el.width = width;
  el.height = height;
  const ctx = el.getContext("2d");
  if (!ctx) throw new Error("2D canvas is unavailable");
  return { el, ctx };
}

function toTexture(el: HTMLCanvasElement, repeatWrap = false) {
  const texture = new THREE.CanvasTexture(el);
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 8;
  if (repeatWrap) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  }
  return texture;
}

/** Roman caps with manual tracking, centred on x. */
function drawTracked(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  baseline: number,
  size: number,
  tracking: number,
) {
  ctx.font = `500 ${size}px Georgia, "Times New Roman", serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const widths = [...text].map((ch) => ctx.measureText(ch).width);
  const total =
    widths.reduce((sum, w) => sum + w, 0) + tracking * (text.length - 1);
  let x = cx - total / 2;
  [...text].forEach((ch, index) => {
    ctx.fillText(ch, x, baseline);
    x += widths[index] + tracking;
  });
}

/**
 * Engraving on the shield field: quadrant labels, quadrant dividers, and the
 * base flourish, plus a faint brushed grain. Aligned 1:1 with the SVG artwork.
 *
 * "bump" shapes the surface normals; "ao" is the same artwork as a darkening
 * mask, which is what makes the cuts read as depth rather than as texture.
 */
export function makeFieldEngraving(mode: "bump" | "ao" = "bump") {
  const base = mode === "bump" ? FLAT : "#ffffff";
  const cut = mode === "bump" ? CUT : "#5a5a5a";
  const scale = 2.56;
  const { el, ctx } = canvas2d(VIEW_W * scale, VIEW_H * scale);
  ctx.scale(scale, scale);

  ctx.fillStyle = base;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Brushed grain so the flats are not perfectly mirror-like.
  for (let i = 0; mode === "bump" && i < 900; i += 1) {
    const y = Math.random() * VIEW_H;
    const x = Math.random() * VIEW_W;
    const len = 8 + Math.random() * 46;
    ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},0.05)`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (Math.random() - 0.5) * 1.6);
    ctx.stroke();
  }

  // Quadrant dividers as chiselled grooves: a cut line with a bright lip.
  const groove = (x1: number, y1: number, x2: number, y2: number) => {
    ctx.filter = "blur(1.2px)";
    ctx.strokeStyle = cut;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    if (mode === "bump") {
      ctx.strokeStyle = LIP;
      ctx.lineWidth = 1;
      const nx = y1 === y2 ? 0 : 1.8;
      const ny = y1 === y2 ? 1.8 : 0;
      ctx.beginPath();
      ctx.moveTo(x1 + nx, y1 + ny);
      ctx.lineTo(x2 + nx, y2 + ny);
      ctx.stroke();
    }
    ctx.filter = "none";
  };
  groove(200, 46, 200, 356);
  groove(70, 224, 330, 224);

  // Labels
  ctx.filter = "blur(1.6px)";
  ctx.fillStyle = cut;
  drawTracked(ctx, "KNOWLEDGE", 135, 180, 13, 13 * 0.12);
  drawTracked(ctx, "CRAFTSMANSHIP", 265, 180, 11.5, 11.5 * 0.12);
  drawTracked(ctx, "INNOVATION", 144, 332, 10.5, 10.5 * 0.12);
  drawTracked(ctx, "GLOBAL", 258, 322, 10.5, 10.5 * 0.12);
  drawTracked(ctx, "LEADERSHIP", 258, 336, 10.5, 10.5 * 0.12);

  // Base flourish
  ctx.beginPath();
  ctx.moveTo(200, 360);
  ctx.bezierCurveTo(192, 356.5, 185, 358.5, 182, 363);
  ctx.bezierCurveTo(190, 364, 196, 362.8, 200, 361);
  ctx.moveTo(200, 360);
  ctx.bezierCurveTo(208, 356.5, 215, 358.5, 218, 363);
  ctx.bezierCurveTo(210, 364, 204, 362.8, 200, 361);
  ctx.moveTo(200, 362);
  ctx.lineTo(203.5, 368.5);
  ctx.lineTo(200, 375);
  ctx.lineTo(196.5, 368.5);
  ctx.fill();
  ctx.filter = "none";

  return toTexture(el);
}

/** Equirectangular meridian/parallel grid engraved into the globe. */
export function makeGlobeEngraving() {
  const { el, ctx } = canvas2d(1024, 512);
  ctx.fillStyle = FLAT;
  ctx.fillRect(0, 0, 1024, 512);
  ctx.filter = "blur(1.4px)";

  ctx.strokeStyle = CUT;
  for (let i = 0; i < 12; i += 1) {
    const x = (i / 12) * 1024;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 512);
    ctx.stroke();
  }

  [0.5, 0.28, 0.72, 0.12, 0.88].forEach((lat, index) => {
    ctx.lineWidth = index === 0 ? 4.5 : 3;
    ctx.beginPath();
    ctx.moveTo(0, lat * 512);
    ctx.lineTo(1024, lat * 512);
    ctx.stroke();
  });

  ctx.filter = "none";
  return toTexture(el, true);
}

/** Ruled page lines for the book's paper block. */
export function makePageEngraving() {
  const { el, ctx } = canvas2d(256, 256);
  ctx.fillStyle = "#8c8c8c";
  ctx.fillRect(0, 0, 256, 256);
  ctx.filter = "blur(1.1px)";
  ctx.strokeStyle = "#4a4a4a";
  ctx.lineWidth = 2.2;
  for (let i = 1; i < 9; i += 1) {
    const y = (i / 9) * 256;
    ctx.beginPath();
    ctx.moveTo(38, y);
    ctx.lineTo(218, y);
    ctx.stroke();
  }
  ctx.filter = "none";
  return toTexture(el);
}

/** Inset border line engraved into the book covers. */
export function makeCoverEngraving() {
  const { el, ctx } = canvas2d(256, 256);
  ctx.fillStyle = FLAT;
  ctx.fillRect(0, 0, 256, 256);
  ctx.filter = "blur(1.3px)";
  ctx.strokeStyle = CUT;
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 26, 196, 204);
  ctx.strokeStyle = LIP;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(33, 29, 190, 198);
  ctx.filter = "none";
  return toTexture(el);
}

/** White "AI" on black, used as a cutout mask for the chip lettering. */
export function makeAiMask() {
  const { el, ctx } = canvas2d(256, 160);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 256, 160);
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  drawTracked(ctx, "AI", 128, 84, 108, 10);
  return toTexture(el);
}

/**
 * Procedural studio environment: a warm key softbox, cool rims, and a dim warm
 * floor bounce. Gold needs reflections to read as metal, and this keeps the
 * scene self-contained with no HDR asset to download.
 */
export function makeStudioEnvironment() {
  const { el, ctx } = canvas2d(1024, 512);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, 1024, 512);

  const blob = (
    x: number,
    y: number,
    r: number,
    color: string,
    alpha: number,
  ) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.globalAlpha = 1;
  };

  blob(300, 90, 300, "#fff3dc", 1);
  blob(760, 130, 220, "#dce8ff", 0.7);
  blob(120, 300, 200, "#ffe3b0", 0.35);
  blob(900, 360, 240, "#8fa6c8", 0.25);
  blob(512, 470, 420, "#3a2c18", 0.45);

  const texture = toTexture(el);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
