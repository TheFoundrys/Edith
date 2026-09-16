export const LESSON_COMPLETED_EVENT = "lesson:completed";

export function notifyLessonCompleted(lessonId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(LESSON_COMPLETED_EVENT, { detail: { lessonId } }),
  );
}
