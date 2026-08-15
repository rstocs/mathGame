import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { worldsForGrade } from '../data/worlds';
import { gradeCompletion, gradeStars } from '../lib/unlocks';
import { GRADE_IDS, type GradeId } from '../types/game';
import { TopBar } from '../components/hud/TopBar';
import { ReviewCard } from '../components/review/ReviewCard';
import { playSfx } from '../lib/sound';
import './GradeSelectScreen.css';

const BLURBS: Record<GradeId, string> = {
  5: 'Decimals, fractions, order of operations, volume, and plotting points.',
  6: 'Dividing fractions, factors, negative numbers, variables, and data.',
  7: 'Ratios, negative numbers, expressions, geometry, and probability.',
  8: 'Exponents, scientific notation, slope, Pythagoras, and scatter plots.',
  9: 'Algebra I: systems, functions, sequences, and quadratics.',
  10: 'Geometry: distance, trigonometry, circles, and transformations.',
  11: 'Algebra II: the quadratic formula, logarithms, and complex numbers.',
};

/** The high-school years are courses, not just year numbers. */
const COURSE_NAMES: Partial<Record<GradeId, string>> = {
  9: 'Algebra I',
  10: 'Geometry',
  11: 'Algebra II',
};

export function GradeSelectScreen() {
  const state = useGameStore();

  return (
    <motion.div
      className="screen grade-select-screen"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
    >
      <TopBar totalXP={state.totalXP} />
      <div className="grade-select-screen__header">
        <h1>{state.playerName}'s Adventure</h1>
        <p>Pick a grade. You can switch any time.</p>
      </div>

      <ReviewCard />

      <div className="grade-select-screen__grid">
        {GRADE_IDS.map((grade, index) => {
          const worlds = worldsForGrade(grade);
          const completion = gradeCompletion(worlds, state);
          const stars = gradeStars(worlds, state);

          return (
            <motion.button
              key={grade}
              type="button"
              className={`grade-card grade-card--${grade}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                playSfx('click', state.soundEnabled);
                state.selectGrade(grade);
              }}
            >
              <span className="grade-card__number">{grade}</span>
              <span className="grade-card__label">
                Grade {grade}
                {COURSE_NAMES[grade] && <small className="grade-card__course">{COURSE_NAMES[grade]}</small>}
              </span>
              <span className="grade-card__blurb">{BLURBS[grade]}</span>

              <span className="grade-card__progress">
                <span className="grade-card__track">
                  <span className="grade-card__fill" style={{ width: `${Math.round(completion * 100)}%` }} />
                </span>
                <span className="grade-card__stats">
                  ⭐ {stars.earned}/{stars.possible}
                </span>
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
