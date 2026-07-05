import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { getLevel, TOTAL_LEVELS } from '../../data/levels';
import { useGameStore } from '../../store/gameStore';
import { getUi } from '../../i18n';
import { useMemoryGame, FLIP_BACK_MS, type ShuffleFn } from './useMemoryGame';
import { MemoryCard } from './MemoryCard';
import { Confetti } from './Confetti';
import { CharacterModal } from '../../components/CharacterModal';
import { Button } from '../../components/Button';
import { playChime, warmVoices } from '../../lib/audio';

export { FLIP_BACK_MS };

interface GameBoardProps {
  levelId: number;
  /** Injectable for deterministic tests. */
  shuffle?: ShuffleFn;
}

export function GameBoard({ levelId, shuffle }: GameBoardProps) {
  const level = getLevel(levelId);
  const language = useGameStore((s) => s.language);
  const navigate = useGameStore((s) => s.navigate);
  const completeLevel = useGameStore((s) => s.completeLevel);
  const ui = getUi(language);
  const { cards, modalCharacter, isComplete, flipCard, closeModal } = useMemoryGame(level, shuffle);
  const celebrated = useRef(false);
  const matchedPairs = cards.filter((c) => !c.isLogo && c.status === 'matched').length / 2;

  // start downloading/compiling the voice model before the first match happens
  useEffect(() => {
    warmVoices(language);
  }, [language]);

  useEffect(() => {
    if (isComplete && !celebrated.current) {
      celebrated.current = true;
      completeLevel(levelId);
      playChime();
    }
  }, [isComplete, completeLevel, levelId]);

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-grape-700 via-grape-800 to-indigo-950 p-3">
      <header className="flex items-center justify-between pb-2">
        <button
          aria-label={ui.backToMap}
          onClick={() => navigate({ name: 'map' })}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl shadow-[0_4px_0_rgba(0,0,0,0.3)] ring-2 ring-white/20 active:translate-y-0.5 active:scale-95"
        >
          🗺️
        </button>
        <div className="text-center">
          <div className="text-sm font-bold text-amber-300">
            {ui.stage} {level.stage}
          </div>
          <div className="text-xl font-extrabold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
            {ui.level} {levelId} / {TOTAL_LEVELS}
          </div>
        </div>
        <div
          className="flex h-12 min-w-12 items-center justify-center rounded-2xl bg-white/15 px-2 text-base font-extrabold text-amber-300 ring-2 ring-white/20"
          aria-hidden="true"
        >
          {matchedPairs}/{level.pairs}
        </div>
      </header>

      {/* progress bar */}
      <div className="mx-auto mb-1 h-3 w-full max-w-sm overflow-hidden rounded-full bg-white/15">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-lime-400 to-amber-300"
          animate={{ width: `${(matchedPairs / level.pairs) * 100}%` }}
          transition={{ type: 'spring', damping: 20 }}
        />
      </div>

      {/* The grid fills the full remaining height — no vertical scrolling,
          cards stretch taller when width is the constraint. */}
      <main className="flex min-h-0 flex-1 items-center justify-center py-2">
        <div
          data-testid="game-grid"
          className="grid h-full w-full gap-3 sm:gap-4"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${level.rows}, minmax(0, 1fr))`,
            maxWidth: `min(100%, calc((100dvh - 11rem) * ${level.cols} / ${level.rows}), 36rem)`,
          }}
        >
          {cards.map((card, index) => (
            <MemoryCard key={card.uid} card={card} index={index} onFlip={flipCard} />
          ))}
        </div>
      </main>

      {isComplete && (
        <>
          <Confetti />
          <motion.footer
            data-testid="celebration"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 14 }}
            className="z-30 flex flex-col items-center gap-1 rounded-3xl bg-gradient-to-r from-lime-400 via-amber-300 to-orange-400 p-4 text-center shadow-[0_8px_0_rgba(0,0,0,0.35)]"
          >
            <div className="text-2xl font-extrabold text-grape-900">🎉 {ui.levelComplete}</div>
            <p className="text-sm font-bold text-grape-800">
              {ui.unlockedHeroes} · {ui.exploreHint}
            </p>
            <Button variant="pink" onClick={() => navigate({ name: 'map' })} className="mt-2">
              {ui.nextLevel} ⭐
            </Button>
          </motion.footer>
        </>
      )}

      <CharacterModal character={modalCharacter} onClose={closeModal} />
    </div>
  );
}
