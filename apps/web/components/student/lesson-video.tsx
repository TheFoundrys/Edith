"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { markLessonComplete } from "@/lib/actions/syllabus";
import { notifyLessonCompleted } from "@/lib/learning/lesson-completion";
import {
  isEmbeddedPlayerEnded,
  withYouTubePlayerOrigin,
  type LessonVideo as LessonVideoSource,
} from "@/lib/learning/video-embed";

export function LessonVideo({
  video,
  lessonId,
  completed,
}: {
  video: Exclude<LessonVideoSource, { kind: "link" }>;
  lessonId: string;
  completed: boolean;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const finishedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [locallyCompleted, setLocallyCompleted] = useState(false);
  const [src, setSrc] = useState(video.kind === "file" ? video.src : "");

  useEffect(() => {
    if (video.kind === "file") setSrc(video.src);
  }, [video]);

  const completeLesson = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setLocallyCompleted(true);
    void markLessonComplete(lessonId).then((result) => {
      if ("ok" in result) {
        notifyLessonCompleted(lessonId);
        return;
      }
      finishedRef.current = false;
      setLocallyCompleted(false);
    });
  }, [lessonId]);

  useEffect(() => {
    if (!playing || video.kind === "file") return;

    function onMessage(event: MessageEvent) {
      if (finishedRef.current) return;
      if (!isEmbeddedPlayerEnded(event.origin, event.data)) return;
      completeLesson();
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playing, completeLesson, video.kind]);

  function beginPlayback() {
    if (video.kind === "youtube" || video.kind === "vimeo") {
      setSrc(
        video.kind === "youtube"
          ? withYouTubePlayerOrigin(video.src, window.location.origin)
          : video.src,
      );
    }
    setPlaying(true);
  }

  function onFrameLoad() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    if (video.kind === "youtube") {
      win.postMessage(JSON.stringify({ event: "listening", id: 1 }), "*");
      win.postMessage(
        JSON.stringify({
          event: "command",
          func: "addEventListener",
          args: ["onStateChange"],
        }),
        "*",
      );
      win.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*",
      );
    }
    if (video.kind === "vimeo") {
      win.postMessage(
        JSON.stringify({ method: "addEventListener", value: "finish" }),
        "*",
      );
      win.postMessage(JSON.stringify({ method: "play" }), "*");
    }
  }

  const isComplete = completed || locallyCompleted;
  const poster =
    video.kind === "youtube"
      ? { backgroundImage: `url(${video.poster})` }
      : undefined;

  return (
    <div>
      <div
        className="relative aspect-video overflow-hidden rounded-[var(--radius-sm)] border border-border bg-fg"
        onContextMenu={(event) => event.preventDefault()}
      >
        {!playing ? (
          <button
            type="button"
            className="absolute inset-0 z-20 flex items-center justify-center bg-fg bg-cover bg-center"
            style={poster}
            onClick={beginPlayback}
            aria-label="Play video"
          >
            <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-bg text-fg">
              <span
                className="ml-0.5 border-y-[9px] border-l-[14px] border-y-transparent border-l-fg"
                aria-hidden
              />
            </span>
          </button>
        ) : null}

        {playing && video.kind === "file" && src ? (
          <video
            src={src}
            className="absolute inset-0 h-full w-full"
            autoPlay
            playsInline
            controls={false}
            onEnded={completeLesson}
          />
        ) : null}

        {playing && video.kind !== "file" && src ? (
          <div className="absolute inset-0">
            <iframe
              ref={iframeRef}
              title="Activity video"
              src={src}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              referrerPolicy="strict-origin-when-cross-origin"
              onLoad={onFrameLoad}
            />
            {!isComplete ? (
              <>
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 z-10 h-[22%]"
                />
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 z-10 h-[20%]"
                />
                <div
                  aria-hidden
                  className="absolute right-0 top-0 z-20 h-[30%] w-[40%]"
                />
                <div
                  aria-hidden
                  className="absolute bottom-0 right-0 z-20 h-[26%] w-[38%]"
                />
              </>
            ) : null}
          </div>
        ) : null}

        {isComplete ? (
          <div
            aria-hidden
            className="absolute inset-0 z-30 bg-fg bg-cover bg-center"
            style={poster}
          />
        ) : null}
      </div>
      <p className="mt-2 text-xs text-fg-muted">
        {isComplete
          ? "This activity is complete."
          : "Watch to the end to mark this activity complete."}
      </p>
    </div>
  );
}
