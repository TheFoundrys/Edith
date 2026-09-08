ALTER TABLE "RetrievalChunk"
DROP CONSTRAINT IF EXISTS "RetrievalChunk_userId_fkey";

ALTER TABLE "RetrievalChunk"
DROP CONSTRAINT IF EXISTS "RetrievalChunk_organizationId_fkey";

DROP INDEX IF EXISTS "RetrievalChunk_organizationId_userId_idx";
DROP INDEX IF EXISTS "RetrievalChunk_organizationId_source_idx";

DROP TABLE IF EXISTS "RetrievalChunk";
