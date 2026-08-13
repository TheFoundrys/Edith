-- Rollback for 20260813130000_members_control_station.sql
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- DESTRUCTIVE: dropping MembershipRole discards every multi-role assignment, and
-- dropping Membership."expiresAt" discards every access expiry date. Take a dump
-- first if those assignments matter.
--
-- If you roll back, also remove Membership.expiresAt, Membership.roles,
-- MembershipRole and PermissionRole.memberships from
-- apps/web/prisma/schema.prisma, then re-run
-- `prisma generate`, or the client will no longer match the database.

BEGIN;

DROP TABLE IF EXISTS public."MembershipRole";

DROP INDEX IF EXISTS public."Membership_expiresAt_idx";

ALTER TABLE public."Membership" DROP COLUMN IF EXISTS "expiresAt";

COMMIT;
