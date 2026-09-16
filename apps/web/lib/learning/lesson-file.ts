/** Storage paths written by saveLessonPdf / saveLessonVideo. */
export function isStoredLessonFile(raw: string) {
  const value = raw.trim().replace(/\\/g, "/");
  return /^(private|public)\/[A-Za-z0-9_-]+\/[^/]+$/.test(value);
}

export function parseBytesRange(
  header: string,
  size: number,
): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || size <= 0) return null;
  const hasStart = match[1] !== "";
  const hasEnd = match[2] !== "";
  if (!hasStart && !hasEnd) return null;
  let start = hasStart ? Number(match[1]) : size - Number(match[2]);
  let end = hasEnd ? Number(match[2]) : size - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end < start || start >= size) return null;
  if (end >= size) end = size - 1;
  return { start, end };
}

export function uploadMimeType(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  if (lower.endsWith(".mp4") || lower.endsWith(".m4v")) return "video/mp4";
  return "application/octet-stream";
}
