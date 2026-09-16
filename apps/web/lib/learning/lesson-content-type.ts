import { isStoredLessonFile } from "@/lib/learning/lesson-file";

export type LessonContentTypeValue =
  | "RICH_TEXT"
  | "VIDEO_URL"
  | "PDF_FILE"
  | "EXTERNAL_LINK";

export type LessonContentTypeMeta = {
  value: LessonContentTypeValue;
  label: string;
  shortLabel: string;
  icon: string;
  studentAction: string;
  adminHint: string;
  badgeTone: "neutral" | "info" | "success" | "warning";
};

const META: Record<LessonContentTypeValue, LessonContentTypeMeta> = {
  RICH_TEXT: {
    value: "RICH_TEXT",
    label: "Reading & notes",
    shortLabel: "Reading",
    icon: "📖",
    studentAction: "Read",
    adminHint: "Markdown text — headings, lists, links, and course instructions.",
    badgeTone: "neutral",
  },
  VIDEO_URL: {
    value: "VIDEO_URL",
    label: "Video lesson",
    shortLabel: "Video",
    icon: "▶",
    studentAction: "Watch",
    adminHint: "YouTube/Vimeo URL or a private uploaded video file.",
    badgeTone: "info",
  },
  PDF_FILE: {
    value: "PDF_FILE",
    label: "PDF document",
    shortLabel: "PDF",
    icon: "📄",
    studentAction: "Read PDF",
    adminHint: "Upload a PDF for enrolled students to read in the browser.",
    badgeTone: "warning",
  },
  EXTERNAL_LINK: {
    value: "EXTERNAL_LINK",
    label: "External link",
    shortLabel: "Link",
    icon: "🔗",
    studentAction: "Open",
    adminHint: "Opens an external resource in a new tab.",
    badgeTone: "neutral",
  },
};

export function normalizeLessonContentType(
  contentType: string | null | undefined,
): LessonContentTypeValue {
  if (
    contentType === "VIDEO_URL" ||
    contentType === "PDF_FILE" ||
    contentType === "EXTERNAL_LINK"
  ) {
    return contentType;
  }
  return "RICH_TEXT";
}

export function lessonContentTypeMeta(
  contentType: string | null | undefined,
): LessonContentTypeMeta {
  return META[normalizeLessonContentType(contentType)];
}

/** @deprecated Prefer lessonContentTypeMeta().shortLabel */
export function activityTypeLabel(contentType: string): string {
  return lessonContentTypeMeta(contentType).shortLabel;
}

export function lessonContentPreview(
  contentType: string | null | undefined,
  content: string | null | undefined,
): string {
  const type = normalizeLessonContentType(contentType);
  const body = content?.trim() ?? "";
  if (!body) return "No content yet";

  if (type === "VIDEO_URL") {
    if (isStoredLessonFile(body)) {
      return `Private video · ${body.split("/").pop() ?? "uploaded file"}`;
    }
    return body.length > 96 ? `${body.slice(0, 96)}…` : body;
  }

  if (type === "PDF_FILE") {
    return `PDF · ${body.split("/").pop() ?? "document"}`;
  }

  if (type === "EXTERNAL_LINK") {
    return body.length > 96 ? `${body.slice(0, 96)}…` : body;
  }

  const line =
    body
      .split("\n")
      .map((row) => row.trim())
      .find((row) => row && !row.startsWith("#")) ?? body.split("\n")[0]?.trim();
  const plain = (line ?? "")
    .replace(/^#+\s*/, "")
    .replace(/[*_`[\]()]/g, "")
    .trim();
  if (!plain) return "Markdown reading activity";
  return plain.length > 120 ? `${plain.slice(0, 120)}…` : plain;
}
