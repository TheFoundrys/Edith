import Link from "next/link";
import { cn } from "@/lib/utils";

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Clamps an untrusted `pageSize` search param to a supported option. */
export function resolvePageSize(raw: string | undefined): number {
  const parsed = Number(raw);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

/**
 * Page numbers with ellipses, always showing first page, last page, and the
 * window either side of the current page. `null` marks a gap.
 */
export function pageWindow(
  current: number,
  totalPages: number,
  span = 1,
): (number | null)[] {
  if (totalPages <= 1) return [1];

  const wanted = new Set<number>([1, totalPages, current]);
  for (let offset = 1; offset <= span; offset += 1) {
    if (current - offset >= 1) wanted.add(current - offset);
    if (current + offset <= totalPages) wanted.add(current + offset);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  let previous = 0;
  for (const page of pages) {
    if (previous && page - previous > 1) out.push(null);
    out.push(page);
    previous = page;
  }
  return out;
}

const cellClass =
  "inline-flex h-8 min-w-8 items-center justify-center rounded-[var(--radius-sm)] px-2 text-sm";

export function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  hrefFor,
  pageSizeHrefFor,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
  /** Switching page size returns to page 1, since offsets no longer line up. */
  pageSizeHrefFor: (pageSize: number) => string;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm text-fg-muted">
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            aria-label="Previous page"
            className={cn(cellClass, "border border-border hover:border-fg")}
          >
            ‹
          </Link>
        ) : (
          <span aria-hidden className={cn(cellClass, "border border-border opacity-40")}>
            ‹
          </span>
        )}

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
            <Link
              key={entry}
              href={hrefFor(entry)}
              className={cn(cellClass, "border border-border text-fg hover:border-fg")}
            >
              {entry}
            </Link>
          ),
        )}

        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            aria-label="Next page"
            className={cn(cellClass, "border border-border hover:border-fg")}
          >
            ›
          </Link>
        ) : (
          <span aria-hidden className={cn(cellClass, "border border-border opacity-40")}>
            ›
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <p className="tabular-nums">
          {total === 0 ? "No rows" : `${from}–${to} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <span>Show</span>
          {PAGE_SIZE_OPTIONS.map((size) =>
            size === pageSize ? (
              <span key={size} className="font-medium text-fg tabular-nums">
                {size}
              </span>
            ) : (
              <Link
                key={size}
                href={pageSizeHrefFor(size)}
                className="tabular-nums underline underline-offset-2 hover:text-fg"
              >
                {size}
              </Link>
            ),
          )}
          <span>rows</span>
        </div>
      </div>
    </div>
  );
}
