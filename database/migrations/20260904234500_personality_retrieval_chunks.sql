-- RAG store for Edith Personality Profile (ASSESS 001).
-- Vectors live as JSON in Postgres so this works without pgvector.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "RetrievalChunk" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT,
  "source" TEXT NOT NULL,
  "sourceId" TEXT,
  "text" TEXT NOT NULL,
  "embedding" JSONB NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RetrievalChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "RetrievalChunk_organizationId_source_idx"
ON "RetrievalChunk"("organizationId", "source");

CREATE INDEX IF NOT EXISTS "RetrievalChunk_organizationId_userId_idx"
ON "RetrievalChunk"("organizationId", "userId");

DO $$
BEGIN
  ALTER TABLE "RetrievalChunk"
    ADD CONSTRAINT "RetrievalChunk_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "RetrievalChunk"
    ADD CONSTRAINT "RetrievalChunk_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
