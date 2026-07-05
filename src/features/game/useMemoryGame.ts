import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, Character, LevelConfig } from '../../types';
import { gameData } from '../../i18n';
import { useGameStore } from '../../store/gameStore';

/** Interactive pause before two non-matching cards flip back face-down. */
export const FLIP_BACK_MS = 900;

export type ShuffleFn = <T>(arr: T[]) => T[];

const randomShuffle: ShuffleFn = (arr) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

function buildDeck(level: LevelConfig, pool: Character[], shuffle: ShuffleFn): Card[] {
  const chosen = shuffle(pool).slice(0, level.pairs);
  const deck: Card[] = shuffle(chosen.flatMap((c) => [c, c])).map((c, i) => ({
    uid: `${c.id}-${i}`,
    characterId: c.id,
    status: 'down',
    isLogo: false,
  }));
  if (level.logoIndex !== undefined) {
    deck.splice(level.logoIndex, 0, { uid: 'logo', characterId: '', status: 'up', isLogo: true });
  }
  return deck;
}

export interface MemoryGame {
  cards: Card[];
  /** Character shown in the reward / exploration modal, if any. */
  modalCharacter: Character | null;
  isComplete: boolean;
  flipCard: (index: number) => void;
  closeModal: () => void;
}

export function useMemoryGame(level: LevelConfig, shuffle: ShuffleFn = randomShuffle): MemoryGame {
  const unlockSticker = useGameStore((s) => s.unlockSticker);
  const [cards, setCards] = useState<Card[]>(() => buildDeck(level, gameData.characters, shuffle));
  const [pendingPair, setPendingPair] = useState<number[]>([]);
  const [modalCharacterId, setModalCharacterId] = useState<string | null>(null);
  const flipBackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(flipBackTimer.current), []);

  const flipCard = useCallback(
    (index: number) => {
      const card = cards[index];
      if (!card || card.isLogo) return;
      // free exploration: tapping a resolved card re-opens its character modal
      if (card.status === 'matched') {
        setModalCharacterId(card.characterId);
        return;
      }
      if (card.status === 'up' || pendingPair.length === 2) return;

      const pair = [...pendingPair, index];
      if (pair.length < 2) {
        setPendingPair(pair);
        setCards((cs) => cs.map((c, i) => (i === index ? { ...c, status: 'up' } : c)));
        return;
      }

      const [first] = pair;
      if (cards[first].characterId === card.characterId) {
        // match: both stay permanently face-up, sticker unlocks, reward modal opens
        setCards((cs) => cs.map((c, i) => (pair.includes(i) ? { ...c, status: 'matched' } : c)));
        setPendingPair([]);
        unlockSticker(card.characterId);
        setModalCharacterId(card.characterId);
      } else {
        setCards((cs) => cs.map((c, i) => (i === index ? { ...c, status: 'up' } : c)));
        setPendingPair(pair);
        flipBackTimer.current = setTimeout(() => {
          setCards((cs) => cs.map((c, i) => (pair.includes(i) ? { ...c, status: 'down' } : c)));
          setPendingPair([]);
        }, FLIP_BACK_MS);
      }
    },
    [cards, pendingPair, unlockSticker],
  );

  const modalCharacter = useMemo(
    () => gameData.characters.find((c) => c.id === modalCharacterId) ?? null,
    [modalCharacterId],
  );

  const isComplete = cards.length > 0 && cards.every((c) => c.isLogo || c.status === 'matched');

  return {
    cards,
    modalCharacter,
    isComplete,
    flipCard,
    closeModal: () => setModalCharacterId(null),
  };
}
