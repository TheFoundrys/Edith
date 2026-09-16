import { renderSimpleMarkdown } from "@/lib/learning/markdown";

/** Server-only reading block — never import client components here. */
export function LessonReadingPanel({ content }: { content: string }) {
  const text = content.trim();
  if (!text) return null;

  return (
    <section
      className="rounded-[var(--radius-sm)] border border-border bg-bg p-4 sm:p-5"
      style={{ color: "var(--fg)" }}
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
        About this lesson
      </p>
      <div className="text-sm leading-relaxed [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_p]:my-2 [&_ul]:my-3 [&_ol]:my-3">
        {renderSimpleMarkdown(text)}
      </div>
    </section>
  );
}
