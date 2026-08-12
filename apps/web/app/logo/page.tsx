import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FoundryEmblemMotion } from "@/components/brand/foundry-emblem-motion";
import { APP_NAME } from "@/lib/brand";
import { EmblemStage } from "./emblem-stage";
import "./logo.css";

export const metadata: Metadata = {
  title: "Emblem",
  description:
    "The Foundry's shield in motion — a seamless hero loop of knowledge, craftsmanship, innovation, and global leadership.",
};

const LOOP_SOURCES = [
  { file: "foundry-emblem-loop.webm", type: "video/webm" },
  { file: "foundry-emblem-loop.mp4", type: "video/mp4" },
];

/** A rendered loop dropped into public/brand takes over from the SVG version. */
function renderedLoopSources() {
  return LOOP_SOURCES.filter(({ file }) =>
    existsSync(path.join(process.cwd(), "public", "brand", file)),
  );
}

const PILLARS = [
  {
    name: "Knowledge",
    note: "The book opens and closes — curriculum before everything else.",
  },
  {
    name: "Craftsmanship",
    note: "One measured hammer strike. Work that is made, not assembled.",
  },
  {
    name: "Innovation",
    note: "Current moving through the circuit. AI at the centre of the chip.",
  },
  {
    name: "Global leadership",
    note: "A globe that never stops turning, lit from a single source.",
  },
];

const NOTES = [
  {
    label: "Struck, not drawn",
    text: "The shield is an extruded gold plate: a polished frame raised around a recessed field, with the lettering, quadrant grooves, and base flourish cut into the metal as engraving.",
  },
  {
    label: "Shield locked",
    text: "The outer seal ring is gone; only the shield remains, and it never rotates, floats, or scales. Every movement happens inside a quadrant.",
  },
  {
    label: "Seamless 7s cycle",
    text: "The cover swings open on its spine, the hammer strikes once, pulses run the circuit, the globe completes exactly one turn, the cover closes. The last frame equals the first.",
  },
  {
    label: "Locked camera",
    text: "Front-facing at a long lens, no zoom, no shake. Depth comes from the relief itself and a procedural studio environment lighting the gold.",
  },
  {
    label: "Always renders something",
    text: "Reduced-motion visitors and browsers without WebGL get the SVG build. Drop foundry-emblem-loop.mp4 (or .webm) into public/brand and a rendered video takes over instead.",
  },
];

export default function LogoPage() {
  const sources = renderedLoopSources();

  return (
    <div className="logo-page">
      <header className="logo-header">
        <Link href="/" className="logo-header-mark">
          {APP_NAME}
        </Link>
        <Link href="/" className="logo-header-back">
          Back to site
        </Link>
      </header>

      <main className="logo-hero">
        <div>
          <p className="logo-eyebrow">The Foundry&rsquo;s &middot; Emblem</p>
          <h1 className="logo-title">
            Forging minds.
            <br />
            Building futures.
          </h1>
          <div className="logo-rule" aria-hidden />
          <p className="logo-lede">
            Four quadrants, one shield, cast in gold on black. The mark holds
            still while the craft inside it works — a hero loop built to run
            forever without ever asking for attention.
          </p>

          <ul className="logo-pillars">
            {PILLARS.map((pillar) => (
              <li key={pillar.name} className="logo-pillar">
                <p className="logo-pillar-name">{pillar.name}</p>
                <p className="logo-pillar-note">{pillar.note}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="logo-stage">
          <div className="logo-frame">
            {sources.length > 0 ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                poster="/brand/foundry-emblem.png"
                aria-label="The Foundry's shield in motion"
              >
                {sources.map(({ file, type }) => (
                  <source key={file} src={`/brand/${file}`} type={type} />
                ))}
              </video>
            ) : (
              <EmblemStage />
            )}
          </div>
          <p className="logo-caption">
            <span>7s seamless loop</span>
            <span>Engraved relief</span>
            <span>Locked camera</span>
            <span>Shield static</span>
          </p>
        </div>
      </main>

      <section className="logo-reference">
        <div className="logo-reference-inner">
          <div>
            <h2 className="logo-section-title">Reference</h2>
            <p className="logo-section-lede">
              Source lockup. The animated shield keeps its material,
              proportions, symbols, and type — the seal ring is removed.
            </p>
            <Image
              src="/brand/foundry-emblem.png"
              alt="The Foundry's original circular seal emblem"
              width={1024}
              height={1024}
              className="logo-reference-image"
              priority={false}
            />
          </div>

          <div>
            <h2 className="logo-section-title">SVG build</h2>
            <p className="logo-section-lede">
              The same choreography in pure SVG and CSS. Served to
              reduced-motion visitors and anywhere WebGL is unavailable.
            </p>
            <div className="logo-frame logo-frame-sm">
              <FoundryEmblemMotion />
            </div>
          </div>

          <div>
            <h2 className="logo-section-title">Motion rules</h2>
            <ul className="logo-notes">
              {NOTES.map((note, index) => (
                <li key={note.label} className="logo-note">
                  <span className="logo-note-index" aria-hidden>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{note.label}.</strong> {note.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="logo-footer">
        {APP_NAME} &middot; Brand assets
      </footer>
    </div>
  );
}
