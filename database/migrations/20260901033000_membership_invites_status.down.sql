DROP INDEX IF EXISTS "Group_organizationId_name_key";

ALTER TABLE "MembershipInvite"
DROP CONSTRAINT IF EXISTS "MembershipInvite_invitedById_fkey";

ALTER TABLE "MembershipInvite"
DROP CONSTRAINT IF EXISTS "MembershipInvite_organizationId_fkey";

DROP TABLE IF EXISTS "MembershipInvite";

DROP INDEX IF EXISTS "Membership_organizationId_status_idx";

ALTER TABLE "Membership"
DROP COLUMN IF EXISTS "updatedAt",
DROP COLUMN IF EXISTS "suspendedAt",
DROP COLUMN IF EXISTS "status";

DROP TYPE IF EXISTS "MembershipInviteStatus";
DROP TYPE IF EXISTS "MembershipStatus";
