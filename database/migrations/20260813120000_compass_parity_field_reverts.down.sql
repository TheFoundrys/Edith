-- Rollback for 20260813120000_compass_parity_field_reverts.sql
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Restores the pre-Phase-2 edith_dev column names. Renames preserve data, so
-- this is safe to run, but note step 2: dropping "resetPasswordToken" discards
-- any values written since the migration was applied.
--
-- If you roll back, also revert the matching field names in
-- apps/web/prisma/schema.prisma and database/schema/schema.prisma, then re-run
-- `prisma generate`, or the client will no longer match the database.

BEGIN;

-- 1. Index names back first, while the old column names are still free --------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Certificate_certificateId_key',        'Certificate_certificateCode_key'),
      ('SyllabusModule_syllabusId_order_idx',  'SyllabusModule_syllabusId_sortOrder_idx'),
      ('SyllabusLesson_moduleId_order_idx',    'SyllabusLesson_moduleId_sortOrder_idx')
    ) AS t(old_name, new_name)
  LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = r.old_name
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = r.new_name
    ) THEN
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', r.old_name, r.new_name);
    END IF;
  END LOOP;
END $$;

-- 2. Drop the column edith_dev did not previously have ------------------------
ALTER TABLE public."User" DROP COLUMN IF EXISTS "resetPasswordToken";

-- 3. Column renames, reversed -------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Certificate',    'certificateId', 'certificateCode'),
      ('Certificate',    'issueDate',     'issuedAt'),
      ('Notification',   'message',       'body'),
      ('Notification',   'actionUrl',     'href'),
      ('Organization',   'title',         'name'),
      ('Organization',   'order',         'sortOrder'),
      ('Payment',        'paymentDate',   'paidAt'),
      ('Program',        'title',         'name'),
      ('Program',        'description',   'summary'),
      ('Program',        'price',         'tuitionAmount'),
      ('Program',        'type',          'courseType'),
      ('SyllabusLesson', 'content',       'contentBody'),
      ('SyllabusLesson', 'duration',      'durationLabel'),
      ('SyllabusLesson', 'type',          'lessonType'),
      ('SyllabusLesson', 'order',         'sortOrder'),
      ('SyllabusModule', 'order',         'sortOrder'),
      ('User',           'password',      'passwordHash')
    ) AS t(tbl, old_col, new_col)
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.old_col
    ) AND NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = r.tbl AND column_name = r.new_col
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I RENAME COLUMN %I TO %I', r.tbl, r.old_col, r.new_col
      );
    ELSE
      RAISE NOTICE 'skip %.% -> %', r.tbl, r.old_col, r.new_col;
    END IF;
  END LOOP;
END $$;

COMMIT;
