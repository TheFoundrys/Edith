# Emblem motion brief

Brief for the looping hero animation of The Foundry's shield, shown at `/logo`.

Two builds implement the same 7s choreography, both authored in the same 400x470
coordinate space so they are interchangeable:

| Build | Files | Used when |
| --- | --- | --- |
| WebGL, 3D engraved | `components/brand/foundry-emblem-3d.tsx`, `emblem-3d-assets.ts` | default |
| SVG + CSS | `components/brand/foundry-emblem-motion.tsx` (+ `.css`) | reduced motion, no WebGL, SSR first paint |

`app/logo/emblem-stage.tsx` picks between them. Keep this file as the source of
truth for a rendered version too: drop `foundry-emblem-loop.mp4` or `.webm` into
`apps/web/public/brand/` and the `/logo` stage plays the video instead.

Reference lockup: `apps/web/public/brand/foundry-emblem.png`

## Design changes from the reference

- Remove the large circular ring/seal surrounding the shield completely,
  including its ring typography. Keep only the central shield.
- The shield is completely static: no rotation, no floating, no deformation.
- Preserve the gold metallic material, typography, proportions, symbols, and
  dark textured background. Do not redesign the logo or change any text.

## Animation inside the shield

1. **Knowledge — book.** Starts closed, opens slowly to the open-book position,
   holds, then closes again. Reads as a premium embossed metallic book, not
   cartoonish. A very subtle golden highlight crosses the pages as they open. In
   the 3D build the cover swings a full 180 degrees on its spine and two page
   leaves follow slightly behind it.
2. **Craftsmanship — hammer & anvil.** Anvil completely stationary. The hammer
   makes one short, controlled strike, with a tiny golden spark at the point of
   impact, then returns smoothly. Precise and elegant, never aggressive.
3. **Innovation — AI.** Chip and circuit design stay in place. Brief golden
   pulses travel through a few circuit lines; the AI letters glow faintly.
   Minimal and sophisticated.
4. **Global leadership — globe.** Slow continuous rotation around the vertical
   axis, with a subtle metallic highlight moving across the surface. In 3D it is
   a dome set into the field with engraved meridians, turning exactly once per
   cycle so the loop point is invisible.

## How the 3D engraving is built

No modelling tool and no downloaded assets are involved; everything is generated
at runtime from the emblem coordinates.

- **Struck plate.** The shield outline is extruded 22 units deep with a bevel.
  A second extrusion of the outline with the inner shield cut out as a hole sits
  on top, so a polished frame stands 11 units above a recessed field.
- **Cut lettering.** Quadrant labels, the quadrant grooves, and the base
  flourish are drawn into a canvas at 1:1 with the SVG artwork and applied to the
  field as a bump map, plus a matching darkening mask so the cuts read as depth
  rather than as texture. Every vertex is planar-mapped onto the 400x470 space,
  which is what keeps the engraving aligned with the artwork.
- **Relief symbols.** Book, anvil, hammer, chip, and circuit traces are real
  extruded geometry standing proud of the field, all below the frame height so
  the emblem reads as one die-struck medallion. The key light casts shadows;
  without them gold relief on a gold field is invisible.
- **Gold.** Metals need reflections, so a warm studio environment (key softbox,
  cool rims, floor bounce) is painted to a canvas, prefiltered, and used as the
  scene environment. ACES tone mapping keeps the highlights from clipping.

## Overall style

Luxury academic / technology institution. Premium gold on black, realistic
metallic reflections, cinematic studio lighting, deep black textured background,
extremely subtle ambient golden glow. No excessive particles, no flashy effects,
no camera shake, no zoom, no rotation of the shield or emblem.

## Loop

6–8 seconds (implemented at 7s), perfectly seamless:

book opens → hammer strikes → AI pulses → globe rotates → book closes → back to
the starting state. The final frame matches the initial frame so it can loop in a
website hero without a visible jump.

## Camera

Locked, front-facing, very subtle cinematic depth only. Shield centred and
stationary. No camera movement.

## Quality

Ultra-clean 4K cinematic motion graphics, realistic metallic gold reflections,
sharp typography, smooth 60 FPS motion.

Do not add any new text, icons, symbols, objects, or branding. Do not alter the
shield design. Do not animate the shield itself.
