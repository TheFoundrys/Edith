export type SidebarActivity = {
  id: string;
  lessonTitle: string;
  programTitle: string;
  whenLabel: string | null;
};

export function LmsActivityCompact({ items }: { items: SidebarActivity[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="lms-activity-compact">
      {items.slice(0, 3).map((item) => (
        <li key={item.id} className="lms-activity-compact-item">
          <span className="lms-activity-dot" aria-hidden />
          <span className="lms-activity-text truncate" title={item.lessonTitle}>
            {item.lessonTitle}
          </span>
          {item.whenLabel ? (
            <span className="lms-activity-when">{item.whenLabel}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
