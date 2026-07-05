import { describe, it, expect } from 'vitest';
import { LEVELS, TOTAL_LEVELS, getLevel } from '../levels';
import gameData from '../gameData.json';

describe('level progression map', () => {
  it('spans exactly 22 matches across 8 stages', () => {
    expect(TOTAL_LEVELS).toBe(22);
    expect(new Set(LEVELS.map((l) => l.stage)).size).toBe(8);
  });

  it('starts with two 3×3 matches with the center cell reserved for the logo', () => {
    const stage1 = LEVELS.filter((l) => l.stage === 1);
    expect(stage1).toHaveLength(2);
    for (const level of stage1) {
      expect(level.rows * level.cols).toBe(9);
      expect(level.pairs).toBe(4);
      expect(level.logoIndex).toBe(4); // exact center of a 3×3 grid
    }
  });

  it('ends with a single 6×6 grand finale of 18 pairs', () => {
    const finale = getLevel(TOTAL_LEVELS);
    expect(finale.stage).toBe(8);
    expect(finale.rows * finale.cols).toBe(36);
    expect(finale.pairs).toBe(18);
    expect(finale.logoIndex).toBeUndefined();
  });

  it('every board is exactly filled by its pairs (plus the logo cell)', () => {
    for (const level of LEVELS) {
      const cells = level.rows * level.cols;
      const logoCells = level.logoIndex === undefined ? 0 : 1;
      expect(level.pairs * 2 + logoCells).toBe(cells);
    }
  });

  it('has enough unique characters in gameData.json to feed the largest board', () => {
    const maxPairs = Math.max(...LEVELS.map((l) => l.pairs));
    expect(gameData.characters.length).toBeGreaterThanOrEqual(maxPairs);
    expect(new Set(gameData.characters.map((c) => c.id)).size).toBe(gameData.characters.length);
  });

  it('gives every character a gender so narration uses a fitting voice', () => {
    for (const character of gameData.characters) {
      expect(['male', 'female']).toContain(character.gender);
    }
    // spot-check known figures
    expect(gameData.characters.find((c) => c.id === 'einstein')?.gender).toBe('male');
    expect(gameData.characters.find((c) => c.id === 'curie')?.gender).toBe('female');
    expect(gameData.characters.find((c) => c.id === 'golda')?.gender).toBe('female');
  });
});
