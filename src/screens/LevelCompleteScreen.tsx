import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getLevel, getWorldForLevel } from '../data/worlds';
import { badges } from '../data/badges';
import { burstBig } from '../lib/confetti';
import { playSfx } from '../lib/sound';
import { StarRating } from '../components/shared/StarRating';
import { Button } from '../components/shared/Button';
import './LevelCompleteScreen.css';

export function LevelCompleteScreen() {
  const state = useGameStore();
  const result = state.lastLevelResult;

  useEffect(() => {
    if (!result) return;
    if (result.stars === 3) {
      burstBig();
    }
    // Only on a pass. A failed level already says "Almost There!"; answering it
    // with a buzz would just pile on.
    if (result.passed) {
      playSfx('levelUp', state.soundEnabled);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  if (!result) return null;

  const isReview = result.levelId === '__review__';
  const level = getLevel(result.levelId);
  const world = level ? getWorldForLevel(level.id) : undefined;
  const unlockedBadges = badges.filter((b) => result.newlyUnlockedBadgeIds.includes(b.id));

  const hasNextLevel = !isReview && world && level ? level.order < world.levels.length : false;

  return (
    <motion.div
      className={`screen level-complete-screen ${world ? `world-theme--${world.strand}` : ''}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <div className="level-complete-screen__card">
        <h1>{isReview ? 'Review Done!' : result.passed ? 'Level Complete!' : 'Almost There!'}</h1>
        <p className="level-complete-screen__level-title">
          {isReview
            ? 'Topics you got right move further away; ones you missed come back tomorrow.'
            : level?.title}
        </p>
        {!isReview && <StarRating stars={result.stars} />}

        <div className="level-complete-screen__stats">
          <div className="stat">
            <span className="stat__value">
              {result.correctCount}/{result.totalCount}
            </span>
            <span className="stat__label">Correct</span>
          </div>
          <div className="stat">
            <span className="stat__value">{result.bestStreak}</span>
            <span className="stat__label">Best Streak</span>
          </div>
          <div className="stat">
            <span className="stat__value">+{result.xpEarned}</span>
            <span className="stat__label">XP Earned</span>
          </div>
        </div>

        {unlockedBadges.length > 0 && (
          <div className="level-complete-screen__badges">
            {unlockedBadges.map((badge, i) => (
              <motion.div
                key={badge.id}
                className="badge-reveal"
                initial={{ opacity: 0, scale: 0, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + i * 0.15, type: 'spring', stiffness: 260, damping: 18 }}
              >
                <span className="badge-reveal__icon">{badge.icon}</span>
                <div>
                  <p className="badge-reveal__name">{badge.name}</p>
                  <p className="badge-reveal__desc">{badge.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!result.passed && (
          <p className="level-complete-screen__retry-hint">
            Get {Math.round((level?.passThreshold ?? 0.6) * 100)}% or higher to pass and unlock the next level.
          </p>
        )}

        <div className="level-complete-screen__actions">
          {!isReview && (
            <Button variant="secondary" onClick={state.retryLevel}>
              Retry
            </Button>
          )}
          {result.passed && hasNextLevel && <Button onClick={state.goToNextLevel}>Next Level</Button>}
          <Button
            variant={isReview || result.passed ? 'secondary' : 'primary'}
            onClick={isReview ? state.goToGradeSelect : state.goToWorldMap}
          >
            {isReview ? 'Done' : 'Back to Map'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
