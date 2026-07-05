import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Language, Screen } from '../types';
import { TOTAL_LEVELS } from '../data/levels';

export interface GameStoreState {
  language: Language;
  screen: Screen;
  /** Map node ids the child has completed. */
  completedLevels: number[];
  /** Character ids permanently discovered in the sticker album. */
  unlockedStickers: string[];

  setLanguage: (language: Language) => void;
  navigate: (screen: Screen) => void;
  completeLevel: (levelId: number) => void;
  unlockSticker: (characterId: string) => void;
  isStickerUnlocked: (characterId: string) => boolean;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      language: 'en',
      screen: { name: 'menu' },
      completedLevels: [],
      unlockedStickers: [],

      setLanguage: (language) => set({ language }),
      navigate: (screen) => set({ screen }),

      completeLevel: (levelId) =>
        set((state) =>
          state.completedLevels.includes(levelId)
            ? state
            : { completedLevels: [...state.completedLevels, levelId] },
        ),

      unlockSticker: (characterId) =>
        set((state) =>
          state.unlockedStickers.includes(characterId)
            ? state
            : { unlockedStickers: [...state.unlockedStickers, characterId] },
        ),

      isStickerUnlocked: (characterId) => get().unlockedStickers.includes(characterId),
    }),
    {
      name: 'history-heroes-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        completedLevels: state.completedLevels,
        unlockedStickers: state.unlockedStickers,
      }),
    },
  ),
);

/** The active (pulsing) map node: first uncompleted level, capped at the final node. */
export function currentLevelId(state: Pick<GameStoreState, 'completedLevels'>): number {
  const highest = state.completedLevels.reduce((max, id) => Math.max(max, id), 0);
  return Math.min(highest + 1, TOTAL_LEVELS);
}

/** A node is unlocked if it was completed or is the current active node. */
export function isLevelUnlocked(
  state: Pick<GameStoreState, 'completedLevels'>,
  levelId: number,
): boolean {
  return state.completedLevels.includes(levelId) || levelId === currentLevelId(state);
}
