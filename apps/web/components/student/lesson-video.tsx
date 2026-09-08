"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { markLessonComplete } from "@/lib/actions/syllabus";
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
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const finishedRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [src, setSrc] = useState(
    video.kind === "youtube" ? "" : video.src,
  );

  useEffect(() => {
    if (video.kind !== "youtube") {
      setSrc(video.src);
      return;
    }
    setSrc(withYouTubePlayerOrigin(video.src, window.location.origin));
  }, [video]);

  useEffect(() => {
    if (!playing) return;

    function onMessage(event: MessageEvent) {
      if (finishedRef.current) return;
      if (!isEmbeddedPlayerEnded(event.origin, event.data)) return;
      finishedRef.current = true;
      setFinished(true);
      void markLessonComplete(lessonId).then((result) => {
        if ("ok" in result) router.refresh();
      });
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [playing, lessonId, router]);

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

  const showFrame = playing && !finished && Boolean(src);
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
        {showFrame ? (
          <iframe
            ref={iframeRef}
            title="Activity video"
            src={src}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={onFrameLoad}
          />
        ) : finished ? (
          <div
            className="absolute inset-0 bg-fg bg-cover bg-center"
            style={poster}
          />
        ) : (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center bg-fg bg-cover bg-center"
            style={poster}
            onClick={() => setPlaying(true)}
            aria-label="Play video"
          >
            <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-bg text-fg">
              <span
                className="ml-0.5 border-y-[9px] border-l-[14px] border-y-transparent border-l-fg"
                aria-hidden
              />
            </span>
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-fg-muted">
        {completed || finished
          ? "This activity is complete."
          : "Watch to the end to mark this activity complete."}
      </p>
    </div>
  );
}
