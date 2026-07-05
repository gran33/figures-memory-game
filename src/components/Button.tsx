import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'success' | 'soft';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-200 text-sky-900 shadow-sky-300/60',
  success: 'bg-green-300 text-green-900 shadow-green-400/60',
  soft: 'bg-amber-100 text-amber-900 shadow-amber-200/60',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: Variant;
}

/** Chunky, tactile, kid-friendly button with a gentle press interaction. */
export function Button({ children, variant = 'primary', className = '', ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.94, y: 2 }}
      whileHover={{ scale: 1.03 }}
      className={`rounded-2xl px-6 py-3 text-lg font-bold shadow-lg transition-colors ${VARIANTS[variant]} ${className}`}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}
