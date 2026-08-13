-- Default assignable permission roles
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Data-only companion to 20260813130000_members_control_station.sql. The members
-- console assigns PermissionRole rows, and existing organizations have none, so
-- the role picker would be permanently empty. The seeder now creates these for
-- fresh installs; this backfills organizations that already hold data.
--
-- Idempotent via the (organizationId, slug) unique index, and non-destructive:
-- it never edits or removes a role an administrator has already customised.

BEGIN;

INSERT INTO public."PermissionRole" ("id", "organizationId", "name", "slug", "description", "isSystem", "createdAt", "updatedAt")
SELECT
  'prole_' || replace(gen_random_uuid()::text, '-', ''),
  o."id",
  d."name",
  d."slug",
  d."description",
  true,
  now(),
  now()
FROM public."Organization" o
CROSS JOIN (VALUES
  ('Administrator',  'administrator',  'Full access to every admin area.'),
  ('Admissions',     'admissions',     'Applications, forms, offers and fees.'),
  ('Counsellor',     'counsellor',     'Applicant counselling and follow-ups.'),
  ('Content author', 'content-author', 'Syllabus, assignments, quizzes and announcements.'),
  ('Member',         'member',         'Standard learner access.')
) AS d("name", "slug", "description")
ON CONFLICT ("organizationId", "slug") DO NOTHING;

-- Give each existing membership the role matching its enum role, so the console
-- opens with meaningful data instead of every row reading "No roles".
INSERT INTO public."MembershipRole" ("id", "membershipId", "permissionRoleId", "assignedAt")
SELECT
  'mrole_' || replace(gen_random_uuid()::text, '-', ''),
  m."id",
  pr."id",
  now()
FROM public."Membership" m
JOIN (VALUES
  ('SUPER_ADMIN',        'administrator'),
  ('ADMISSIONS_MANAGER', 'admissions'),
  ('COUNSELOR',          'counsellor'),
  ('CONTENT_UPLOADER',   'content-author'),
  ('STUDENT',            'member')
) AS map("enum_role", "slug") ON map."enum_role" = m."role"::text
JOIN public."PermissionRole" pr
  ON pr."organizationId" = m."organizationId" AND pr."slug" = map."slug"
ON CONFLICT ("membershipId", "permissionRoleId") DO NOTHING;

DO $$
DECLARE
  role_count integer;
BEGIN
  SELECT count(*) INTO role_count FROM public."PermissionRole";
  RAISE NOTICE 'PermissionRole rows now present: %', role_count;
END $$;

COMMIT;
