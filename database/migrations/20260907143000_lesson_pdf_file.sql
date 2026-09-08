-- Lesson activities may attach a course PDF (notes, handbook, lab sheet).
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Requires PostgreSQL 12+: ALTER TYPE ... ADD VALUE may run outside a
-- transaction; the new value is not used until after this statement.

ALTER TYPE public."LessonContentType" ADD VALUE IF NOT EXISTS 'PDF_FILE';

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum en
    JOIN pg_type t ON t.oid = en.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'LessonContentType'
      AND en.enumlabel = 'PDF_FILE'
  ) THEN
    RAISE EXCEPTION 'LessonContentType enum is missing PDF_FILE';
  END IF;
END $$;

COMMIT;
