import { useEffect, useRef } from 'react';
import { LEVELS } from '../../data/levels';
import { useGameStore, currentLevelId, isLevelUnlocked } from '../../store/gameStore';
import { getUi } from '../../i18n';
import { MapNode, type NodeState } from './MapNode';

/** Horizontal offsets (as % of half-width) forming a gentle winding path. */
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
    <div className="flex h-dvh flex-col bg-gradient-to-b from-sky-50 to-green-50">
      <header className="z-10 flex items-center justify-between gap-2 bg-orange-50/90 p-4 shadow-sm backdrop-blur">
        <button
          aria-label={ui.appTitle}
          onClick={() => navigate({ name: 'menu' })}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-xl shadow-sm active:scale-95"
        >
          🏠
        </button>
        <h1 className="text-xl font-extrabold text-slate-700">🗺️ {ui.appTitle}</h1>
        <button
          onClick={() => navigate({ name: 'album' })}
          className="flex h-11 items-center gap-1 rounded-2xl bg-amber-100 px-3 text-sm font-bold text-amber-900 shadow-sm active:scale-95"
        >
          📔 {ui.stickerAlbum}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto py-8" data-testid="level-map">
        <div className="mx-auto flex w-56 flex-col-reverse items-center gap-7">
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
                  <div className="mb-4 rounded-full bg-white/80 px-4 py-1 text-xs font-bold text-slate-400 shadow-sm">
                    {ui.stage} {level.stage} · {level.rows}×{level.cols}
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
