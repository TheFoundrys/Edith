type OutlineModule = {
  title: string;
  summary: string | null;
  lessons: Array<{ title: string; summary?: string | null }>;
};

export function moduleOutline(mod: OutlineModule) {
  const lessons = mod.lessons
    .map((lesson) =>
      lesson.summary
        ? `  - ${lesson.title}: ${lesson.summary}`
        : `  - ${lesson.title}`,
    )
    .join("\n");
  const header = mod.summary ? `${mod.title} — ${mod.summary}` : mod.title;
  return `${header}\n${lessons}`;
}

export function programOutline(modules: OutlineModule[]) {
  if (modules.length === 0) return null;
  return modules.map(moduleOutline).join("\n\n");
}

export function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}
