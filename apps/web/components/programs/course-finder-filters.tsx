"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  EMPTY_FINDER_FILTERS,
  availableFinderOptions,
  buildFinderQuery,
  finderFiltersActive,
  type FinderFilterIndexItem,
  type FinderFilterKey,
  type FinderFilterOption,
  type FinderFilters,
} from "@/lib/programs/finder-filters";

export function CourseFinderFilters({
  initialFilters,
  filterIndex,
}: {
  initialFilters: FinderFilters;
  filterIndex: FinderFilterIndexItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<FinderFilters>(initialFilters);
  const [openKey, setOpenKey] = useState<FinderFilterKey | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const groups = useMemo(
    () => availableFinderOptions(filterIndex),
    [filterIndex],
  );

  // Navigation re-renders this component with the filters the server actually
  // applied, which discards any draft the user left uncommitted. Adjusting
  // during render rather than in an effect avoids a second render pass.
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  if (initialFilters !== appliedFilters) {
    setAppliedFilters(initialFilters);
    setDraft(initialFilters);
  }

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenKey(null);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenKey(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const liveCount = useMemo(
    () => countMatches(filterIndex, draft),
    [draft, filterIndex],
  );

  function toggleValue(key: FinderFilterKey, value: string) {
    setDraft((prev) => {
      const set = new Set(prev[key]);
      if (set.has(value)) set.delete(value);
      else set.add(value);
      return { ...prev, [key]: Array.from(set) };
    });
  }

  function clearGroup(key: FinderFilterKey) {
    setDraft((prev) => ({ ...prev, [key]: [] }));
  }

  function apply(next: FinderFilters = draft) {
    setOpenKey(null);
    startTransition(() => {
      router.push(buildFinderQuery(next));
    });
  }

  function clearAll() {
    const empty = { ...EMPTY_FINDER_FILTERS };
    setDraft(empty);
    apply(empty);
  }

  const active =
    finderFiltersActive(draft) || finderFiltersActive(initialFilters);

  return (
    <div ref={rootRef} className="courses-finder-filters peak-rise-delay">
      <div className="courses-finder-grid">
        {groups.map((group) => (
          <FilterDropdown
            key={group.key}
            label={group.label}
            options={group.options}
            selected={draft[group.key]}
            open={openKey === group.key}
            onToggleOpen={() =>
              setOpenKey((current) =>
                current === group.key ? null : group.key,
              )
            }
            onToggleValue={(value) => toggleValue(group.key, value)}
            onClear={() => clearGroup(group.key)}
            onApply={() => apply()}
            resultCount={liveCount}
          />
        ))}

        <div className="courses-finder-actions">
          <button
            type="button"
            className="courses-finder-apply"
            onClick={() => apply()}
            disabled={pending}
          >
            Show results ({liveCount})
          </button>
          {active ? (
            <button
              type="button"
              className="courses-finder-clear"
              onClick={clearAll}
              disabled={pending}
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function countMatches(
  index: FinderFilterIndexItem[],
  filters: FinderFilters,
) {
  return index.filter((item) => {
    if (filters.suite.length && !filters.suite.includes(item.category)) {
      return false;
    }
    if (
      filters.duration.length &&
      !filters.duration.includes(item.duration)
    ) {
      return false;
    }
    if (
      filters.experience.length &&
      !filters.experience.includes(item.experience)
    ) {
      return false;
    }
    return true;
  }).length;
}

function FilterDropdown({
  label,
  options,
  selected,
  open,
  onToggleOpen,
  onToggleValue,
  onClear,
  onApply,
  resultCount,
}: {
  label: string;
  options: FinderFilterOption[];
  selected: string[];
  open: boolean;
  onToggleOpen: () => void;
  onToggleValue: (value: string) => void;
  onClear: () => void;
  onApply: () => void;
  resultCount: number;
}) {
  const listId = useId();
  const selectedCount = selected.length;
  const triggerLabel =
    selectedCount === 0
      ? label
      : selectedCount === 1
        ? (options.find((o) => o.value === selected[0])?.label ?? label)
        : `${label} (${selectedCount})`;

  return (
    <div
      className="courses-filter-dropdown"
      data-open={open ? "true" : undefined}
    >
      <button
        type="button"
        className="courses-filter-trigger"
        aria-expanded={open}
        aria-controls={listId}
        data-active={selectedCount > 0 ? "true" : undefined}
        onClick={onToggleOpen}
      >
        <span>{triggerLabel}</span>
        <svg
          className="courses-filter-chevron"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden
        >
          <path
            d="M2.5 4.5 6 8l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          id={listId}
          className="courses-filter-menu"
          role="listbox"
          aria-label={label}
        >
          <div className="courses-filter-menu-head">
            <p className="courses-filter-menu-title">{label}</p>
            <button
              type="button"
              className="courses-finder-clear"
              onClick={onClear}
              disabled={selectedCount === 0}
            >
              Clear
            </button>
          </div>
          <div className="courses-filter-options">
            {options.map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label key={option.value} className="courses-filter-option">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
          <button
            type="button"
            className="courses-finder-apply"
            onClick={onApply}
          >
            Apply · {resultCount}
          </button>
        </div>
      ) : null}
    </div>
  );
}
