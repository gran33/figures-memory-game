import { describe, it, expect, beforeEach } from 'vitest';
import {
  useGameStore,
  isLevelUnlocked,
  currentLevelId,
  collectionMembers,
  COLLECTION_BONUS,
} from '../gameStore';
import { TOTAL_LEVELS } from '../../data/levels';

describe('gameStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState(useGameStore.getInitialState(), true);
  });

  describe('map progression / level unlocking', () => {
    it('starts with no completed levels and only level 1 unlocked', () => {
      const state = useGameStore.getState();
      expect(state.completedLevels).toEqual([]);
      expect(isLevelUnlocked(state, 1)).toBe(true);
      expect(isLevelUnlocked(state, 2)).toBe(false);
      expect(isLevelUnlocked(state, TOTAL_LEVELS)).toBe(false);
    });

    it('marks a level completed and unlocks the next map node', () => {
      useGameStore.getState().completeLevel(1);
      const state = useGameStore.getState();
      expect(state.completedLevels).toContain(1);
      expect(isLevelUnlocked(state, 2)).toBe(true);
      expect(isLevelUnlocked(state, 3)).toBe(false);
      expect(currentLevelId(state)).toBe(2);
    });

    it('does not duplicate a level completed twice (replays)', () => {
      useGameStore.getState().completeLevel(1);
      useGameStore.getState().completeLevel(1);
      expect(useGameStore.getState().completedLevels).toEqual([1]);
    });

    it('caps the current level at the final map node', () => {
      for (let i = 1; i <= TOTAL_LEVELS; i++) useGameStore.getState().completeLevel(i);
      const state = useGameStore.getState();
      expect(currentLevelId(state)).toBe(TOTAL_LEVELS);
      expect(isLevelUnlocked(state, TOTAL_LEVELS)).toBe(true);
    });
  });

  describe('sticker album collection', () => {
    it('starts with an empty album', () => {
      expect(useGameStore.getState().unlockedStickers).toEqual([]);
    });

    it('permanently moves a character to discovered when a match is resolved', () => {
      useGameStore.getState().unlockSticker('einstein');
      expect(useGameStore.getState().unlockedStickers).toContain('einstein');
      expect(useGameStore.getState().isStickerUnlocked('einstein')).toBe(true);
      expect(useGameStore.getState().isStickerUnlocked('curie')).toBe(false);
    });

    it('does not duplicate stickers unlocked more than once', () => {
      useGameStore.getState().unlockSticker('einstein');
      useGameStore.getState().unlockSticker('einstein');
      expect(useGameStore.getState().unlockedStickers).toEqual(['einstein']);
    });

    it('keeps stickers after further level completions (permanence)', () => {
      useGameStore.getState().unlockSticker('einstein');
      useGameStore.getState().completeLevel(1);
      useGameStore.getState().completeLevel(2);
      expect(useGameStore.getState().unlockedStickers).toContain('einstein');
    });
  });

  describe('positive-only scoring', () => {
    it('starts at 0 and accumulates through addPoints', () => {
      expect(useGameStore.getState().totalScore).toBe(0);
      useGameStore.getState().addPoints(150);
      useGameStore.getState().addPoints(50);
      expect(useGameStore.getState().totalScore).toBe(200);
    });

    it('ignores non-positive input — the total can never go down', () => {
      useGameStore.getState().addPoints(100);
      useGameStore.getState().addPoints(0);
      useGameStore.getState().addPoints(-9999);
      expect(useGameStore.getState().totalScore).toBe(100);
    });

    it('loads legacy saves without score fields as 0 / empty', async () => {
      localStorage.setItem(
        'history-heroes-storage',
        JSON.stringify({
          state: { language: 'he', completedLevels: [1], unlockedStickers: ['einstein'] },
          version: 0,
        }),
      );
      await useGameStore.persist.rehydrate();
      const state = useGameStore.getState();
      expect(state.totalScore).toBe(0);
      expect(state.completedCollections).toEqual([]);
      expect(state.completedLevels).toEqual([1]);
    });
  });

  describe('collection bonuses', () => {
    const inventors = collectionMembers('inventors');
    const women = collectionMembers('women');

    it('defines four 20-member collections', () => {
      expect(inventors).toHaveLength(20);
      expect(collectionMembers('leaders')).toHaveLength(20);
      expect(collectionMembers('athletes')).toHaveLength(20);
      expect(women).toHaveLength(20);
    });

    it('pays +500 exactly once, when the last sticker of a collection unlocks', () => {
      // curie is also a woman: leave her out so 'inventors' completes alone
      for (const id of inventors.filter((id) => id !== 'edison' && id !== 'curie')) {
        expect(useGameStore.getState().unlockSticker(id)).toEqual([]);
      }
      expect(useGameStore.getState().unlockSticker('curie')).toEqual([]);
      const scoreBefore = useGameStore.getState().totalScore;

      expect(useGameStore.getState().unlockSticker('edison')).toEqual(['inventors']);
      const state = useGameStore.getState();
      expect(state.completedCollections).toEqual(['inventors']);
      expect(state.totalScore).toBe(scoreBefore + COLLECTION_BONUS);
    });

    it('pays both bonuses when one unlock completes two collections at once', () => {
      // unlock everything in inventors + women except curie (member of both)
      for (const id of new Set([...inventors, ...women])) {
        if (id !== 'curie') useGameStore.getState().unlockSticker(id);
      }
      const scoreBefore = useGameStore.getState().totalScore;

      expect(useGameStore.getState().unlockSticker('curie')).toEqual(['inventors', 'women']);
      const state = useGameStore.getState();
      expect(state.completedCollections).toEqual(['inventors', 'women']);
      expect(state.totalScore).toBe(scoreBefore + 2 * COLLECTION_BONUS);
    });

    it('never re-awards a collection, even on redundant unlocks', () => {
      for (const id of inventors) useGameStore.getState().unlockSticker(id);
      const scoreAfterAward = useGameStore.getState().totalScore;

      expect(useGameStore.getState().unlockSticker('einstein')).toEqual([]);
      expect(useGameStore.getState().totalScore).toBe(scoreAfterAward);
      expect(useGameStore.getState().completedCollections).toEqual(['inventors']);
    });
  });

  describe('language', () => {
    it('defaults to English and can switch to Hebrew', () => {
      expect(useGameStore.getState().language).toBe('en');
      useGameStore.getState().setLanguage('he');
      expect(useGameStore.getState().language).toBe('he');
    });
  });

  describe('navigation', () => {
    it('starts on the menu and navigates between screens', () => {
      expect(useGameStore.getState().screen).toEqual({ name: 'menu' });
      useGameStore.getState().navigate({ name: 'game', levelId: 3 });
      expect(useGameStore.getState().screen).toEqual({ name: 'game', levelId: 3 });
    });
  });

  describe('persistence (localStorage via persist middleware)', () => {
    it('persists progress, stickers and language — but not the transient screen', () => {
      useGameStore.getState().completeLevel(1);
      useGameStore.getState().unlockSticker('einstein');
      useGameStore.getState().setLanguage('he');
      useGameStore.getState().addPoints(150);
      useGameStore.getState().navigate({ name: 'album' });

      const raw = localStorage.getItem('history-heroes-storage');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!).state;
      expect(persisted.completedLevels).toEqual([1]);
      expect(persisted.unlockedStickers).toEqual(['einstein']);
      expect(persisted.language).toBe('he');
      expect(persisted.totalScore).toBe(150);
      expect(persisted.completedCollections).toEqual([]);
      expect(persisted.screen).toBeUndefined();
    });
  });
});
