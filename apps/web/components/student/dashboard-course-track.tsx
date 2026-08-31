"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function DashboardCourseTrack({
  title,
  actionHref,
  actionLabel = "View all",
  children,
  className,
}: {
  title: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 6);
    setCanScrollRight(track.scrollLeft < maxScroll - 6);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollState();

    track.addEventListener("scroll", updateScrollState, { passive: true });
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(track);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [updateScrollState, children]);

  function scrollBy(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector<HTMLElement>(
      ":scope > .dash-continue-card, :scope > .dash-recommended-card",
    );
    const gap = Number.parseFloat(getComputedStyle(track).gap || "16") || 16;
    const amount = card ? card.offsetWidth + gap : Math.max(track.clientWidth * 0.85, 280);
    track.scrollBy({ left: direction * amount, behavior: "smooth" });
  }

  return (
    <section className={cn("dash-track-section", className)}>
      <div className="dash-widget-head">
        <h2 className="dash-widget-title">{title}</h2>
        <div className="dash-track-actions">
          <div className="dash-track-nav">
            <button
              type="button"
              className="dash-track-nav-btn"
              onClick={() => scrollBy(-1)}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} left`}
            >
              <ChevronLeft className="size-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="dash-track-nav-btn"
              onClick={() => scrollBy(1)}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} right`}
            >
              <ChevronRight className="size-4" strokeWidth={1.75} />
            </button>
          </div>
          {actionHref ? (
            <Link href={actionHref} className="dash-widget-link">
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "dash-track-wrap",
          canScrollLeft && "dash-track-wrap-can-left",
          canScrollRight && "dash-track-wrap-can-right",
        )}
      >
        <div ref={trackRef} className="dash-track" tabIndex={0}>
          {children}
        </div>
      </div>
    </section>
  );
}
