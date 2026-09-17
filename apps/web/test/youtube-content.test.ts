import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractYouTubeUrls,
  mergeLessonReadingAndVideo,
  resolveLessonReadingText,
  resolveLessonVideoUrl,
  splitLessonContentForEdit,
  stripYouTubeUrls,
} from "../lib/learning/youtube-content";

test("split and merge lesson reading with embedded video", () => {
  const stored = mergeLessonReadingAndVideo(
    "# Lesson\n\nSome notes.",
    "https://www.youtube.com/watch?v=dUclJ0Hs56Y",
  );
  assert.match(stored, /Some notes/);
  assert.match(stored, /watch\?v=dUclJ0Hs56Y/);

  const split = splitLessonContentForEdit(stored);
  assert.equal(split.reading.includes("dUclJ0Hs56Y"), false);
  assert.equal(split.videoUrl, "https://www.youtube.com/watch?v=dUclJ0Hs56Y");

  const reMerged = mergeLessonReadingAndVideo(split.reading, split.videoUrl);
  assert.equal(extractYouTubeUrls(reMerged).length, 1);
});

test("stripYouTubeUrls keeps non-video paragraphs", () => {
  const text = stripYouTubeUrls(
    "Intro paragraph.\n\nhttps://www.youtube.com/watch?v=abc123\n\nOutro.",
  );
  assert.match(text, /Intro paragraph/);
  assert.match(text, /Outro/);
  assert.equal(text.includes("youtube"), false);
});

test("resolveLessonReadingText prefers summary for VIDEO_URL", () => {
  const content =
    "# Notes\n\nBody copy.\n\nhttps://www.youtube.com/watch?v=abc123";
  assert.equal(
    resolveLessonReadingText("VIDEO_URL", content, "From summary"),
    "From summary",
  );
  assert.match(
    resolveLessonReadingText("VIDEO_URL", content, null),
    /Body copy/,
  );
});

test("resolveLessonVideoUrl extracts youtube from mixed content", () => {
  const content =
    "# Notes\n\nhttps://www.youtube.com/watch?v=abc123";
  assert.equal(
    resolveLessonVideoUrl(content),
    "https://www.youtube.com/watch?v=abc123",
  );
});
