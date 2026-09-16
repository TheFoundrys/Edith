/** Default number of parallel MCQ banks per course assessment. */
export const COURSE_MCQ_SET_COUNT = 3;

/** Next available set numbers (1-based) for a program. */
export function allocateSetNumbers(
  used: number[],
  count = COURSE_MCQ_SET_COUNT,
): number[] {
  const taken = new Set(used.filter((n) => Number.isFinite(n) && n > 0));
  const out: number[] = [];
  let candidate = 1;
  while (out.length < count) {
    if (!taken.has(candidate)) out.push(candidate);
    candidate += 1;
  }
  return out;
}

export function pickRandomCourseMcqSet<T extends { id: string }>(sets: T[]): T | null {
  if (sets.length === 0) return null;
  const index = Math.floor(Math.random() * sets.length);
  return sets[index] ?? null;
}

export function titleForMcqSet(baseTitle: string, setNumber: number, totalSets: number) {
  if (totalSets <= 1) return baseTitle;
  return `${baseTitle} · Set ${setNumber}`;
}
