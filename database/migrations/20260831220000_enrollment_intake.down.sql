ALTER TABLE "Enrollment"
DROP CONSTRAINT IF EXISTS "Enrollment_intakeId_fkey";

DROP INDEX IF EXISTS "Enrollment_intakeId_idx";

ALTER TABLE "Enrollment"
DROP COLUMN IF EXISTS "intakeId";
