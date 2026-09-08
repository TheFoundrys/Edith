export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Clamps an untrusted `pageSize` search param to a supported option. */
export function resolvePageSize(raw: string | undefined): number {
  const parsed = Number(raw);
  return (PAGE_SIZE_OPTIONS as readonly number[]).includes(parsed)
    ? parsed
    : DEFAULT_PAGE_SIZE;
}

export function parsePage(raw: string | undefined, totalPages: number) {
  const requested = Math.max(1, Math.trunc(Number(raw)) || 1);
  return Math.min(requested, Math.max(1, totalPages));
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const safePage = parsePage(String(page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    page: safePage,
    totalPages,
    total,
    pageSize,
    start,
    items: items.slice(start, start + pageSize),
  };
}

export function pageHref(
  pathname: string,
  page: number,
  pageSize: number,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams(extra);
  if (pageSize !== DEFAULT_PAGE_SIZE) params.set("pageSize", String(pageSize));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
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
