/** Shared Learning helpers (Moodle-inspired course/section/activity). */

export type ActivityNavItem = {
  id: string;
  title: string;
  moduleId: string;
  moduleTitle: string;
};

export function flattenPublishedActivities(
  modules: {
    id: string;
    title: string;
    lessons: { id: string; title: string; isPublished?: boolean }[];
  }[],
): ActivityNavItem[] {
  return modules.flatMap((mod) =>
    mod.lessons
      .filter((l) => l.isPublished !== false)
      .map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        moduleId: mod.id,
        moduleTitle: mod.title,
      })),
  );
}

export function findContinueActivityId(
  activities: ActivityNavItem[],
  completedIds: Set<string>,
): string | null {
  if (activities.length === 0) return null;
  const next = activities.find((a) => !completedIds.has(a.id));
  return next?.id ?? activities[0]?.id ?? null;
}

export function adjacentActivities(
  activities: ActivityNavItem[],
  currentId: string,
): { prev: ActivityNavItem | null; next: ActivityNavItem | null; index: number } {
  const index = activities.findIndex((a) => a.id === currentId);
  if (index < 0) return { prev: null, next: null, index: -1 };
  return {
    prev: index > 0 ? activities[index - 1]! : null,
    next: index < activities.length - 1 ? activities[index + 1]! : null,
    index,
  };
}

export function parsePublishedFlag(formData: FormData): boolean {
  const values = formData.getAll("isPublished").map(String);
  if (values.length === 0) return true;
  return values.includes("true") || values.includes("on");
}
