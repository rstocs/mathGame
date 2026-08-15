import { motion } from 'framer-motion';
import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { playSfx } from '../../lib/sound';
import {
  REVIEW_MODES,
  REVIEW_MODE_INFO,
  REVIEW_LADDERS,
  reviewStats,
  todayIso,
} from '../../lib/review';
import './ReviewCard.css';

/** "in 3 days", "tomorrow" — friendlier than a bare date for a kid. */
function describeGap(fromIso: string, toIso: string): string {
  const [fy, fm, fd] = fromIso.split('-').map(Number);
  const [ty, tm, td] = toIso.split('-').map(Number);
  const days = Math.round(
    (Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / (1000 * 60 * 60 * 24),
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

export function ReviewCard() {
  const state = useGameStore();
  const [showModes, setShowModes] = useState(false);
  const today = todayIso();
  const stats = reviewStats(state.reviewSchedule, today);
  const ladder = REVIEW_LADDERS[state.reviewMode];

  return (
    <section className="review-card">
      <div className="review-card__head">
        <span className="review-card__icon" aria-hidden="true">
          🔁
        </span>
        <div className="review-card__headings">
          <h2>Daily Review</h2>
          <p>
            {stats.tracked === 0
              ? 'Play a level and the topics you meet will come back here, spaced out over time.'
              : stats.due > 0
                ? `${stats.due} topic${stats.due === 1 ? '' : 's'} ready to revisit.`
                : stats.nextDueOn
                  ? `Nothing due today — next up ${describeGap(today, stats.nextDueOn)}.`
                  : 'Nothing due today.'}
          </p>
        </div>
      </div>

      {stats.tracked > 0 && (
        <div className="review-card__stats">
          <span>
            <strong>{stats.due}</strong> due
          </span>
          <span>
            <strong>{stats.learning}</strong> learning
          </span>
          <span>
            <strong>{stats.mastered}</strong> solid
          </span>
        </div>
      )}

      <div className="review-card__actions">
        <motion.button
          type="button"
          className="review-card__start tap-target"
          disabled={stats.due === 0}
          whileHover={stats.due === 0 ? undefined : { scale: 1.03 }}
          whileTap={stats.due === 0 ? undefined : { scale: 0.97 }}
          onClick={() => {
            playSfx('click', state.soundEnabled);
            state.startReview();
          }}
        >
          {stats.due > 0 ? `Review ${Math.min(stats.due, 10)} now` : 'All caught up'}
        </motion.button>

        <button
          type="button"
          className="review-card__mode-toggle tap-target"
          aria-expanded={showModes}
          onClick={() => setShowModes((open) => !open)}
        >
          Pace: {REVIEW_MODE_INFO[state.reviewMode].label}
        </button>
      </div>

      {showModes && (
        <div className="review-card__modes" role="radiogroup" aria-label="Review pace">
          {REVIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={state.reviewMode === mode}
              className={`review-mode ${state.reviewMode === mode ? 'review-mode--active' : ''}`}
              onClick={() => {
                playSfx('click', state.soundEnabled);
                state.setReviewMode(mode);
              }}
            >
              <span className="review-mode__label">{REVIEW_MODE_INFO[mode].label}</span>
              <span className="review-mode__blurb">{REVIEW_MODE_INFO[mode].blurb}</span>
            </button>
          ))}
          <p className="review-card__ladder">
            Changing the pace keeps everything you have already learnt — it only changes how long
            until each topic comes back. Yours returns after {ladder.slice(0, 4).join(', ')} days.
          </p>
        </div>
      )}
    </section>
  );
}
