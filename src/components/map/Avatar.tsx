import { motion } from 'framer-motion';

interface AvatarProps {
  x: number;
  y: number;
}

export function Avatar({ x, y }: AvatarProps) {
  return (
    <motion.g
      animate={{ x, y }}
      transition={{ type: 'tween', duration: 0.8, ease: 'easeInOut' }}
    >
      <motion.g
        animate={{ y: [-60, -67, -60], rotate: [-4, 4, -4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ellipse cx="0" cy="8" rx="14" ry="5" fill="rgba(35,50,74,0.15)" />
        <circle cx="0" cy="-6" r="17" fill="#ff8fc4" stroke="#c94f8f" strokeWidth="2.5" />
        <rect x="-11" y="-2" width="22" height="16" rx="8" fill="#ff8fc4" stroke="#c94f8f" strokeWidth="2.5" />
        <circle cx="-6" cy="-8" r="2.2" fill="#2b2033" />
        <circle cx="6" cy="-8" r="2.2" fill="#2b2033" />
        <path d="M -4,-1 Q 0,2 4,-1" stroke="#2b2033" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      </motion.g>
    </motion.g>
  );
}
