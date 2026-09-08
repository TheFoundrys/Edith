-- Staff roles remap to the institute control-centre model.
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Adds BURSAR to the Role enum and aligns system PermissionRole names,
-- descriptions, and default capabilities:
--   Super Administrator, Academic Dean / Head, Bursar & Finance,
--   Admissions Staff, Lead Faculty / Teachers.
--
-- Enum keys for existing memberships are unchanged (ADMISSIONS_MANAGER stays
-- Academic Dean, COUNSELOR stays Admissions Staff, CONTENT_UPLOADER stays
-- Lead Faculty). PostgreSQL cannot rename enum labels in place without a
-- rebuild, so labels live in application code.
--
-- Requires PostgreSQL 12+: ALTER TYPE ... ADD VALUE may run outside a
-- transaction; the new value is not used until after this statement.

ALTER TYPE public."Role" ADD VALUE IF NOT EXISTS 'BURSAR';

BEGIN;

UPDATE public."PermissionRole"
SET
  "name" = 'Super Administrator',
  "description" = 'Institution-wide control, including system keys, audit, and staff access.',
  "permissions" = ARRAY[
    'managePricing',
    'managePrograms',
    'manageContent',
    'manageApplications',
    'manageForms',
    'manageAiPlugins',
    'manageMembers'
  ],
  "updatedAt" = now()
WHERE "slug" = 'administrator' AND "isSystem" = true;

UPDATE public."PermissionRole"
SET
  "name" = 'Academic Dean / Head',
  "description" = 'Catalog, syllabi, admissions, exams, and faculty allocation. Fees stay with finance.',
  "permissions" = ARRAY[
    'managePrograms',
    'manageContent',
    'manageApplications',
    'manageForms',
    'manageMembers'
  ],
  "updatedAt" = now()
WHERE "slug" = 'admissions' AND "isSystem" = true;

UPDATE public."PermissionRole"
SET
  "name" = 'Admissions Staff',
  "description" = 'Student admissions, intakes, applications, and counselling follow-ups.',
  "permissions" = ARRAY['manageApplications', 'manageForms'],
  "updatedAt" = now()
WHERE "slug" = 'counsellor' AND "isSystem" = true;

UPDATE public."PermissionRole"
SET
  "name" = 'Lead Faculty / Teachers',
  "description" = 'Course catalog, syllabi, curriculum publishing, and examination materials.',
  "permissions" = ARRAY['managePrograms', 'manageContent'],
  "updatedAt" = now()
WHERE "slug" = 'content-author' AND "isSystem" = true;

INSERT INTO public."PermissionRole" (
  "id",
  "organizationId",
  "name",
  "slug",
  "description",
  "permissions",
  "isSystem",
  "createdAt",
  "updatedAt"
)
SELECT
  'prole_' || replace(gen_random_uuid()::text, '-', ''),
  o."id",
  'Bursar & Finance',
  'bursar',
  'Tuition invoicing, scholarships, concessions, refunds, and gateway reconciliation.',
  ARRAY['managePricing'],
  true,
  now(),
  now()
FROM public."Organization" o
ON CONFLICT ("organizationId", "slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "permissions" = EXCLUDED."permissions",
  "isSystem" = true,
  "updatedAt" = now();

DO $$
DECLARE
  bursar_roles integer;
  missing_enum boolean;
BEGIN
  SELECT NOT EXISTS (
    SELECT 1
    FROM pg_enum en
    JOIN pg_type t ON t.oid = en.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'Role'
      AND en.enumlabel = 'BURSAR'
  ) INTO missing_enum;

  IF missing_enum THEN
    RAISE EXCEPTION 'Role enum is missing BURSAR';
  END IF;

  SELECT count(*) INTO bursar_roles
  FROM public."PermissionRole"
  WHERE "slug" = 'bursar' AND "isSystem" = true;

  RAISE NOTICE 'verification passed: BURSAR enum present, bursar PermissionRole rows: %', bursar_roles;
END $$;

COMMIT;
