import { createHash } from "node:crypto";

export const RAG_EMBED_DIM = 256;
export const RAG_EMBED_MODEL = "local-hash-256";

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

function bucket(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const index = digest.readUInt16BE(0) % RAG_EMBED_DIM;
  const sign = digest[2]! % 2 === 0 ? 1 : -1;
  return { index, sign };
}

/** Deterministic hashed embedding so RAG works without an API key. */
export function embedText(text: string): number[] {
  const vec = new Array<number>(RAG_EMBED_DIM).fill(0);
  for (const token of tokenize(text)) {
    const { index, sign } = bucket(token);
    vec[index] += sign;
  }
  let norm = 0;
  for (const value of vec) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  return vec.map((value) => value / norm);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

export function parseEmbedding(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null;
  const nums = value.filter((item): item is number => typeof item === "number");
  return nums.length ? nums : null;
}
