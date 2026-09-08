import assert from "node:assert/strict";
import test from "node:test";
import {
  isEmbeddedPlayerEnded,
  parseLessonVideo,
} from "../lib/learning/video-embed";

test("lesson YouTube embeds hide chrome and enable end detection", () => {
  const video = parseLessonVideo(
    "https://www.youtube.com/watch?v=inWWhr5tnEA",
  );
  assert.equal(video.kind, "youtube");
  if (video.kind !== "youtube") return;
  assert.equal(video.id, "inWWhr5tnEA");
  assert.match(video.src, /youtube-nocookie\.com\/embed\/inWWhr5tnEA/);
  assert.match(video.src, /controls=0/);
  assert.match(video.src, /rel=0/);
  assert.match(video.src, /enablejsapi=1/);
  assert.match(video.src, /disablekb=1/);
  assert.equal(video.src.includes("loop=1"), false);
});

test("YouTube and Vimeo player messages report ended", () => {
  assert.equal(
    isEmbeddedPlayerEnded(
      "https://www.youtube-nocookie.com",
      { info: { playerState: 0 } },
    ),
    true,
  );
  assert.equal(
    isEmbeddedPlayerEnded("https://www.youtube.com", { info: 0 }),
    true,
  );
  assert.equal(
    isEmbeddedPlayerEnded(
      "https://www.youtube-nocookie.com",
      { info: { playerState: 1 } },
    ),
    false,
  );
  assert.equal(
    isEmbeddedPlayerEnded("https://player.vimeo.com", { event: "finish" }),
    true,
  );
});
