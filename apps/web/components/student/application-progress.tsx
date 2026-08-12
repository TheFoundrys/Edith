export function ApplicationProgress({
  sections,
  currentIndex,
  completionPercent,
  savedAt,
}: {
  sections: { id: string; title: string; complete: boolean }[];
  currentIndex: number;
  completionPercent: number;
  savedAt?: string | null;
}) {
  return (
    <div className="space-y-3" aria-label="Application progress">
      <div className="flex items-center justify-between gap-3 text-xs text-fg-muted">
        <span>
          Progress <span className="text-fg font-medium">{completionPercent}%</span>
        </span>
        {savedAt ? <span>Saved · {savedAt}</span> : <span>Unsaved changes</span>}
      </div>
      <div
        className="h-1.5 w-full rounded-full bg-border overflow-hidden"
        role="progressbar"
        aria-valuenow={completionPercent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-fg transition-all"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <ol className="grid gap-1 text-xs">
        {sections.map((section, i) => (
          <li
            key={section.id}
            className={
              i === currentIndex ? "text-fg font-medium" : "text-fg-muted"
            }
          >
            {section.complete ? "✓" : "○"} {section.title}
          </li>
        ))}
      </ol>
    </div>
  );
}
