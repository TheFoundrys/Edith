"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Trigger + anchored panel, closing on outside click or Escape.
 *
 * Rendered in the admin design language rather than reusing the marketing
 * `.courses-filter-*` classes, which are scoped to the courses catalog.
 */
export function Dropdown({
  label,
  children,
  align = "start",
  disabled,
  className,
  panelClassName,
  ariaLabel,
}: {
  label: React.ReactNode;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  align?: "start" | "end";
  disabled?: boolean;
  className?: string;
  panelClassName?: string;
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-[var(--radius-sm)]",
          "border border-border bg-bg-elevated px-3 text-left text-sm text-fg",
          "transition-[border-color,box-shadow] duration-[var(--duration)] hover:border-border-strong disabled:opacity-50",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        )}
      >
        <span className="truncate">{label}</span>
        <span aria-hidden className="text-fg-muted">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          className={cn(
            "absolute z-30 mt-1 min-w-full overflow-hidden rounded-[var(--radius-sm)] border border-border",
            "bg-bg-elevated p-1 shadow-[var(--shadow-hover)] animate-[filter-in_var(--duration)_ease]",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      ) : null}
    </div>
  );
}

/** Checkbox row for use inside a Dropdown panel. */
export function DropdownCheckboxItem({
  checked,
  onChange,
  disabled,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm",
        disabled ? "cursor-not-allowed opacity-50" : "hover:bg-bg",
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-3.5 accent-[var(--accent)]"
      />
      <span className="truncate">{children}</span>
    </label>
  );
}

/** Divider between a panel's options and its footer link. */
export function DropdownSeparator() {
  return <div role="separator" className="my-1 border-t border-border" />;
}
