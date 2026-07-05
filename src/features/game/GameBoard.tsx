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
import { playChime } from '../../lib/audio';

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

  useEffect(() => {
    if (isComplete && !celebrated.current) {
      celebrated.current = true;
      completeLevel(levelId);
      playChime();
    }
  }, [isComplete, completeLevel, levelId]);

  return (
    <div className="flex h-dvh flex-col bg-orange-50 p-3">
      <header className="flex items-center justify-between pb-2">
        <button
          aria-label={ui.backToMap}
          onClick={() => navigate({ name: 'map' })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-xl shadow-sm active:scale-95"
        >
          🗺️
        </button>
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-400">
            {ui.stage} {level.stage}
          </div>
          <div className="text-lg font-extrabold text-slate-600">
            {ui.level} {levelId} / {TOTAL_LEVELS}
          </div>
        </div>
        <div className="w-11 text-center text-lg" aria-hidden="true">
          {cards.filter((c) => !c.isLogo && c.status === 'matched').length / 2}/{level.pairs}
        </div>
      </header>

      {/* The grid scales to always fit the viewport — no vertical scrolling. */}
      <main className="flex min-h-0 flex-1 items-center justify-center">
        <div
          data-testid="game-grid"
          className="grid w-full gap-2"
          style={{
            gridTemplateColumns: `repeat(${level.cols}, minmax(0, 1fr))`,
            maxWidth: `min(100%, calc((100dvh - 8.5rem) * ${level.cols} / ${level.rows}), 34rem)`,
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
            transition={{ type: 'spring', damping: 18 }}
            className="z-30 flex flex-col items-center gap-1 rounded-3xl bg-green-100 p-4 text-center shadow-xl"
          >
            <div className="text-xl font-extrabold text-green-800">🎉 {ui.levelComplete}</div>
            <p className="text-sm text-green-700">
              {ui.unlockedHeroes} · {ui.exploreHint}
            </p>
            <Button variant="success" onClick={() => navigate({ name: 'map' })} className="mt-2">
              {ui.nextLevel} ⭐
            </Button>
          </motion.footer>
        </>
      )}

      <CharacterModal character={modalCharacter} onClose={closeModal} />
    </div>
  );
}
