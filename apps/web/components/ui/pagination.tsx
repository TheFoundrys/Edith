"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PAGE_SIZE_OPTIONS,
  pageHref,
  pageWindow,
} from "@/lib/pagination";

const cellClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm";

type PaginationProps = {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  unit?: string;
  /** URL-driven paging. Pass serializable data from Server Components. */
  pathname?: string;
  query?: Record<string, string>;
  onPage?: (page: number) => void;
  onPageSize?: (pageSize: number) => void;
};

export function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  unit = "rows",
  pathname,
  query,
  onPage,
  onPageSize,
}: PaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const hrefForPage = (nextPage: number) =>
    pathname ? pageHref(pathname, nextPage, pageSize, query) : undefined;

  const goPage = (next: number) => {
    if (onPage) onPage(next);
  };
  const goSize = (next: number) => {
    if (onPageSize) onPageSize(next);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-fg-muted">
      <div className="flex items-center gap-1">
        <StepControl
          label="‹"
          ariaLabel="Previous page"
          disabled={page <= 1}
          href={page > 1 ? hrefForPage(page - 1) : undefined}
          onClick={onPage && page > 1 ? () => goPage(page - 1) : undefined}
        />

        {pageWindow(page, totalPages).map((entry, i) =>
          entry === null ? (
            <span key={`gap-${i}`} className={cn(cellClass, "text-fg-muted")}>
              …
            </span>
          ) : entry === page ? (
            <span
              key={entry}
              aria-current="page"
              className={cn(cellClass, "bg-accent text-accent-fg")}
            >
              {entry}
            </span>
          ) : (
            <StepControl
              key={entry}
              label={String(entry)}
              href={hrefForPage(entry)}
              onClick={onPage ? () => goPage(entry) : undefined}
            />
          ),
        )}

        <StepControl
          label="›"
          ariaLabel="Next page"
          disabled={page >= totalPages}
          href={page < totalPages ? hrefForPage(page + 1) : undefined}
          onClick={onPage && page < totalPages ? () => goPage(page + 1) : undefined}
        />
      </div>

      <div className="flex items-center gap-4">
        <p className="tabular-nums">
          {total === 0 ? `No ${unit}` : `${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <span>Show</span>
          {PAGE_SIZE_OPTIONS.map((size) => {
            if (size === pageSize) {
              return (
                <span key={size} className="font-medium text-fg tabular-nums">
                  {size}
                </span>
              );
            }
            if (pathname) {
              return (
                <Link
                  key={size}
                  href={pageHref(pathname, 1, size, query)}
                  className="tabular-nums underline underline-offset-2 hover:text-fg"
                >
                  {size}
                </Link>
              );
            }
            if (onPageSize) {
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => goSize(size)}
                  className="tabular-nums underline underline-offset-2 hover:text-fg"
                >
                  {size}
                </button>
              );
            }
            return null;
          })}
          <span>{unit}</span>
        </div>
      </div>
    </div>
  );
}

function StepControl({
  label,
  ariaLabel,
  disabled,
  href,
  onClick,
}: {
  label: string;
  ariaLabel?: string;
  disabled?: boolean;
  href?: string;
  onClick?: () => void;
}) {
  if (disabled) {
    return (
      <span aria-hidden className={cn(cellClass, "border border-border opacity-40")}>
        {label}
      </span>
    );
  }
  if (href) {
    return (
      <Link
        href={href}
        aria-label={ariaLabel}
        className={cn(cellClass, "border border-border hover:border-fg")}
      >
        {label}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(cellClass, "border border-border hover:border-fg")}
    >
      {label}
    </button>
  );
}
