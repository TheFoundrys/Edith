import Link from "next/link";
import type { ReactNode } from "react";
import {
  PROGRAM_CATEGORIES,
  displayProgramName,
} from "@/lib/programs/categories";
import {
  catalogDurationLabel,
  catalogMode,
} from "@/lib/programs/catalog-meta";
import { formatCurrency } from "@/lib/utils";
import type { DegreeLevel, ProgramCategory } from "@prisma/client";

export type ProgramCatalogItem = {
  id: string;
  name: string;
  slug: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  summary: string | null;
  eligibilitySummary: string | null;
  tuitionAmount: number | null;
  tuitionCurrency: string;
  campus: { name: string } | null;
  intakes: { name: string; startDate: Date | null }[];
};

function categoryMeta(category: ProgramCategory) {
  return (
    PROGRAM_CATEGORIES.find((c) => c.value === category) ?? {
      shortLabel: category,
      label: category,
    }
  );
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

function eligibilityLabel(program: ProgramCatalogItem) {
  const raw = program.eligibilitySummary?.replace(/\s+/g, " ").trim();
  if (!raw) return "—";
  const years = raw.match(/(\d+\+?\s*years?[^.]*)/i);
  if (years) return years[1]!.trim();
  return truncate(raw, 42);
}

function formatIntakeDate(program: ProgramCatalogItem) {
  const start = program.intakes[0]?.startDate;
  if (!start) return "—";
  return start.toLocaleDateString("en-IN", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function feeLabel(program: ProgramCatalogItem) {
  if (program.tuitionAmount == null || program.tuitionAmount === 0) {
    return program.tuitionAmount === 0 ? "Free" : "Contact Admissions";
  }
  return formatCurrency(program.tuitionAmount, program.tuitionCurrency);
}

export function ProgramCatalogCard({
  program,
  href,
  action,
}: {
  program: ProgramCatalogItem;
  href: string;
  action?: ReactNode;
}) {
  const category = categoryMeta(program.category);
  const rows = [
    { label: "Format", value: catalogMode(program) },
    { label: "Starts", value: formatIntakeDate(program) },
    { label: "Duration", value: catalogDurationLabel(program) },
    { label: "Eligibility", value: eligibilityLabel(program) },
    { label: "Fee", value: feeLabel(program) },
  ];

  return (
    <article className="group cm-box !p-0 !min-h-0 h-full overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col p-[var(--grid-pad)]">
        <Link href={href} className="flex min-h-0 flex-1 flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-muted">
            {category.shortLabel}
          </p>

          <h2 className="courses-heading mt-[var(--grid-gap)] font-display text-[1.45rem] leading-snug sm:text-[1.55rem]">
            {displayProgramName(program.name, program.category)}
          </h2>

          {program.summary ? (
            <p className="courses-desc mt-[var(--grid-gap)] text-sm leading-relaxed">
              {truncate(program.summary, 120)}
            </p>
          ) : null}

          <dl className="courses-detail mt-auto space-y-0 border-t border-border pt-[var(--grid-gap)]">
            {rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[6.5rem_1fr] gap-x-3 py-1.5 text-[13px] leading-snug"
              >
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </div>
            ))}
          </dl>
        </Link>

        {action ? (
          <div className="mt-[var(--grid-gap)] flex justify-center">{action}</div>
        ) : null}
      </div>
    </article>
  );
}

export function ProgramCatalogGrid({ children }: { children: ReactNode }) {
  return <div className="cm-grid">{children}</div>;
}

export function ProgramCatalogGridItem({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="min-w-0 h-full">{children}</div>;
}
