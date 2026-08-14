import { motion } from 'framer-motion';
import { playerLevelProgress } from '../../lib/xp';
import './XPBar.css';

interface XPBarProps {
  totalXP: number;
}

export function XPBar({ totalXP }: XPBarProps) {
  const { playerLevel, progressFraction } = playerLevelProgress(totalXP);
  return (
    <div className="xp-bar">
      <div className="xp-bar__level">Lv {playerLevel}</div>
      <div className="xp-bar__track">
        <motion.div
          className="xp-bar__fill"
          animate={{ width: `${Math.min(progressFraction, 1) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="xp-bar__xp">{totalXP} XP</div>
    </div>
  );
}
