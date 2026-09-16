"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/page";

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error.name === "ChunkLoadError" ||
    /Loading chunk .* failed/i.test(error.message);

  useEffect(() => {
    if (isChunkError) {
      const key = "edith-chunk-reload";
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
      }
    }
  }, [isChunkError]);

  return (
    <Panel className="mx-auto max-w-lg p-6 space-y-4 text-center">
      <h1 className="font-display text-xl text-brand">Could not load this lesson</h1>
      <p className="text-sm text-fg-muted leading-relaxed">
        {isChunkError
          ? "The dev server refreshed while this page was open. Reload once to fetch the latest code."
          : "Something went wrong while opening this activity."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button
          type="button"
          onClick={() => {
            sessionStorage.removeItem("edith-chunk-reload");
            window.location.reload();
          }}
        >
          Reload page
        </Button>
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Try again
        </Button>
        <Link href="/student/my-courses">
          <Button type="button" variant="ghost">
            My courses
          </Button>
        </Link>
      </div>
    </Panel>
  );
}
