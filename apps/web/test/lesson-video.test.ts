import assert from "node:assert/strict";
import test from "node:test";
import {
  inferLessonContentType,
  isEmbeddedPlayerEnded,
  parseLessonVideo,
  withYouTubePlayerOrigin,
} from "../lib/learning/video-embed";
import { isAdmissionsProgram, isContentProgram } from "../lib/programs/categories";
import { AI_FLUENCY_LESSONS } from "../prisma/catalog-data";

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
  assert.match(video.src, /modestbranding=1/);
  assert.match(video.src, /fs=0/);
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

test("AI Fluency playlist embeds each video without the private list id", () => {
  const playlist = parseLessonVideo(
    "https://www.youtube.com/playlist?list=PLM0upyoEdKOM",
  );
  assert.equal(playlist.kind, "youtube");
  if (playlist.kind !== "youtube") return;
  assert.match(playlist.src, /embed\/dUclJ0Hs56Y/);
  assert.equal(playlist.src.includes("list=PLM0upyoEdKOM"), false);
  assert.equal(playlist.src.includes("videoseries"), false);

  const lesson = parseLessonVideo(
    "https://www.youtube.com/watch?v=FDAGTZTBdyI&list=PLM0upyoEdKOM",
  );
  assert.equal(lesson.kind, "youtube");
  if (lesson.kind !== "youtube") return;
  assert.match(lesson.src, /embed\/FDAGTZTBdyI/);
  assert.equal(lesson.src.includes("list=PLM0upyoEdKOM"), false);
});

test("The Foundrys channel URL embeds a public video plus uploads playlist", () => {
  const channel = parseLessonVideo(
    "https://www.youtube.com/channel/UCdxis9vAdyI_5uuZ6Kiycsw",
  );
  assert.equal(channel.kind, "youtube");
  if (channel.kind !== "youtube") return;
  assert.match(channel.src, /embed\/_quDsWLgaKo/);
  assert.match(channel.src, /list=UUdxis9vAdyI_5uuZ6Kiycsw/);
  assert.equal(channel.src.includes("videoseries"), false);
});

test("AI Fluency catalogue embeds Java-to-Python videos in reading content", () => {
  const videos = AI_FLUENCY_LESSONS.filter((lesson) =>
    /^\d+\.\d+/.test(lesson.title),
  );
  assert.equal(videos.length, 9);
  for (const lesson of videos) {
    assert.equal(lesson.contentType, "RICH_TEXT");
    assert.match(lesson.content, /youtube\.com\/watch\?v=/);
    assert.equal(lesson.content.includes("list=PLM0upyoEdKOM"), false);
  }
  assert.match(videos[0]!.content, /v=dUclJ0Hs56Y/);
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

test("YGP and PGP are content courses; degrees use admissions", () => {
  assert.equal(isContentProgram("YOUNG_POST_GRADUATE"), true);
  assert.equal(isContentProgram("POST_GRADUATE"), true);
  assert.equal(isContentProgram("UNDERGRADUATE_DEGREE"), false);
  assert.equal(isAdmissionsProgram("UNDERGRADUATE_DEGREE"), true);
  assert.equal(isAdmissionsProgram("YOUNG_POST_GRADUATE"), false);
});

test("pasted lesson content infers video, link, or text", () => {
  assert.equal(
    inferLessonContentType("https://www.youtube.com/watch?v=_quDsWLgaKo"),
    "VIDEO_URL",
  );
  assert.equal(
    inferLessonContentType("https://www.youtube.com/playlist?list=PLM0upyoEdKOM"),
    "VIDEO_URL",
  );
  assert.equal(
    inferLessonContentType(
      "https://www.youtube.com/channel/UCdxis9vAdyI_5uuZ6Kiycsw",
    ),
    "VIDEO_URL",
  );
  assert.equal(inferLessonContentType("https://docs.example.com/notes"), "EXTERNAL_LINK");
  assert.equal(
    inferLessonContentType("Write a short Python function that loads a CSV."),
    "RICH_TEXT",
  );
  assert.equal(
    inferLessonContentType("private/abc123/lecture.mp4"),
    "VIDEO_URL",
  );
});

test("uploaded lesson videos play from an enrolment-gated file URL", () => {
  const video = parseLessonVideo("private/abc123/lecture.mp4");
  assert.equal(video.kind, "file");
  if (video.kind !== "file") return;
  assert.equal(video.src, "/api/uploads/private/abc123/lecture.mp4");
});
