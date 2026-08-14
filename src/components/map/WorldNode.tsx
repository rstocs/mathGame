import { motion } from 'framer-motion';
import type { World } from '../../types/game';

interface WorldNodeProps {
  world: World;
  x: number;
  y: number;
  isUnlocked: boolean;
  progressFraction: number;
  isFullyMastered: boolean;
  onClick: () => void;
}

const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function WorldNode({ world, x, y, isUnlocked, progressFraction, isFullyMastered, onClick }: WorldNodeProps) {
  const { primary, secondary, accent } = world.colorTheme;

  return (
    <g transform={`translate(${x},${y})`}>
      <motion.g
        onClick={isUnlocked ? onClick : undefined}
        style={{ cursor: isUnlocked ? 'pointer' : 'default' }}
        whileHover={isUnlocked ? { scale: 1.08 } : undefined}
        whileTap={isUnlocked ? { scale: 0.95 } : undefined}
      >
        <circle r={RADIUS + 8} fill="white" opacity={0.9} />
        <circle
          r={RADIUS}
          fill={isUnlocked ? primary : '#b7bfcc'}
          stroke={isUnlocked ? accent : '#8a94a6'}
          strokeWidth="3"
          opacity={isUnlocked ? 1 : 0.6}
        />
        <circle
          r={RADIUS + 8}
          fill="none"
          stroke={secondary}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - (isUnlocked ? progressFraction : 0))}
          transform="rotate(-90)"
          opacity={isUnlocked ? 1 : 0}
        />
        <g opacity={isUnlocked ? 1 : 0.7}>
          <WorldIcon icon={world.icon} />
        </g>
        {!isUnlocked && (
          <text y="6" textAnchor="middle" fontSize="22">
            🔒
          </text>
        )}
        {isFullyMastered && (
          <text x="26" y="-26" textAnchor="middle" fontSize="20">
            👑
          </text>
        )}
        <text y={RADIUS + 26} textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--color-ink)">
          {world.name}
        </text>
        <text y={RADIUS + 42} textAnchor="middle" fontSize="11" fill="var(--color-ink-soft)">
          {world.shortLabel}
        </text>
      </motion.g>
    </g>
  );
}

function WorldIcon({ icon }: { icon: World['icon'] }) {
  switch (icon) {
    case 'mountain':
      return (
        <path
          d="M -20,14 L -6,-10 L 4,4 L 14,-18 L 24,14 Z"
          fill="white"
          stroke="none"
        />
      );
    case 'wave':
      return (
        <path
          d="M -22,4 Q -14,-14 -6,4 T 10,4 T 26,4"
          fill="none"
          stroke="white"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );
    case 'crystal':
      return <path d="M 0,-20 L 16,-2 L 0,20 L -16,-2 Z" fill="white" />;
    case 'temple':
      return (
        <g fill="white">
          <rect x="-20" y="4" width="40" height="6" />
          <rect x="-16" y="-14" width="4" height="18" />
          <rect x="-6" y="-14" width="4" height="18" />
          <rect x="4" y="-14" width="4" height="18" />
          <rect x="14" y="-14" width="4" height="18" />
          <path d="M -22,-14 L 0,-26 L 22,-14 Z" />
        </g>
      );
    case 'observatory':
      return (
        <g fill="white">
          <rect x="-14" y="0" width="28" height="16" rx="2" />
          <path d="M -16,0 A 16,16 0 0 1 16,0 Z" />
          <rect x="-2" y="-24" width="4" height="20" transform="rotate(20 0 -4)" />
        </g>
      );
  }
}
