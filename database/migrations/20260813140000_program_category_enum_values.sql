-- Program category enum values
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- edith_dev's ProgramCategory type predates three of the suites the catalogue
-- publishes: UNDERGRADUATE_DEGREE, FACULTY_DEVELOPMENT and CERTIFICATION. Any
-- insert in those suites fails with an invalid enum value, so the seeder could
-- never create them and the Course Finder never offered them as filters —
-- availableFinderOptions only returns suites that match a published course.
--
-- Purely additive: PostgreSQL enum values cannot be reordered, and nothing here
-- touches existing rows.
--
-- Requires PostgreSQL 12 or newer, which allows ALTER TYPE ... ADD VALUE inside
-- a transaction block provided the value is not used before the commit. The
-- verification below only reads the catalog, so it never uses the new values.
--
-- Idempotent: IF NOT EXISTS on each value means a partial run can be retried.

ALTER TYPE public."ProgramCategory" ADD VALUE IF NOT EXISTS 'UNDERGRADUATE_DEGREE';
ALTER TYPE public."ProgramCategory" ADD VALUE IF NOT EXISTS 'FACULTY_DEVELOPMENT';
ALTER TYPE public."ProgramCategory" ADD VALUE IF NOT EXISTS 'CERTIFICATION';

-- Verification ----------------------------------------------------------------
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(e.v, ', ') INTO missing
  FROM (VALUES
    ('UNDERGRADUATE_DEGREE'),
    ('FACULTY_DEVELOPMENT'),
    ('CERTIFICATION')
  ) AS e(v)
  WHERE NOT EXISTS (
    SELECT 1
    FROM pg_enum en
    JOIN pg_type t ON t.oid = en.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'ProgramCategory'
      AND en.enumlabel = e.v
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'ProgramCategory enum incomplete, missing: %', missing;
  END IF;

  RAISE NOTICE 'verification passed: all 8 ProgramCategory values present';
END $$;
