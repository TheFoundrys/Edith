import assert from "node:assert/strict";
import test from "node:test";
import {
  isEmbeddedPlayerEnded,
  parseLessonVideo,
  withYouTubePlayerOrigin,
} from "../lib/learning/video-embed";

test("lesson YouTube embeds hide chrome and enable end detection", () => {
  const video = parseLessonVideo(
    "https://www.youtube.com/watch?v=inWWhr5tnEA",
  );
  assert.equal(video.kind, "youtube");
  if (video.kind !== "youtube") return;
  assert.equal(video.id, "inWWhr5tnEA");
  assert.match(video.src, /www\.youtube\.com\/embed\/inWWhr5tnEA/);
  assert.match(video.src, /controls=0/);
  assert.match(video.src, /rel=0/);
  assert.match(video.src, /enablejsapi=1/);
  assert.match(video.src, /disablekb=1/);
  assert.equal(video.src.includes("loop=1"), false);
  const withOrigin = withYouTubePlayerOrigin(
    video.src,
    "https://app.thefoundrys.com",
  );
  assert.match(withOrigin, /origin=https%3A%2F%2Fapp\.thefoundrys\.com/);
  assert.match(
    withOrigin,
    /widget_referrer=https%3A%2F%2Fapp\.thefoundrys\.com/,
  );
});

test("YouTube shorts and share URLs parse to an embed", () => {
  const shorts = parseLessonVideo("https://youtube.com/shorts/inWWhr5tnEA");
  assert.equal(shorts.kind, "youtube");
  if (shorts.kind === "youtube") {
    assert.equal(shorts.id, "inWWhr5tnEA");
  }
  const share = parseLessonVideo(
    "https://youtu.be/inWWhr5tnEA?si=abc",
  );
  assert.equal(share.kind, "youtube");
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
