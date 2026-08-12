import type { ReactNode } from "react";

/**
 * Lightweight markdown → React for activity bodies.
 * Supports headings, bold/italic, links, lists, code, paragraphs.
 * No external markdown dependency.
 */
export function renderSimpleMarkdown(source: string): ReactNode[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^###\s+/.test(line)) {
      nodes.push(
        <h3 key={key++} className="mt-4 mb-2 text-base font-semibold">
          {inline(line.replace(/^###\s+/, ""))}
        </h3>,
      );
      i += 1;
      continue;
    }
    if (/^##\s+/.test(line)) {
      nodes.push(
        <h2 key={key++} className="mt-5 mb-2 text-lg font-semibold">
          {inline(line.replace(/^##\s+/, ""))}
        </h2>,
      );
      i += 1;
      continue;
    }
    if (/^#\s+/.test(line)) {
      nodes.push(
        <h1 key={key++} className="mt-5 mb-2 text-xl font-semibold">
          {inline(line.replace(/^#\s+/, ""))}
        </h1>,
      );
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i]!)) {
        items.push(
          <li key={key++}>{inline(lines[i]!.replace(/^[-*]\s+/, ""))}</li>,
        );
        i += 1;
      }
      nodes.push(
        <ul key={key++} className="my-3 list-disc space-y-1 pl-5">
          {items}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i]!)) {
        items.push(
          <li key={key++}>{inline(lines[i]!.replace(/^\d+\.\s+/, ""))}</li>,
        );
        i += 1;
      }
      nodes.push(
        <ol key={key++} className="my-3 list-decimal space-y-1 pl-5">
          {items}
        </ol>,
      );
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i]!.startsWith("```")) {
        code.push(lines[i]!);
        i += 1;
      }
      if (i < lines.length) i += 1;
      nodes.push(
        <pre
          key={key++}
          className="my-3 overflow-x-auto rounded-[var(--radius-sm)] border border-border bg-bg p-3 text-xs"
        >
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const para: string[] = [line];
    i += 1;
    while (
      i < lines.length &&
      lines[i]!.trim() &&
      !/^#{1,3}\s+/.test(lines[i]!) &&
      !/^[-*]\s+/.test(lines[i]!) &&
      !/^\d+\.\s+/.test(lines[i]!) &&
      !lines[i]!.startsWith("```")
    ) {
      para.push(lines[i]!);
      i += 1;
    }
    nodes.push(
      <p key={key++} className="my-2 leading-relaxed">
        {inline(para.join(" "))}
      </p>,
    );
  }

  return nodes;
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0]!;
    if (token.startsWith("**")) {
      parts.push(<strong key={k++}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*")) {
      parts.push(<em key={k++}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`")) {
      parts.push(
        <code
          key={k++}
          className="rounded bg-bg px-1 py-0.5 text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (link) {
        parts.push(
          <a
            key={k++}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            {link[1]}
          </a>,
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
