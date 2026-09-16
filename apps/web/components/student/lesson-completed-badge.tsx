"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { LESSON_COMPLETED_EVENT } from "@/lib/learning/lesson-completion";

export function LessonCompletedBadge({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  useEffect(() => {
    function onCompleted(event: Event) {
      const detail = (event as CustomEvent<{ lessonId: string }>).detail;
      if (detail?.lessonId === lessonId) setCompleted(true);
    }

    window.addEventListener(LESSON_COMPLETED_EVENT, onCompleted);
    return () => window.removeEventListener(LESSON_COMPLETED_EVENT, onCompleted);
  }, [lessonId]);

  if (!completed) return null;
  return <Badge tone="success">Completed</Badge>;
}
