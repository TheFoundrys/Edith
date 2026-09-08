import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { jsonWithoutNul } from "@/lib/db/pg-json";
import { chunkText } from "@/lib/rag/chunk";
import { cosineSimilarity, embedText, parseEmbedding } from "@/lib/rag/embed";
import {
  isPersonalityProfileProgram,
} from "@/lib/assessments/personality-profile";

export type RetrievalSource = "resume" | "profile" | "exam" | "catalog";

export type RetrievedChunk = {
  source: RetrievalSource;
  text: string;
  score: number;
  metadata: Record<string, string>;
};

async function replaceChunks(input: {
  organizationId: string;
  userId: string | null;
  source: RetrievalSource;
  sourceId?: string | null;
  texts: string[];
  metadata?: Record<string, string>;
}) {
  const texts = input.texts.map((text) => text.trim()).filter((text) => text.length > 20);
  await prisma.retrievalChunk.deleteMany({
    where: {
      organizationId: input.organizationId,
      source: input.source,
      userId: input.userId,
      ...(input.sourceId ? { sourceId: input.sourceId } : {}),
    },
  });
  if (texts.length === 0) return 0;
  await prisma.retrievalChunk.createMany({
    data: texts.map((text) => ({
      organizationId: input.organizationId,
      userId: input.userId,
      source: input.source,
      sourceId: input.sourceId ?? null,
      text: jsonWithoutNul(text.slice(0, 4000)),
      embedding: embedText(text) as Prisma.InputJsonValue,
      metadata: jsonWithoutNul(input.metadata ?? {}) as Prisma.InputJsonValue,
    })),
  });
  return texts.length;
}

export async function indexResumeChunks(input: {
  organizationId: string;
  userId: string;
  text: string;
}) {
  return replaceChunks({
    organizationId: input.organizationId,
    userId: input.userId,
    source: "resume",
    texts: chunkText(input.text),
    metadata: { kind: "resume" },
  });
}

export async function indexProfileChunks(input: {
  organizationId: string;
  userId: string;
  name: string;
  headline?: string | null;
  bio?: string | null;
  careerPath?: string | null;
}) {
  const text = [
    input.name,
    input.headline,
    input.careerPath,
    input.bio,
  ]
    .filter(Boolean)
    .join(". ");
  return replaceChunks({
    organizationId: input.organizationId,
    userId: input.userId,
    source: "profile",
    texts: chunkText(text || input.name),
    metadata: { kind: "profile" },
  });
}

export async function indexExamChunks(input: {
  organizationId: string;
  userId: string;
  summary: string;
}) {
  return replaceChunks({
    organizationId: input.organizationId,
    userId: input.userId,
    source: "exam",
    texts: chunkText(input.summary),
    metadata: { kind: "exam" },
  });
}

export async function indexCatalog(organizationId: string) {
  const programs = await prisma.program.findMany({
    where: { organizationId, status: "PUBLISHED" },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      eligibilitySummary: true,
      learningOutcomes: true,
      tags: true,
      sku: true,
      domainSlug: true,
    },
  });
  await prisma.retrievalChunk.deleteMany({
    where: { organizationId, source: "catalog", userId: null },
  });
  const rows = programs
    .filter((program) => !isPersonalityProfileProgram(program))
    .map((program) => {
      const text = [
        program.title,
        program.slug,
        program.description,
        program.eligibilitySummary,
        (program.learningOutcomes ?? []).join(". "),
        (program.tags ?? []).join(" "),
      ]
        .filter(Boolean)
        .join("\n");
      return {
        organizationId,
        userId: null,
        source: "catalog",
        sourceId: program.slug,
        text: jsonWithoutNul(text.slice(0, 4000)),
        embedding: embedText(text) as Prisma.InputJsonValue,
        metadata: jsonWithoutNul({
          slug: program.slug,
          title: program.title,
        }) as Prisma.InputJsonValue,
      };
    })
    .filter((row) => row.text.length > 20);
  if (rows.length) await prisma.retrievalChunk.createMany({ data: rows });
  return rows.length;
}

export async function ensureCatalogIndexed(organizationId: string) {
  const existing = await prisma.retrievalChunk.count({
    where: { organizationId, source: "catalog" },
  });
  if (existing > 0) return existing;
  return indexCatalog(organizationId);
}

export async function retrieveForStudent(input: {
  organizationId: string;
  userId: string;
  query: string;
  limit?: number;
}): Promise<RetrievedChunk[]> {
  await ensureCatalogIndexed(input.organizationId);
  const rows = await prisma.retrievalChunk.findMany({
    where: {
      organizationId: input.organizationId,
      OR: [{ source: "catalog", userId: null }, { userId: input.userId }],
    },
    select: {
      source: true,
      text: true,
      embedding: true,
      metadata: true,
    },
  });
  const query = embedText(input.query);
  const scored = rows
    .map((row) => {
      const embedding = parseEmbedding(row.embedding);
      if (!embedding) return null;
      const metadata =
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, string>)
          : {};
      return {
        source: row.source as RetrievalSource,
        text: row.text,
        score: cosineSimilarity(query, embedding),
        metadata,
      };
    })
    .filter((row): row is RetrievedChunk => Boolean(row))
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, input.limit ?? 8);
}
