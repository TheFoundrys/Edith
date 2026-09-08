"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { WorkspaceNavGroup } from "@/components/layout/workspace-sidebar";
import { navIconFor } from "@/lib/nav/icons";

type SearchHit = {
  type: string;
  title: string;
  href: string;
  subtitle?: string;
};

export function WorkspaceSearch({
  navGroups,
  variant,
  extraPages = [],
}: {
  navGroups: WorkspaceNavGroup[];
  variant: "student" | "admin";
  extraPages?: { href: string; label: string }[];
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [remote, setRemote] = useState<SearchHit[]>([]);
  const pages = useMemo(() => {
    const items = navGroups.flatMap((group) => group.items);
    const seen = new Set(items.map((item) => item.href));
    for (const extra of extraPages) {
      if (!seen.has(extra.href)) items.push(extra);
    }
    return items;
  }, [navGroups, extraPages]);

  const pageHits = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 1) return [];
    return pages
      .filter((item) => item.label.toLowerCase().includes(term))
      .slice(0, 6)
      .map((item): SearchHit => ({
        type: "Page",
        title: item.label,
        href: item.href,
      }));
  }, [pages, query]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setRemote([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/workspace/search?q=${encodeURIComponent(term)}`,
        );
        if (!res.ok) {
          setRemote([]);
          return;
        }
        const data = (await res.json()) as { results?: SearchHit[] };
        setRemote(data.results ?? []);
      } catch {
        setRemote([]);
      }
    }, 180);
    return () => window.clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const seen = new Set<string>();
  const hits = [...pageHits, ...remote].filter((hit) => {
    const key = `${hit.type}:${hit.href}:${hit.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 10);

  const fallbackHref =
    variant === "admin"
      ? "/admin"
      : query.trim()
        ? `/courses?q=${encodeURIComponent(query.trim())}`
        : "/courses";

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    go(hits[0]?.href ?? fallbackHref);
  }

  return (
    <form
      ref={rootRef}
      className="workspace-search"
      role="search"
      onSubmit={handleSubmit}
    >
      <Search className="workspace-search-icon" strokeWidth={1.75} aria-hidden />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={
          variant === "admin"
            ? "Search programs, pages, people…"
            : "Search courses and pages…"
        }
        className="workspace-search-input"
        aria-label="Search workspace"
        autoComplete="off"
      />
      <kbd className="workspace-search-kbd">⌘K</kbd>
      {open && query.trim() ? (
        <div className="workspace-search-panel" role="listbox">
          {hits.length === 0 ? (
            <p className="workspace-search-empty">No matches. Press Enter to search.</p>
          ) : (
            hits.map((hit) => {
              const Icon = navIconFor(
                hit.href,
                hit.type === "Page" ? hit.title : hit.type,
              );
              return (
                <Link
                  key={`${hit.type}-${hit.href}-${hit.title}`}
                  href={hit.href}
                  className="workspace-search-hit"
                  onClick={() => setOpen(false)}
                >
                  <Icon className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                  <span className="min-w-0">
                    <span className="workspace-search-hit-title">{hit.title}</span>
                    <span className="workspace-search-hit-meta">
                      {hit.subtitle ?? hit.type}
                    </span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      ) : null}
    </form>
  );
}
