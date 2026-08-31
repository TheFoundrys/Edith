ALTER TABLE "Enrollment"
ADD COLUMN "intakeId" TEXT;

CREATE INDEX "Enrollment_intakeId_idx" ON "Enrollment"("intakeId");

ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_intakeId_fkey"
FOREIGN KEY ("intakeId") REFERENCES "Intake"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
