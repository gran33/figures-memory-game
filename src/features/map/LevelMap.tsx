import { useEffect, useRef } from 'react';
import { LEVELS } from '../../data/levels';
import { useGameStore, currentLevelId, isLevelUnlocked } from '../../store/gameStore';
import { getUi } from '../../i18n';
import { ScoreChip } from '../../components/ScoreChip';
import { MapNode, type NodeState } from './MapNode';

/** Horizontal offsets forming a gentle winding candy trail. */
const WIGGLE = [0, 55, 80, 55, 0, -55, -80, -55];

/**
 * The scrollable Candy-Crush-style journey map. The child can browse the whole
 * roadmap; the active node pulses and auto-scrolls into view.
 */
export function LevelMap() {
  const language = useGameStore((s) => s.language);
  const navigate = useGameStore((s) => s.navigate);
  const completedLevels = useGameStore((s) => s.completedLevels);
  const ui = getUi(language);
  const activeId = currentLevelId({ completedLevels });
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [activeId]);

  const nodeState = (levelId: number): NodeState => {
    if (completedLevels.includes(levelId)) return 'completed';
    return isLevelUnlocked({ completedLevels }, levelId) ? 'active' : 'locked';
  };

  return (
    <div className="flex h-dvh flex-col bg-gradient-to-b from-indigo-950 via-grape-800 to-grape-600">
      <header className="z-10 flex items-center justify-between gap-2 bg-grape-900/80 p-4 shadow-lg backdrop-blur">
        <button
          aria-label={ui.appTitle}
          onClick={() => navigate({ name: 'menu' })}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-xl ring-2 ring-white/20 active:scale-95"
        >
          🏠
        </button>
        <h1 className="text-xl font-extrabold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
          🗺️ {ui.appTitle}
        </h1>
        <div className="flex items-center gap-2">
          <ScoreChip />
          <button
            onClick={() => navigate({ name: 'album' })}
            className="flex h-12 items-center gap-1 rounded-2xl bg-amber-300 px-3 text-sm font-extrabold text-amber-950 shadow-[0_4px_0_#b45309] active:translate-y-0.5 active:shadow-none"
          >
            📔 {ui.stickerAlbum}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-10" data-testid="level-map">
        <div className="mx-auto flex w-56 flex-col-reverse items-center gap-8">
          {LEVELS.map((level, i) => {
            const state = nodeState(level.id);
            const prev = LEVELS[i - 1];
            return (
              <div
                key={level.id}
                ref={state === 'active' ? activeRef : undefined}
                className="flex w-full flex-col items-center"
                style={{ transform: `translateX(${WIGGLE[i % WIGGLE.length] * 0.5}px)` }}
              >
                {(!prev || prev.stage !== level.stage) && (
                  <div className="mb-5 rounded-full bg-white/15 px-4 py-1 text-xs font-extrabold tracking-wider text-amber-300 ring-2 ring-white/10">
                    ✦ {ui.stage} {level.stage} · {level.rows}×{level.cols} ✦
                  </div>
                )}
                <MapNode
                  level={level}
                  state={state}
                  onSelect={(levelId) => navigate({ name: 'game', levelId })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
