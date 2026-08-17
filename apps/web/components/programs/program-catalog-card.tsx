import Link from "next/link";
import type { ReactNode } from "react";
import {
  PROGRAM_CATEGORIES,
  displayProgramName,
} from "@/lib/programs/categories";
import {
  catalogDurationLabel,
  catalogLevelBadge,
  catalogModeBadge,
} from "@/lib/programs/catalog-meta";
import { programTrack } from "@/lib/programs/track";
import type { DegreeLevel, ProgramCategory } from "@prisma/client";

export type ProgramCatalogItem = {
  id: string;
  title: string;
  slug: string;
  category: ProgramCategory;
  degreeLevel: DegreeLevel;
  description: string | null;
  eligibilitySummary: string | null;
  price: number | null;
  tuitionCurrency: string;
  duration?: string | null;
  isHybridOnly?: boolean | null;
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
  const track = programTrack(program.title);
  const badges = [
    category.shortLabel,
    catalogDurationLabel(program),
    catalogModeBadge(program),
    catalogLevelBadge(program),
  ].filter((value): value is string => Boolean(value));

  return (
    <article
      className="group catalog-card cm-box !p-0 !min-h-0 h-full overflow-hidden"
      data-track={track}
    >
      <div className="flex min-h-0 flex-1 flex-col p-5 sm:p-6">
        <Link href={href} className="flex min-h-0 flex-1 flex-col">
          <div className="flex flex-wrap gap-1.5">
            {badges.map((badge) => (
              <span key={badge} className="catalog-badge">
                {badge}
              </span>
            ))}
          </div>

          <h2 className="courses-heading mt-4 text-[1.35rem] leading-snug sm:text-[1.5rem]">
            {displayProgramName(program.title, program.category)}
          </h2>

          <p className="courses-desc mt-3 line-clamp-3 min-h-[4.27rem] text-sm leading-relaxed text-fg-muted">
            {program.description ? truncate(program.description, 120) : ""}
          </p>
        </Link>

        {action ? (
          <div className="mt-auto pt-5">{action}</div>
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
