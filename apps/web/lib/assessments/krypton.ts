import { createHmac, createHash, randomInt } from "node:crypto";

/**
 * Krypton Strength — per-candidate exam paper.
 *
 * HMAC-SHA256 expands into a keystream used for Fisher–Yates. Each learner
 * gets a unique question order (and unique MCQ option order) that is
 * reproducible for scoring but not predictable from another candidate's paper.
 */
const DOMAIN = "edith:krypton:v1";

export type KryptonMcqPaper = {
  questionIds: string[];
  /** Displayed option index → original option index, per question id. */
  optionMaps: Record<string, number[]>;
};

function hmacKey() {
  return (
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "edith-krypton-dev-only"
  );
}

function keystream(seed: Buffer) {
  let counter = 0;
  let offset = 0;
  let block = Buffer.alloc(0);
  return {
    byte() {
      if (offset >= block.length) {
        block = createHash("sha256")
          .update(seed)
          .update(Buffer.from([counter >> 24, counter >> 16, counter >> 8, counter]))
          .digest();
        counter += 1;
        offset = 0;
      }
      const value = block[offset]!;
      offset += 1;
      return value;
    },
    below(n: number) {
      if (n <= 1) return 0;
      const max = 256 - (256 % n);
      let sample = this.byte();
      while (sample >= max) sample = this.byte();
      return sample % n;
    },
  };
}

export function kryptonSeed(
  attemptId: string,
  section: string,
): Buffer {
  return createHmac("sha256", hmacKey())
    .update(`${DOMAIN}:${attemptId}:${section}`)
    .digest();
}

function permute<T>(items: T[], below: (n: number) => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = below(i + 1);
    [next[i], next[j]] = [next[j]!, next[i]!];
  }
  return next;
}

export function buildKryptonMcqPaper(
  questionIds: string[],
  optionCounts: Record<string, number>,
  seed: Buffer,
  shuffleOptions: boolean,
): KryptonMcqPaper {
  const stream = keystream(seed);
  const order = permute(questionIds, (n) => stream.below(n));
  const optionMaps: Record<string, number[]> = {};
  for (const id of order) {
    const count = optionCounts[id] ?? 0;
    const indices = Array.from({ length: count }, (_, index) => index);
    optionMaps[id] = shuffleOptions
      ? permute(indices, (n) => stream.below(n))
      : indices;
  }
  return { questionIds: order, optionMaps };
}

/** Map a displayed option index back to the bank's original index. */
export function originalOptionIndex(
  paper: KryptonMcqPaper,
  questionId: string,
  displayedIndex: number,
) {
  const map = paper.optionMaps[questionId];
  if (!map || displayedIndex < 0 || displayedIndex >= map.length) return null;
  return map[displayedIndex] ?? null;
}

export function applyOptionMap<T>(options: T[], map: number[] | undefined): T[] {
  if (!map || map.length !== options.length) return options;
  return map.map((original) => options[original]!);
}

/** Unbiased CSPRNG integer for one-off salts (not used in paper generation). */
export function kryptonNonce() {
  return randomInt(0, 2 ** 48);
}
