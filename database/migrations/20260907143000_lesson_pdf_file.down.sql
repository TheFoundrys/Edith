-- Rollback for 20260907143000_lesson_pdf_file.sql
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- PostgreSQL cannot drop an enum value unless the type is rebuilt.
-- Refuses if any syllabus lesson still uses PDF_FILE.

BEGIN;

DO $$
DECLARE
  in_use bigint;
BEGIN
  SELECT count(*) INTO in_use
  FROM public."SyllabusLesson"
  WHERE "contentType"::text = 'PDF_FILE';

  IF in_use > 0 THEN
    RAISE EXCEPTION
      'cannot roll back: % syllabus lesson(s) still use PDF_FILE. '
      'Change their content type first.', in_use;
  END IF;
END $$;

ALTER TYPE public."LessonContentType" RENAME TO "LessonContentType_old";

CREATE TYPE public."LessonContentType" AS ENUM (
  'RICH_TEXT',
  'VIDEO_URL',
  'EXTERNAL_LINK'
);

ALTER TABLE public."SyllabusLesson"
  ALTER COLUMN "contentType" DROP DEFAULT;

ALTER TABLE public."SyllabusLesson"
  ALTER COLUMN "contentType" TYPE public."LessonContentType"
    USING "contentType"::text::public."LessonContentType";

ALTER TABLE public."SyllabusLesson"
  ALTER COLUMN "contentType" SET DEFAULT 'RICH_TEXT';

DROP TYPE public."LessonContentType_old";

COMMIT;
