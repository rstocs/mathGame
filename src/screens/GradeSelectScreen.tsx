import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { GRADES } from '../data/grades';
import { gradeCompletion, gradeStars } from '../lib/unlocks';
import { TopBar } from '../components/hud/TopBar';
import { ReviewCard } from '../components/review/ReviewCard';
import { playSfx } from '../lib/sound';
import './GradeSelectScreen.css';

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
        {GRADES.map((definition, index) => {
          const grade = definition.id;
          const worlds = definition.worlds;
          const completion = gradeCompletion(worlds, state);
          const stars = gradeStars(worlds, state);

          return (
            <motion.button
              key={grade}
              type="button"
              className="grade-card"
              style={{ ["--grade-color" as string]: definition.accentColor }}
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
                {definition.label}
                {definition.courseName && (
                  <small className="grade-card__course">{definition.courseName}</small>
                )}
              </span>
              <span className="grade-card__blurb">{definition.blurb}</span>

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
