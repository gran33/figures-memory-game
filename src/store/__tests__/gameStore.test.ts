import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, isLevelUnlocked, currentLevelId } from '../gameStore';
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
      useGameStore.getState().navigate({ name: 'album' });

      const raw = localStorage.getItem('history-heroes-storage');
      expect(raw).not.toBeNull();
      const persisted = JSON.parse(raw!).state;
      expect(persisted.completedLevels).toEqual([1]);
      expect(persisted.unlockedStickers).toEqual(['einstein']);
      expect(persisted.language).toBe('he');
      expect(persisted.screen).toBeUndefined();
    });
  });
});
