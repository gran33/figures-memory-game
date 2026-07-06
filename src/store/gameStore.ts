import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { CollectionId, Language, Screen } from '../types';
import { TOTAL_LEVELS } from '../data/levels';
import { gameData } from '../i18n';

/** One-time reward for completing a sticker collection. */
export const COLLECTION_BONUS = 500;

/**
 * Sticker collections that pay a one-time bonus: the three categories plus the
 * cross-category Women collection. Always computed against the current full
 * roster, so a collection grown by new characters must be re-completed — but an
 * already-awarded bonus is never paid twice (points only ever go up).
 */
export function collectionMembers(collectionId: CollectionId): string[] {
  return gameData.characters
    .filter((c) => (collectionId === 'women' ? c.gender === 'female' : c.category === collectionId))
    .map((c) => c.id);
}

const COLLECTION_IDS: CollectionId[] = ['inventors', 'leaders', 'athletes', 'women'];

export interface GameStoreState {
  language: Language;
  screen: Screen;
  /** Map node ids the child has completed. */
  completedLevels: number[];
  /** Character ids permanently discovered in the sticker album. */
  unlockedStickers: string[];
  /** Lifetime score. Only ever grows — there is no API that lowers it. */
  totalScore: number;
  /** Collection ids whose one-time bonus was already awarded. */
  completedCollections: CollectionId[];

  setLanguage: (language: Language) => void;
  navigate: (screen: Screen) => void;
  completeLevel: (levelId: number) => void;
  /**
   * Unlocks a sticker and awards any collection bonuses it completes.
   * Returns the collection ids newly completed by this unlock (usually none).
   */
  unlockSticker: (characterId: string) => CollectionId[];
  isStickerUnlocked: (characterId: string) => boolean;
  /** The only score mutation: adds points to the lifetime total; ignores points <= 0. */
  addPoints: (points: number) => void;
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      language: 'en',
      screen: { name: 'menu' },
      completedLevels: [],
      unlockedStickers: [],
      totalScore: 0,
      completedCollections: [],

      setLanguage: (language) => set({ language }),
      navigate: (screen) => set({ screen }),

      completeLevel: (levelId) =>
        set((state) =>
          state.completedLevels.includes(levelId)
            ? state
            : { completedLevels: [...state.completedLevels, levelId] },
        ),

      unlockSticker: (characterId) => {
        const state = get();
        if (state.unlockedStickers.includes(characterId)) return [];
        const unlockedStickers = [...state.unlockedStickers, characterId];
        const newlyCompleted = COLLECTION_IDS.filter(
          (id) =>
            !state.completedCollections.includes(id) &&
            collectionMembers(id).every((member) => unlockedStickers.includes(member)),
        );
        set({
          unlockedStickers,
          completedCollections: [...state.completedCollections, ...newlyCompleted],
          totalScore: state.totalScore + newlyCompleted.length * COLLECTION_BONUS,
        });
        return newlyCompleted;
      },

      isStickerUnlocked: (characterId) => get().unlockedStickers.includes(characterId),

      addPoints: (points) => {
        if (points <= 0) return;
        set((state) => ({ totalScore: state.totalScore + points }));
      },
    }),
    {
      name: 'history-heroes-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        language: state.language,
        completedLevels: state.completedLevels,
        unlockedStickers: state.unlockedStickers,
        totalScore: state.totalScore,
        completedCollections: state.completedCollections,
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
