import assert from "node:assert/strict";
import test from "node:test";
import {
  activityTypeLabel,
  lessonContentPreview,
  lessonContentTypeMeta,
} from "@/lib/learning/lesson-content-type";

test("lessonContentTypeMeta labels video and reading clearly", () => {
  assert.equal(lessonContentTypeMeta("VIDEO_URL").label, "Video lesson");
  assert.equal(lessonContentTypeMeta("RICH_TEXT").label, "Reading & notes");
  assert.equal(activityTypeLabel("VIDEO_URL"), "Video");
  assert.equal(activityTypeLabel("RICH_TEXT"), "Reading");
});

test("lessonContentPreview summarizes markdown vs video", () => {
  assert.match(
    lessonContentPreview(
      "RICH_TEXT",
      "# Intro\n\nThis track is for Java developers learning Python.",
    ),
    /Java developers/,
  );
  assert.match(
    lessonContentPreview(
      "VIDEO_URL",
      "https://www.youtube.com/watch?v=abc123",
    ),
    /youtube/,
  );
});
