"use client";

import {
  Children,
  isValidElement,
  cloneElement,
  useEffect,
  useMemo,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type InfiniteSliderProps = {
  children: ReactNode;
  gap?: number;
  /** Seconds for one full loop — lower is faster. */
  speed?: number;
  /** Loop duration on hover (seconds) — use a higher value than `speed` to slow on hover. */
  speedOnHover?: number;
  className?: string;
  direction?: "left" | "right";
};

export function InfiniteSlider({
  children,
  gap = 24,
  speed = 50,
  speedOnHover,
  className,
  direction = "left",
}: InfiniteSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const hoveredRef = useRef(false);
  const initializedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const rafRef = useRef<number | undefined>(undefined);

  const items = useMemo(() => Children.toArray(children), [children]);
  const loop = useMemo(
    () =>
      [...items, ...items].map((child, index) => {
        if (isValidElement(child)) {
          return cloneElement(child as ReactElement<{ key?: string | number }>, {
            key: `${child.key ?? index}-${index}`,
          });
        }
        return (
          <div key={index} className="infinite-slider-item">
            {child}
          </div>
        );
      }),
    [items],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotionRef.current = motionQuery.matches;

    const onMotionChange = (event: MediaQueryListEvent) => {
      reducedMotionRef.current = event.matches;
      if (event.matches) {
        track.style.transform = "";
      }
    };
    motionQuery.addEventListener("change", onMotionChange);

    const measureLoopWidth = () => {
      const half = track.scrollWidth / 2;
      loopWidthRef.current = half;

      if (!initializedRef.current && half > 0) {
        if (direction === "right") {
          offsetRef.current = -half;
        }
        initializedRef.current = true;
      }
    };

    measureLoopWidth();
    const resizeObserver = new ResizeObserver(measureLoopWidth);
    resizeObserver.observe(track);

    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!reducedMotionRef.current) {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        const duration =
          hoveredRef.current && speedOnHover != null ? speedOnHover : speed;
        const loopWidth = loopWidthRef.current;

        if (loopWidth > 0 && duration > 0) {
          const pxPerSec = loopWidth / duration;
          const delta = pxPerSec * dt * (direction === "left" ? -1 : 1);
          offsetRef.current += delta;

          if (direction === "left") {
            while (offsetRef.current <= -loopWidth) {
              offsetRef.current += loopWidth;
            }
          } else {
            while (offsetRef.current >= 0) {
              offsetRef.current -= loopWidth;
            }
          }

          track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
        }
      }

      lastTime = now;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      motionQuery.removeEventListener("change", onMotionChange);
      resizeObserver.disconnect();
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed, speedOnHover, direction, items.length]);

  return (
    <div
      className={cn("infinite-slider", className)}
      onMouseEnter={() => {
        hoveredRef.current = true;
      }}
      onMouseLeave={() => {
        hoveredRef.current = false;
      }}
    >
      <div
        ref={trackRef}
        className="infinite-slider-track"
        style={{ gap: `${gap}px` }}
      >
        {loop}
      </div>
    </div>
  );
}
