const YOUTUBE_URL =
  /https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?(?:[^\s]*&)?v=[\w-]+(?:&[^\s]*)?|playlist\?list=[\w-]+(?:&[^\s]*)?|embed\/[\w-]+)|youtu\.be\/[\w-]+(?:\?[^\s]*)?)/gi;

/** Collect unique YouTube URLs from markdown or plain text. */
export function extractYouTubeUrls(text: string): string[] {
  const matches = text.match(YOUTUBE_URL) ?? [];
  return [...new Set(matches.map((url) => url.replace(/[.,;:!?)]+$/, "")))];
}

/** Remove YouTube URLs from reading text — embeds are rendered separately. */
export function stripYouTubeUrls(text: string): string {
  return text
    .replace(YOUTUBE_URL, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Split stored content for admin editing — reading in one field, video URL in another. */
export function splitLessonContentForEdit(content: string): {
  reading: string;
  videoUrl: string;
} {
  const urls = extractYouTubeUrls(content);
  return {
    reading: stripYouTubeUrls(content),
    videoUrl: urls[0] ?? "",
  };
}

/** Persist reading text plus an optional embedded video URL. */
export function mergeLessonReadingAndVideo(
  reading: string,
  videoUrl: string | null | undefined,
): string {
  const body = stripYouTubeUrls(reading.trim());
  const url = videoUrl?.trim() ?? "";
  if (!url) return body;
  if (body.includes(url)) return body;
  return body ? `${body}\n\n${url}` : url;
}

/** Primary video URL for VIDEO_URL lessons (handles markdown + URL in one field). */
export function resolveLessonVideoUrl(contentBody: string): string {
  const urls = extractYouTubeUrls(contentBody);
  if (urls[0]) return urls[0];
  const trimmed = contentBody.trim();
  const firstToken = trimmed.split(/\s+/)[0] ?? "";
  if (/^https?:\/\//i.test(firstToken)) return firstToken;
  return trimmed;
}

/**
 * Reading text for the student panel.
 * VIDEO_URL stores prose in `summary`, but prod/local mismatches often leave it in `content`.
 */
export function resolveLessonReadingText(
  contentType: string,
  contentBody: string,
  summary: string | null | undefined,
): string {
  const fromContent = stripYouTubeUrls(contentBody);
  const fromSummary = summary?.trim() ?? "";
  if (contentType === "VIDEO_URL") {
    return fromSummary || fromContent;
  }
  return fromContent || fromSummary;
}
