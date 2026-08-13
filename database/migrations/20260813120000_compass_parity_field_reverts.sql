-- Compass parity field reverts (Phase 2)
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Renames 17 edith_dev columns back to their compass_dev names and adds the one
-- column compass_dev has that edith_dev was missing. See
-- docs/migration/compass-edith-parity.md for the full parity map.
--
-- Every statement uses ALTER TABLE ... RENAME COLUMN, which preserves data.
-- Do NOT apply these renames with `prisma db push`: Prisma implements a rename
-- as DROP + ADD, which would silently destroy every value in these columns.
--
-- The migration is idempotent. Each rename is skipped when the old column is
-- already gone or the new column already exists, so a partial run can be
-- retried safely.

BEGIN;

-- 1. Column renames -----------------------------------------------------------
DO $$
DECLARE
  r record;
  renamed int := 0;
  skipped int := 0;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Certificate',    'certificateCode', 'certificateId'),
      ('Certificate',    'issuedAt',        'issueDate'),
      ('Notification',   'body',            'message'),
      ('Notification',   'href',            'actionUrl'),
      ('Organization',   'name',            'title'),
      ('Organization',   'sortOrder',       'order'),
      ('Payment',        'paidAt',          'paymentDate'),
      ('Program',        'name',            'title'),
      ('Program',        'summary',         'description'),
      ('Program',        'tuitionAmount',   'price'),
      ('Program',        'courseType',      'type'),
      ('SyllabusLesson', 'contentBody',     'content'),
      ('SyllabusLesson', 'durationLabel',   'duration'),
      ('SyllabusLesson', 'lessonType',      'type'),
      ('SyllabusLesson', 'sortOrder',       'order'),
      ('SyllabusModule', 'sortOrder',       'order'),
      ('User',           'passwordHash',    'password')
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
      renamed := renamed + 1;
    ELSE
      RAISE NOTICE 'skip %.% -> % (old column absent or new column present)',
        r.tbl, r.old_col, r.new_col;
      skipped := skipped + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'columns renamed: %, skipped: %', renamed, skipped;
END $$;

-- 2. Column compass_dev has that edith_dev lacked -----------------------------
ALTER TABLE public."User" ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT;

-- 3. Index renames ------------------------------------------------------------
-- Renaming a column leaves its indexes intact but still named after the old
-- column. Realigning the names keeps the database matching what Prisma expects
-- for @unique / @@index, so future migrations don't try to drop and recreate.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('Certificate_certificateCode_key',        'Certificate_certificateId_key'),
      ('SyllabusModule_syllabusId_sortOrder_idx', 'SyllabusModule_syllabusId_order_idx'),
      ('SyllabusLesson_moduleId_sortOrder_idx',   'SyllabusLesson_moduleId_order_idx')
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
    ELSE
      RAISE NOTICE 'skip index % -> %', r.old_name, r.new_name;
    END IF;
  END LOOP;
END $$;

-- 4. Verification -------------------------------------------------------------
-- Fails the transaction if any expected column is missing, so a bad run rolls
-- back instead of leaving the schema half-migrated.
DO $$
DECLARE
  missing text;
BEGIN
  SELECT string_agg(format('%s.%s', e.tbl, e.col), ', ')
    INTO missing
  FROM (VALUES
    ('Certificate', 'certificateId'), ('Certificate', 'issueDate'),
    ('Notification', 'message'),      ('Notification', 'actionUrl'),
    ('Organization', 'title'),        ('Organization', 'order'),
    ('Payment', 'paymentDate'),
    ('Program', 'title'),             ('Program', 'description'),
    ('Program', 'price'),             ('Program', 'type'),
    ('SyllabusLesson', 'content'),    ('SyllabusLesson', 'duration'),
    ('SyllabusLesson', 'type'),       ('SyllabusLesson', 'order'),
    ('SyllabusModule', 'order'),
    ('User', 'password'),             ('User', 'resetPasswordToken')
  ) AS e(tbl, col)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = e.tbl AND column_name = e.col
  );

  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'compass parity migration incomplete, missing: %', missing;
  END IF;

  RAISE NOTICE 'verification passed: all 18 compass parity columns present';
END $$;

COMMIT;
