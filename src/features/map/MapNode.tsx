import { motion } from 'framer-motion';
import type { LevelConfig } from '../../types';

export type NodeState = 'completed' | 'active' | 'locked';

/** Each stage gets its own candy color along the trail. */
const STAGE_COLORS = [
  'from-pink-400 to-rose-500 shadow-[0_6px_0_#9f1239]',
  'from-orange-400 to-amber-500 shadow-[0_6px_0_#92400e]',
  'from-lime-400 to-green-500 shadow-[0_6px_0_#166534]',
  'from-cyan-400 to-sky-500 shadow-[0_6px_0_#075985]',
  'from-violet-400 to-purple-500 shadow-[0_6px_0_#6b21a8]',
  'from-fuchsia-400 to-pink-500 shadow-[0_6px_0_#9d174d]',
  'from-red-400 to-rose-500 shadow-[0_6px_0_#9f1239]',
  'from-amber-300 to-yellow-500 shadow-[0_6px_0_#a16207]',
];

interface MapNodeProps {
  level: LevelConfig;
  state: NodeState;
  onSelect: (levelId: number) => void;
}

/** One stop on the journey: candy-colored when done, glowing+pulsing when active, padlocked when future. */
export function MapNode({ level, state, onSelect }: MapNodeProps) {
  const base =
    'relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full text-2xl font-extrabold';

  if (state === 'locked') {
    return (
      <div
        data-testid={`map-node-${level.id}`}
        data-state="locked"
        aria-disabled="true"
        className={`${base} bg-white/15 text-white/40 ring-4 ring-white/10`}
      >
        {level.id}
        <span className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full bg-grape-900 text-sm ring-2 ring-white/20">
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
      animate={isActive ? { scale: [1, 1.15, 1] } : undefined}
      transition={isActive ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className={`${base} bg-gradient-to-br text-white ring-4 ring-white/70 ${
        STAGE_COLORS[(level.stage - 1) % STAGE_COLORS.length]
      } ${isActive ? 'shadow-[0_0_24px_6px_rgba(251,191,36,0.7)]' : ''}`}
    >
      {level.id}
      {state === 'completed' && (
        <span className="absolute -bottom-1 -end-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-sm shadow ring-2 ring-white">
          ⭐
        </span>
      )}
      {isActive && (
        <motion.span
          aria-hidden="true"
          className="absolute -top-9 text-3xl"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
        >
          👇
        </motion.span>
      )}
    </motion.button>
  );
}
