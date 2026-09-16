export type KryptonMcqPaper = {
  questionIds: string[];
  /** Displayed option index → original option index, per question id. */
  optionMaps: Record<string, number[]>;
};

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
