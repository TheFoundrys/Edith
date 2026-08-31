DO $$
BEGIN
  CREATE TYPE "MembershipStatus" AS ENUM ('ACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "MembershipInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Membership"
ADD COLUMN IF NOT EXISTS "status" "MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Membership_organizationId_status_idx"
ON "Membership"("organizationId", "status");

CREATE TABLE IF NOT EXISTS "MembershipInvite" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "role" "Role" NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "status" "MembershipInviteStatus" NOT NULL DEFAULT 'PENDING',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "invitedById" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MembershipInvite_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipInvite_tokenHash_key"
ON "MembershipInvite"("tokenHash");

CREATE INDEX IF NOT EXISTS "MembershipInvite_organizationId_email_status_idx"
ON "MembershipInvite"("organizationId", "email", "status");

CREATE INDEX IF NOT EXISTS "MembershipInvite_organizationId_status_idx"
ON "MembershipInvite"("organizationId", "status");

DO $$
BEGIN
  ALTER TABLE "MembershipInvite"
  ADD CONSTRAINT "MembershipInvite_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "MembershipInvite"
  ADD CONSTRAINT "MembershipInvite_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DELETE FROM "Group" older
USING "Group" newer
WHERE older."organizationId" = newer."organizationId"
  AND lower(older."name") = lower(newer."name")
  AND older."createdAt" < newer."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "Group_organizationId_name_key"
ON "Group"("organizationId", "name");
