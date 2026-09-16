/** Module is shown when it has activities or descriptive text (summary). */
export function moduleHasVisibleContent(module: {
  lessons: unknown[];
  summary?: string | null;
}) {
  return module.lessons.length > 0 || Boolean(module.summary?.trim());
}

export function filterVisibleModules<
  T extends { lessons: unknown[]; summary?: string | null },
>(modules: T[]): T[] {
  return modules.filter(moduleHasVisibleContent);
}
