import { formatDistanceToNowStrict } from "date-fns";

/** Shared by the server page and the client table, so it stays framework-free. */

export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

/** Reads as "In 12 months", "Expired", or "No expiry". */
export function accessExpiryLabel(expiresAt: Date | string | null): string {
  if (!expiresAt) return "No expiry";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "No expiry";
  if (date.getTime() <= Date.now()) return "Expired";
  return `In ${formatDistanceToNowStrict(date)}`;
}

/** Formats for a native `<input type="date">`, which needs YYYY-MM-DD. */
export function toDateInputValue(expiresAt: Date | string | null): string {
  if (!expiresAt) return "";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}
