"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { FoundryEmblemMotion } from "@/components/brand/foundry-emblem-motion";

const FoundryEmblem3D = dynamic(
  () => import("@/components/brand/foundry-emblem-3d").then((m) => m.FoundryEmblem3D),
  { ssr: false, loading: () => <FoundryEmblemMotion /> },
);

const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(REDUCED).matches;
/** Server render assumes reduced motion so the first paint is the SVG build. */
const getServerSnapshot = () => true;

/**
 * Renders the WebGL emblem, and falls back to the SVG build whenever 3D is a
 * bad idea: reduced-motion preferences or no WebGL context.
 */
export function EmblemStage() {
  const reduceMotion = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (reduceMotion) return <FoundryEmblemMotion />;

  return (
    <div className="logo-canvas">
      <FoundryEmblem3D fallback={<FoundryEmblemMotion />} />
    </div>
  );
}
