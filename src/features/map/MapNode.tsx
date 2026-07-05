import { motion } from 'framer-motion';
import type { LevelConfig } from '../../types';

export type NodeState = 'completed' | 'active' | 'locked';

interface MapNodeProps {
  level: LevelConfig;
  state: NodeState;
  onSelect: (levelId: number) => void;
}

/** One stop on the journey map: colored when done, pulsing when active, padlocked when future. */
export function MapNode({ level, state, onSelect }: MapNodeProps) {
  const base =
    'relative flex h-16 w-16 items-center justify-center rounded-full text-xl font-extrabold shadow-lg';

  if (state === 'locked') {
    return (
      <div
        data-testid={`map-node-${level.id}`}
        data-state="locked"
        aria-disabled="true"
        className={`${base} bg-slate-200 text-slate-400 shadow-inner`}
      >
        {level.id}
        <span className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-400 text-xs">
          🔒
        </span>
      </div>
    );
  }

  const isActive = state === 'active';
  return (
    <motion.button
      data-testid={`map-node-${level.id}`}
      data-state={state}
      onClick={() => onSelect(level.id)}
      whileTap={{ scale: 0.9 }}
      animate={isActive ? { scale: [1, 1.12, 1] } : undefined}
      transition={isActive ? { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className={`${base} ${
        isActive
          ? 'bg-gradient-to-br from-amber-200 to-amber-300 text-amber-900 ring-4 ring-amber-200/70'
          : 'bg-gradient-to-br from-green-200 to-green-300 text-green-900'
      }`}
    >
      {level.id}
      {state === 'completed' && (
        <span className="absolute -bottom-1 -end-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-400 text-xs">
          ⭐
        </span>
      )}
    </motion.button>
  );
}
