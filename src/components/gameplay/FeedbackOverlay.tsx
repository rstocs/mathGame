import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { burstSmall } from '../../lib/confetti';
import { Button } from '../shared/Button';
import './FeedbackOverlay.css';

interface FeedbackOverlayProps {
  isCorrect: boolean;
  explanation: string;
  xpGained: number;
  onContinue: () => void;
}

export function FeedbackOverlay({ isCorrect, explanation, xpGained, onContinue }: FeedbackOverlayProps) {
  useEffect(() => {
    if (isCorrect) {
      burstSmall();
    }
  }, [isCorrect]);

  return (
    <AnimatePresence>
      <motion.div
        className={`feedback-panel ${isCorrect ? 'feedback-panel--correct' : 'feedback-panel--incorrect'}`}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
      >
        <div className="feedback-panel__header">
          <span className="feedback-panel__icon">{isCorrect ? '🎉' : '🤔'}</span>
          <span className="feedback-panel__title">{isCorrect ? 'Correct!' : 'Not quite'}</span>
          {isCorrect && xpGained > 0 && (
            <motion.span
              className="feedback-panel__xp anim-float-up"
              initial={{ opacity: 1, y: 0 }}
            >
              +{xpGained} XP
            </motion.span>
          )}
        </div>
        <p className="feedback-panel__explanation">{explanation}</p>
        <Button onClick={onContinue} fullWidth>
          Continue
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
