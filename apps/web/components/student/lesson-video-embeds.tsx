"use client";

import { LessonVideo } from "@/components/student/lesson-video";
import { parseLessonVideo } from "@/lib/learning/video-embed";

export function LessonVideoEmbeds({
  urls,
  lessonId,
  completed,
}: {
  urls: string[];
  lessonId: string;
  completed: boolean;
}) {
  if (urls.length === 0) return null;

  return (
    <div className="space-y-6">
      {urls.map((url) => {
        const video = parseLessonVideo(url);
        if (video.kind === "link") return null;
        return (
          <LessonVideo
            key={url}
            video={video}
            lessonId={lessonId}
            completed={completed}
          />
        );
      })}
    </div>
  );
}
