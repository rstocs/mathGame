import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getLevel, getWorldForLevel } from '../data/worlds';
import type { UserAnswer } from '../lib/scoring';
import { TopBar } from '../components/hud/TopBar';
import { StreakMeter } from '../components/gameplay/StreakMeter';
import { QuestionCard } from '../components/gameplay/QuestionCard';
import { FeedbackOverlay } from '../components/gameplay/FeedbackOverlay';
import './GameplayScreen.css';

export function GameplayScreen() {
  const state = useGameStore();
  const run = state.run;
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; xpGained: number } | null>(null);

  if (!run) return null;

  const level = getLevel(run.levelId);
  const world = level ? getWorldForLevel(level.id) : undefined;
  const question = run.questions[run.currentIndex];

  const handleAnswer = (answer: UserAnswer) => {
    const result = state.submitAnswer(answer);
    setFeedback(result.correct ? { isCorrect: true, xpGained: result.xpGained } : { isCorrect: false, xpGained: 0 });
  };

  const handleContinue = () => {
    setFeedback(null);
    state.advanceAfterFeedback();
  };

  return (
    <motion.div
      className={`screen gameplay-screen ${world ? `world-theme--${world.strand}` : ''}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <TopBar
        totalXP={state.totalXP}
        onBack={() => (run.isReview ? state.goToGradeSelect() : world && state.selectWorld(world.id))}
        rightContent={
          <div className="gameplay-screen__hud-right">
            <span className="gameplay-screen__progress">
              {run.currentIndex + 1}/{run.questions.length}
            </span>
            <StreakMeter streak={run.streak} />
          </div>
        }
      />
      <div className="gameplay-screen__body">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="gameplay-screen__question-wrap"
          >
            <QuestionCard question={question} onAnswer={handleAnswer} feedback={feedback} />
          </motion.div>
        </AnimatePresence>
        {feedback && (
          <FeedbackOverlay
            isCorrect={feedback.isCorrect}
            explanation={question.explanation}
            xpGained={feedback.xpGained}
            onContinue={handleContinue}
          />
        )}
      </div>
    </motion.div>
  );
}
