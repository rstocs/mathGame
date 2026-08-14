import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import './Button.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  fullWidth?: boolean;
}

export function Button({ children, onClick, variant = 'primary', disabled, fullWidth }: ButtonProps) {
  return (
    <motion.button
      type="button"
      className={`btn btn--${variant} tap-target${fullWidth ? ' btn--full' : ''}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.04 }}
      whileTap={disabled ? undefined : { scale: 0.96 }}
    >
      {children}
    </motion.button>
  );
}
