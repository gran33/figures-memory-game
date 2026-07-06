import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Card, Character, LevelConfig, MatchEvent, MatchTier } from '../../types';
import { gameData } from '../../i18n';
import { useGameStore } from '../../store/gameStore';

/** Interactive pause before two non-matching cards flip back face-down. */
export const FLIP_BACK_MS = 900;

/**
 * Positive-only scoring (docs/scoring-spec.md): every match pays, weaker
 * outcomes just celebrate smaller. Tier is decided by the second card of the
 * turn — unseen means pure luck, seen-and-never-squandered means real memory.
 */
export const TIER_POINTS: Record<MatchTier, number> = { lucky: 150, memory: 100, match: 50 };

/** Unconditional per-pair bonus paid every time a board is cleared. */
export const LEVEL_BONUS_PER_PAIR = 25;

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

/** What the reward / exploration modal is showing and why it opened. */
interface ModalState {
  characterId: string;
  /** Set when the modal was opened by a fresh match; null for free exploration. */
  match: MatchEvent | null;
}

export interface MemoryGame {
  cards: Card[];
  /** Character shown in the reward / exploration modal, if any. */
  modalCharacter: Character | null;
  /** The match that opened the current modal — drives the tier ribbon; null for exploration. */
  modalMatch: MatchEvent | null;
  isComplete: boolean;
  /** Points earned during this level run (matches + bonuses), for the celebration. */
  sessionPoints: number;
  flipCard: (index: number) => void;
  closeModal: () => void;
}

export function useMemoryGame(level: LevelConfig, shuffle: ShuffleFn = randomShuffle): MemoryGame {
  const unlockSticker = useGameStore((s) => s.unlockSticker);
  const addPoints = useGameStore((s) => s.addPoints);
  const [cards, setCards] = useState<Card[]>(() => buildDeck(level, gameData.characters, shuffle));
  const [pendingPair, setPendingPair] = useState<number[]>([]);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [sessionPoints, setSessionPoints] = useState(0);
  const matchCount = useRef(0);
  // Per-level-session memory tracking; resets with the component, never persisted.
  const seenUids = useRef(new Set<string>());
  const missedPairs = useRef(new Set<string>());
  const bonusAwarded = useRef(false);
  const flipBackTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(flipBackTimer.current), []);

  const flipCard = useCallback(
    (index: number) => {
      const card = cards[index];
      if (!card || card.isLogo) return;
      // free exploration: tapping a resolved card re-opens its character modal
      if (card.status === 'matched') {
        setModal({ characterId: card.characterId, match: null });
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
      const firstCard = cards[first];
      if (firstCard.characterId === card.characterId) {
        // match: both stay permanently face-up, sticker unlocks, reward modal opens
        const tier: MatchTier = !seenUids.current.has(card.uid)
          ? 'lucky'
          : !missedPairs.current.has(card.characterId)
            ? 'memory'
            : 'match';
        const points = TIER_POINTS[tier];
        setCards((cs) => cs.map((c, i) => (pair.includes(i) ? { ...c, status: 'matched' } : c)));
        setPendingPair([]);
        addPoints(points);
        const completedCollections = unlockSticker(card.characterId);
        setSessionPoints((p) => p + points); // collection bonuses celebrate separately
        matchCount.current += 1;
        setModal({
          characterId: card.characterId,
          match: {
            id: matchCount.current,
            tier,
            points,
            characterId: card.characterId,
            completedCollections,
          },
        });
      } else {
        // failed turn: silently record missed chances — the player had already
        // seen a partner of one of these cards, but didn't take the match
        for (const c of [firstCard, card]) {
          const partner = cards.find(
            (o) => !o.isLogo && o.characterId === c.characterId && o.uid !== c.uid,
          );
          if (partner && seenUids.current.has(partner.uid)) {
            missedPairs.current.add(c.characterId);
          }
        }
        setCards((cs) => cs.map((c, i) => (i === index ? { ...c, status: 'up' } : c)));
        setPendingPair(pair);
        flipBackTimer.current = setTimeout(() => {
          setCards((cs) => cs.map((c, i) => (pair.includes(i) ? { ...c, status: 'down' } : c)));
          setPendingPair([]);
        }, FLIP_BACK_MS);
      }
      seenUids.current.add(firstCard.uid);
      seenUids.current.add(card.uid);
    },
    [cards, pendingPair, unlockSticker, addPoints],
  );

  const isComplete = cards.length > 0 && cards.every((c) => c.isLogo || c.status === 'matched');

  // Unconditional completion bonus, paid on every clear — replays included.
  useEffect(() => {
    if (isComplete && !bonusAwarded.current) {
      bonusAwarded.current = true;
      const bonus = level.pairs * LEVEL_BONUS_PER_PAIR;
      addPoints(bonus);
      setSessionPoints((p) => p + bonus);
    }
  }, [isComplete, level.pairs, addPoints]);

  const modalCharacter = useMemo(
    () => gameData.characters.find((c) => c.id === modal?.characterId) ?? null,
    [modal?.characterId],
  );

  return {
    cards,
    modalCharacter,
    modalMatch: modal?.match ?? null,
    isComplete,
    sessionPoints,
    flipCard,
    closeModal: () => setModal(null),
  };
}
