-- Rollback for 20260907014500_staff_roles_bursar.sql
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Restores the previous system PermissionRole names and default capabilities.
-- PostgreSQL cannot drop an enum value unless the type is rebuilt. This script
-- refuses to rebuild Role while any membership or invite still uses BURSAR.

BEGIN;

DO $$
DECLARE
  in_use bigint;
BEGIN
  SELECT
    (SELECT count(*) FROM public."Membership" WHERE "role"::text = 'BURSAR')
    + (SELECT count(*) FROM public."MembershipInvite" WHERE "role"::text = 'BURSAR')
  INTO in_use;

  IF in_use > 0 THEN
    RAISE EXCEPTION
      'cannot roll back: % membership or invite row(s) still use BURSAR. '
      'Reassign them first.', in_use;
  END IF;
END $$;

UPDATE public."PermissionRole"
SET
  "name" = 'Administrator',
  "description" = 'Full access to every admin area.',
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
  "name" = 'Admissions',
  "description" = 'Applications, forms, offers and fees.',
  "permissions" = ARRAY[
    'managePricing',
    'managePrograms',
    'manageApplications',
    'manageForms',
    'manageMembers'
  ],
  "updatedAt" = now()
WHERE "slug" = 'admissions' AND "isSystem" = true;

UPDATE public."PermissionRole"
SET
  "name" = 'Counsellor',
  "description" = 'Applicant counselling and follow-ups.',
  "permissions" = ARRAY['manageApplications'],
  "updatedAt" = now()
WHERE "slug" = 'counsellor' AND "isSystem" = true;

UPDATE public."PermissionRole"
SET
  "name" = 'Content author',
  "description" = 'Syllabus, assignments, quizzes and announcements.',
  "permissions" = ARRAY['manageContent'],
  "updatedAt" = now()
WHERE "slug" = 'content-author' AND "isSystem" = true;

DELETE FROM public."PermissionRole"
WHERE "slug" = 'bursar' AND "isSystem" = true;

ALTER TYPE public."Role" RENAME TO "Role_old";

CREATE TYPE public."Role" AS ENUM (
  'SUPER_ADMIN',
  'ADMISSIONS_MANAGER',
  'COUNSELOR',
  'CONTENT_UPLOADER',
  'STUDENT'
);

ALTER TABLE public."Membership"
  ALTER COLUMN "role" TYPE public."Role"
    USING "role"::text::public."Role";

ALTER TABLE public."MembershipInvite"
  ALTER COLUMN "role" TYPE public."Role"
    USING "role"::text::public."Role";

DROP TYPE public."Role_old";

COMMIT;
