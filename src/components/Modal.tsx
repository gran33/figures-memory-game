import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ModalProps {
  open: boolean;
  label: string;
  onClose: () => void;
  children: ReactNode;
}

/** Centered pop-up over a blurred, darkened board. */
export function Modal({ open, label, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-grape-900/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            className="relative w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-[0_10px_0_rgba(0,0,0,0.35)] ring-8 ring-amber-300/90"
            initial={{ scale: 0.5, opacity: 0, y: 60, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, y: 0, rotate: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 16, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
