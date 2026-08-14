import { motion, AnimatePresence } from 'framer-motion';
import './StreakMeter.css';

interface StreakMeterProps {
  streak: number;
}

const MAX_FLAMES = 5;

function comboLabel(streak: number): string | null {
  if (streak >= 12) return 'Combo x3!';
  if (streak >= 9) return 'Combo x2.5!';
  if (streak >= 6) return 'Combo x2!';
  if (streak >= 3) return 'Combo x1.5!';
  return null;
}

export function StreakMeter({ streak }: StreakMeterProps) {
  const filled = Math.min(streak, MAX_FLAMES);
  const combo = comboLabel(streak);

  return (
    <div className="streak-meter">
      <div className="streak-meter__flames">
        {Array.from({ length: MAX_FLAMES }, (_, i) => (
          <span key={i} className={`streak-flame ${i < filled ? 'streak-flame--lit' : ''}`}>
            🔥
          </span>
        ))}
      </div>
      <AnimatePresence>
        {combo && streak % 3 === 0 && (
          <motion.div
            key={combo}
            className="streak-combo-toast"
            initial={{ opacity: 0, scale: 0.5, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {combo}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
