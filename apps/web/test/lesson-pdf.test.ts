import assert from "node:assert/strict";
import test from "node:test";
import { lessonPdfFileName } from "../lib/learning/lesson-pdf";
import {
  isStoredLessonFile,
  parseBytesRange,
  uploadMimeType,
} from "../lib/learning/lesson-file";
import { activityTypeLabel } from "../lib/learning/standards";

test("PDF activities are labelled and named from the storage path", () => {
  assert.equal(activityTypeLabel("PDF_FILE"), "PDF");
  assert.equal(
    lessonPdfFileName("private/abc123/Threat_Landscape_Notes.pdf"),
    "Threat_Landscape_Notes.pdf",
  );
});

test("stored lesson files and video byte ranges", () => {
  assert.equal(isStoredLessonFile("private/abc123/lecture.mp4"), true);
  assert.equal(isStoredLessonFile("https://www.youtube.com/watch?v=abc"), false);
  assert.equal(uploadMimeType("lecture.mp4"), "video/mp4");
  assert.equal(uploadMimeType("notes.pdf"), "application/pdf");
  assert.deepEqual(parseBytesRange("bytes=0-99", 1000), { start: 0, end: 99 });
  assert.deepEqual(parseBytesRange("bytes=50-", 100), { start: 50, end: 99 });
  assert.equal(parseBytesRange("bytes=200-300", 100), null);
});

test("PDF activities are labelled and named from the storage path", () => {
  assert.equal(activityTypeLabel("PDF_FILE"), "PDF");
  assert.equal(
    lessonPdfFileName("private/abc123/Threat_Landscape_Notes.pdf"),
    "Threat_Landscape_Notes.pdf",
  );
});
