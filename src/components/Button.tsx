import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';

type Variant = 'primary' | 'success' | 'soft' | 'pink';

/** Chunky arcade buttons: solid top face + hard darker "3D" base that squashes on press. */
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-400 text-white shadow-[0_6px_0_#0369a1]',
  success: 'bg-lime-400 text-lime-950 shadow-[0_6px_0_#4d7c0f]',
  soft: 'bg-amber-300 text-amber-950 shadow-[0_6px_0_#b45309]',
  pink: 'bg-pink-400 text-white shadow-[0_6px_0_#be185d]',
};

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: Variant;
}

export function Button({ children, variant = 'primary', className = '', ...rest }: ButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97, y: 4, boxShadow: '0 2px 0 rgba(0,0,0,0.35)' }}
      whileHover={{ scale: 1.04 }}
      className={`rounded-2xl px-6 py-3 text-lg font-extrabold tracking-wide uppercase ${VARIANTS[variant]} ${className}`}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}
