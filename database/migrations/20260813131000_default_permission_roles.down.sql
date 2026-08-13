-- Rollback for 20260813131000_default_permission_roles.sql
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Removes only the five seeded system roles, and only where they are still
-- marked isSystem, so a role an administrator has taken over is left alone.
-- Their MembershipRole grants disappear through the cascade.

BEGIN;

DELETE FROM public."PermissionRole"
WHERE "isSystem" = true
  AND "slug" IN ('administrator', 'admissions', 'counsellor', 'content-author', 'member');

COMMIT;
