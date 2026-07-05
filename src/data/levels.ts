import type { LevelConfig } from '../types';

interface StageSpec {
  rows: number;
  cols: number;
  pairs: number;
  matches: number;
  logoIndex?: number;
}

/**
 * 8 grid stages spanning 22 map matches.
 * Stage 1's 3×3 board has a static logo card at the exact center (index 4),
 * leaving 8 flippable cards = 4 pairs.
 */
const STAGES: StageSpec[] = [
  { rows: 3, cols: 3, pairs: 4, matches: 2, logoIndex: 4 },
  { rows: 4, cols: 3, pairs: 6, matches: 3 },
  { rows: 4, cols: 4, pairs: 8, matches: 3 },
  { rows: 5, cols: 4, pairs: 10, matches: 3 },
  { rows: 6, cols: 4, pairs: 12, matches: 3 },
  { rows: 7, cols: 4, pairs: 14, matches: 3 },
  { rows: 6, cols: 5, pairs: 15, matches: 4 },
  { rows: 6, cols: 6, pairs: 18, matches: 1 },
];

export const LEVELS: LevelConfig[] = STAGES.flatMap((stage, stageIdx) =>
  Array.from({ length: stage.matches }, (): Omit<LevelConfig, 'id'> => ({
    stage: stageIdx + 1,
    rows: stage.rows,
    cols: stage.cols,
    pairs: stage.pairs,
    logoIndex: stage.logoIndex,
  })),
).map((level, i) => ({ ...level, id: i + 1 }));

export const TOTAL_LEVELS = LEVELS.length;

export function getLevel(id: number): LevelConfig {
  const level = LEVELS.find((l) => l.id === id);
  if (!level) throw new Error(`Unknown level id: ${id}`);
  return level;
}
