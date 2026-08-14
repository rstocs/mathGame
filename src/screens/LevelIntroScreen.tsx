import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { getWorld } from '../data/worlds';
import { isLevelUnlocked } from '../lib/unlocks';
import { TopBar } from '../components/hud/TopBar';
import { StarRating } from '../components/shared/StarRating';
import './LevelIntroScreen.css';

export function LevelIntroScreen() {
  const state = useGameStore();
  const world = getWorld(state.selectedWorldId ?? '');

  if (!world) return null;

  return (
    <motion.div
      className={`screen level-intro-screen world-theme--${world.strand}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <TopBar totalXP={state.totalXP} onBack={state.goToWorldMap} />
      <div className="level-intro-screen__header">
        <h1>{world.name}</h1>
        <p>{world.description}</p>
      </div>
      <div className="level-intro-screen__list">
        {world.levels.map((level, index) => {
          const unlocked = isLevelUnlocked(world, state, index);
          const progress = state.levelProgress[level.id];
          return (
            <motion.button
              key={level.id}
              type="button"
              className={`level-card ${!unlocked ? 'level-card--locked' : ''}`}
              disabled={!unlocked}
              whileHover={unlocked ? { scale: 1.02 } : undefined}
              whileTap={unlocked ? { scale: 0.98 } : undefined}
              onClick={() => state.startLevel(level.id)}
            >
              <div className="level-card__number">{level.order}</div>
              <div className="level-card__body">
                <h2>{level.title}</h2>
                <p>{level.description}</p>
              </div>
              {unlocked ? (
                <StarRating stars={progress?.stars ?? 0} size={20} />
              ) : (
                <span className="level-card__lock">🔒</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
