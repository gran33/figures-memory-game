import { useMemo } from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#bae6fd', '#bbf7d0', '#fde68a', '#fbcfe8', '#ddd6fe', '#fed7aa'];

/** Soft, dependency-free confetti rain for the victory celebration. */
export function Confetti({ pieces = 40 }: { pieces?: number }) {
  const items = useMemo(
    () =>
      Array.from({ length: pieces }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.4 + Math.random() * 1.6,
        size: 8 + Math.random() * 8,
        color: COLORS[i % COLORS.length],
        spin: Math.random() > 0.5 ? 360 : -360,
      })),
    [pieces],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{ left: `${p.left}%`, width: p.size, height: p.size * 0.6, backgroundColor: p.color }}
          initial={{ y: '-10vh', rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', rotate: p.spin, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  );
}
