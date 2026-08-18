import { motion } from 'framer-motion';
import { rankProgress } from '../../lib/xp';
import './XPBar.css';

interface XPBarProps {
  totalXP: number;
}

export function XPBar({ totalXP }: XPBarProps) {
  const { rank, progressFraction } = rankProgress(totalXP);
  return (
    <div className="xp-bar">
      {/* "Rank", not "Lv": the map right below this numbers its levels 1, 2, 3,
          and an XP tier labelled Lv 3 reads as "you have finished three". */}
      <div className="xp-bar__level" title="Your rank goes up as you earn XP">
        Rank {rank}
      </div>
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
