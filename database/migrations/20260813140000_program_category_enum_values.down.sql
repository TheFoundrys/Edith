-- Rollback: Program category enum values
--
-- PostgreSQL cannot drop a value from an enum, so the type has to be rebuilt.
-- That is only safe while no row still uses the three values, which is why this
-- script refuses to run rather than silently rewriting programme categories.
--
-- If you roll back, also remove UNDERGRADUATE_DEGREE, FACULTY_DEVELOPMENT and
-- CERTIFICATION from apps/web/prisma/schema.prisma, then re-run
-- `prisma generate`, or the client will no longer match the database.

BEGIN;

DO $$
DECLARE
  in_use bigint;
BEGIN
  SELECT count(*) INTO in_use
  FROM public."Program"
  WHERE "category"::text IN (
    'UNDERGRADUATE_DEGREE', 'FACULTY_DEVELOPMENT', 'CERTIFICATION'
  );

  IF in_use > 0 THEN
    RAISE EXCEPTION
      'cannot roll back: % Program row(s) still use these categories. '
      'Recategorise or delete them first.', in_use;
  END IF;
END $$;

ALTER TYPE public."ProgramCategory" RENAME TO "ProgramCategory_old";

CREATE TYPE public."ProgramCategory" AS ENUM (
  'YOUNG_POST_GRADUATE',
  'POST_GRADUATE',
  'FELLOW_EXECUTIVE',
  'ADVANCED_MANAGEMENT',
  'CENTRE_OF_EXCELLENCE'
);

ALTER TABLE public."Program"
  ALTER COLUMN "category" DROP DEFAULT,
  ALTER COLUMN "category" TYPE public."ProgramCategory"
    USING "category"::text::public."ProgramCategory",
  ALTER COLUMN "category" SET DEFAULT 'YOUNG_POST_GRADUATE';

DROP TYPE public."ProgramCategory_old";

COMMIT;
