import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { CourseFinderFilters } from "@/components/programs/course-finder-filters";
import {
  ProgramCatalogCard,
  ProgramCatalogGrid,
  ProgramCatalogGridItem,
} from "@/components/programs/program-catalog-card";
import {
  buildCatalogFilterIndex,
  filterPublishedCatalogPrograms,
  loadPublishedCatalogPrograms,
} from "@/lib/catalog/service";

export default async function PublicCoursesPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    suite?: string;
    duration?: string;
    experience?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;

  const published = await loadPublishedCatalogPrograms();
  const filterIndex = buildCatalogFilterIndex(published);
  const { filtered: courses, filters } = filterPublishedCatalogPrograms(
    published,
    params,
  );

  return (
    <MarketingShell maxWidth="max-w-7xl" showArt={false}>
      <div className="courses-theme">
        <div>
          <h1 className="courses-heading font-display text-3xl sm:text-4xl">
            Courses
          </h1>
          <p className="mt-2 max-w-xl text-sm text-fg-muted leading-relaxed">
            Filter by programme, duration, or experience.
          </p>
        </div>

        <CourseFinderFilters
          initialFilters={filters}
          filterIndex={filterIndex}
        />

        <div className="mt-[var(--grid-pad)]">
          {courses.length === 0 ? (
            <EmptyState
              title="No courses found"
              description="Try another filter combination or clear your selectors."
            />
          ) : (
            <ProgramCatalogGrid>
              {courses.map((course) => (
                <ProgramCatalogGridItem key={course.id}>
                  <ProgramCatalogCard
                    program={course}
                    href={`/courses/${course.slug}`}
                    action={
                      <Link
                        href={`/courses/${course.slug}`}
                        className="courses-cta"
                      >
                        View course →
                      </Link>
                    }
                  />
                </ProgramCatalogGridItem>
              ))}
            </ProgramCatalogGrid>
          )}
        </div>

        <p className="mt-[var(--grid-pad)] text-sm text-fg-muted">
          Showing <span className="font-semibold text-fg">{courses.length}</span>{" "}
          of {published.length} results
        </p>
      </div>
    </MarketingShell>
  );
}
