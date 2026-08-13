-- Members control station
--
-- Target database: edith_dev ONLY. Never run against compass_dev.
--
-- Purely additive: adds Membership."expiresAt" and the MembershipRole join
-- table so one membership can hold several PermissionRoles at once. No column
-- is renamed or dropped, so no existing data is at risk.
--
-- Membership.role and User."permissionRoleId" are deliberately left untouched:
-- both are shared with compass_dev, so parity on every shared field is kept and
-- edith_dev simply carries the extra table and column.
--
-- Idempotent: every statement is guarded, so a partial run can be retried.

BEGIN;

-- 1. Access expiry on Membership ----------------------------------------------
ALTER TABLE public."Membership" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Membership_expiresAt_idx"
  ON public."Membership" ("expiresAt");

-- 2. MembershipRole join table ------------------------------------------------
CREATE TABLE IF NOT EXISTS public."MembershipRole" (
  "id"               TEXT NOT NULL,
  "membershipId"     TEXT NOT NULL,
  "permissionRoleId" TEXT NOT NULL,
  "assignedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MembershipRole_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MembershipRole_permissionRoleId_idx"
  ON public."MembershipRole" ("permissionRoleId");

CREATE UNIQUE INDEX IF NOT EXISTS "MembershipRole_membershipId_permissionRoleId_key"
  ON public."MembershipRole" ("membershipId", "permissionRoleId");

-- 3. Foreign keys -------------------------------------------------------------
-- ADD CONSTRAINT has no IF NOT EXISTS, so each one is guarded by name.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('MembershipRole_membershipId_fkey',     'membershipId',     'Membership'),
      ('MembershipRole_permissionRoleId_fkey', 'permissionRoleId', 'PermissionRole')
    ) AS t(conname, col, target)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'public' AND c.conname = r.conname
    ) THEN
      EXECUTE format(
        'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) '
        || 'REFERENCES public.%I("id") ON DELETE CASCADE ON UPDATE CASCADE',
        'MembershipRole', r.conname, r.col, r.target
      );
    ELSE
      RAISE NOTICE 'skip constraint % (already present)', r.conname;
    END IF;
  END LOOP;
END $$;

-- 4. Verification -------------------------------------------------------------
-- Rolls the whole transaction back rather than leaving a half-built schema.
DO $$
DECLARE
  problems text[] := '{}';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Membership'
      AND column_name = 'expiresAt'
  ) THEN
    problems := problems || 'Membership.expiresAt missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'MembershipRole'
  ) THEN
    problems := problems || 'MembershipRole table missing';
  END IF;

  IF (
    SELECT count(*) FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = 'public'
      AND c.conname IN (
        'MembershipRole_membershipId_fkey',
        'MembershipRole_permissionRoleId_fkey'
      )
  ) <> 2 THEN
    problems := problems || 'MembershipRole foreign keys incomplete';
  END IF;

  IF array_length(problems, 1) IS NOT NULL THEN
    RAISE EXCEPTION 'members control station migration incomplete: %',
      array_to_string(problems, ', ');
  END IF;

  RAISE NOTICE 'verification passed: expiresAt, MembershipRole and both foreign keys present';
END $$;

COMMIT;
