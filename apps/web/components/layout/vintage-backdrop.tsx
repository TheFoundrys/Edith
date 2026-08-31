import { FilmGrainLayer } from "@/components/layout/film-grain-layer";

/** Workspace — cinematic white/blue atmosphere + fine film grain. Other variants use legacy photo. */
export function VintageBackdrop({
  variant = "workspace",
}: {
  variant?: "workspace" | "marketing" | "hero";
}) {
  if (variant === "workspace") {
    return (
      <div className="vintage-backdrop" data-variant={variant} aria-hidden>
        <div className="edith-atmosphere-base" />
        <div className="edith-atmosphere-field edith-atmosphere-field-1" />
        <div className="edith-atmosphere-field edith-atmosphere-field-2" />
        <div className="edith-atmosphere-field edith-atmosphere-field-3" />
        <div className="edith-atmosphere-luma" />
        <div className="edith-atmosphere-calm" />
        <div className="edith-atmosphere-grain-wrap">
          <FilmGrainLayer />
        </div>
      </div>
    );
  }

  return (
    <div className="vintage-backdrop" data-variant={variant} aria-hidden>
      <div className="vintage-backdrop-photo" />
      <div className="vintage-backdrop-vignette" />
      <div className="vintage-backdrop-grain">
        <div className="vintage-backdrop-grain-fine" />
        <div className="vintage-backdrop-grain-static" />
      </div>
    </div>
  );
}

export const VINTAGE_BACKDROP_SRC = "/backgrounds/edith-gradient.png";
