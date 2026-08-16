/**
 * Spaced repetition over question TYPES.
 *
 * The thing being scheduled is a generator, not a question: every generator
 * produces unlimited fresh variants, so "see this again in a week" means "see
 * another question of this kind in a week", never the identical problem. That
 * is the crucial difference from flashcards — a kid cannot pass by recognising
 * the numbers, only by re-deriving the method.
 *
 * The ladder is a Leitner box system. Answer a type correctly and it moves up a
 * box and waits longer before returning; get it wrong and it drops to the
 * bottom and comes back tomorrow.
 */

export type ReviewMode = 'careful' | 'standard' | 'confident';

export const REVIEW_MODES: ReviewMode[] = ['careful', 'standard', 'confident'];

/**
 * Days to wait after reaching each box. Index 0 is the wait after your first
 * correct answer, so `standard` gives the familiar 1, 3, 7, 15, 30, 60, 120.
 *
 * `careful` repeats sooner and more often, for a kid who forgets quickly.
 * `confident` stretches the gaps for a kid who does not need the drilling —
 * fewer, longer-spaced encounters covering the same material.
 */
export const REVIEW_LADDERS: Record<ReviewMode, number[]> = {
  careful: [1, 2, 4, 7, 12, 21, 35],
  standard: [1, 3, 7, 15, 30, 60, 120],
  confident: [2, 5, 12, 30, 60, 120, 240],
};

export const REVIEW_MODE_INFO: Record<ReviewMode, { label: string; blurb: string }> = {
  careful: {
    label: 'Little and often',
    blurb: 'Comes back sooner — 1, 2, 4, 7 days. Best if things slip away quickly.',
  },
  standard: {
    label: 'Steady',
    blurb: 'The usual spacing — 1, 3, 7, 15 days. A good default.',
  },
  confident: {
    label: 'Spread out',
    blurb: 'Longer gaps — 2, 5, 12, 30 days. Fewer repeats if you remember well.',
  },
};

export interface ReviewItem {
  /** Leitner box. 0 means new or just forgotten; higher means better known. */
  box: number;
  /** Local calendar date, YYYY-MM-DD, on which this type is due again. */
  dueOn: string;
  /** How many times it has been forgotten after previously being known. */
  lapses: number;
  /** Total times it has been reviewed. */
  seen: number;
}

export type ReviewSchedule = Record<string, ReviewItem>;

/** The highest box in any ladder; reaching it means "well established". */
export const MASTERED_BOX = REVIEW_LADDERS.standard.length;

/**
 * Local calendar date as YYYY-MM-DD. Deliberately a DATE, not a timestamp:
 * "day 1, day 3, day 7" is how a kid experiences a schedule, and practising at
 * 9pm then again at 8am should count as two separate days, not eleven hours.
 */
export function todayIso(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  // Construct at midday so a daylight-saving shift cannot roll the date over.
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + days);
  return todayIso(date);
}

/** Negative when `a` is earlier than `b`. ISO dates compare correctly as text. */
export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function intervalAfter(mode: ReviewMode, box: number): number {
  const ladder = REVIEW_LADDERS[mode];
  return ladder[Math.min(box, ladder.length) - 1] ?? ladder[ladder.length - 1];
}

/**
 * Updates one question type after a session.
 *
 * `correct` should describe the WHOLE encounter with that type in that session
 * — if a kid met three ratio questions and missed one, the type is not yet
 * solid and should come back soon.
 */
export function recordReview(
  schedule: ReviewSchedule,
  generatorId: string,
  correct: boolean,
  mode: ReviewMode,
  today: string,
): ReviewSchedule {
  const existing = schedule[generatorId];
  const previousBox = existing?.box ?? 0;

  // A miss drops the type all the way to the bottom and brings it back
  // tomorrow. Stepping back gently would leave something the kid just failed
  // sitting a week or a month away, which is the opposite of what they need.
  const box = correct ? Math.min(previousBox + 1, REVIEW_LADDERS[mode].length) : 0;
  const wait = correct ? intervalAfter(mode, box) : 1;

  return {
    ...schedule,
    [generatorId]: {
      box,
      dueOn: addDays(today, wait),
      lapses: (existing?.lapses ?? 0) + (correct || previousBox === 0 ? 0 : 1),
      seen: (existing?.seen ?? 0) + 1,
    },
  };
}

/** Types due for review today or overdue, most overdue first. */
export function dueGenerators(schedule: ReviewSchedule, today: string): string[] {
  return Object.entries(schedule)
    .filter(([, item]) => compareIso(item.dueOn, today) <= 0)
    .sort(([, a], [, b]) => compareIso(a.dueOn, b.dueOn) || a.box - b.box)
    .map(([id]) => id);
}

/** Harder questions once a type is well established, so review keeps biting. */
export function difficultyForBox(box: number): 1 | 2 | 3 {
  if (box <= 1) return 1;
  if (box <= 3) return 2;
  return 3;
}

/**
 * At most this share of a review session may be from a grade above the one the
 * kid is working in. A little reach is good — a grade 6 student who once tried
 * a grade 9 topic should meet it again occasionally — but a review that is
 * mostly material they have not been taught reads as failure, not practice.
 */
export const MAX_ABOVE_GRADE_SHARE = 0.2;

export interface SessionPlan {
  /** The types to ask about, in the order they should be asked. */
  generatorIds: string[];
  /** How many came from above the kid's current grade. */
  aboveGrade: number;
  /** Due, but left out because the above-grade allowance was already used. */
  heldBack: number;
}

/**
 * Chooses what a review session should actually cover.
 *
 * Grade-appropriate types come first and fill most of the session; above-grade
 * types top it up to a small allowance. Anything above-grade that does not fit
 * simply waits — it stays due, and becomes ordinary material the moment the kid
 * switches to that grade.
 */
export function planReviewSession(args: {
  due: string[];
  /** Lowest grade that teaches a type; undefined means "treat as in-grade". */
  homeGradeOf: (generatorId: string) => number | undefined;
  currentGrade: number;
  size: number;
  /**
   * Whether a type still exists in the code. A saved schedule outlives the
   * question pool: a generator renamed or retired in a later release is still
   * sitting in every existing save, and asking for it would throw.
   */
  isKnown?: (generatorId: string) => boolean;
}): SessionPlan {
  const { due, homeGradeOf, currentGrade, size, isKnown } = args;

  const atOrBelow: string[] = [];
  const above: string[] = [];
  for (const id of due) {
    if (isKnown && !isKnown(id)) continue;
    const home = homeGradeOf(id);
    if (home !== undefined && home > currentGrade) above.push(id);
    else atOrBelow.push(id);
  }

  const chosen = atOrBelow.slice(0, size);
  // Always allow at least one, so a kid who has only ever reached above-grade
  // topics still gets a review rather than an empty screen.
  const allowance = Math.max(1, Math.floor(size * MAX_ABOVE_GRADE_SHARE));
  const extras = above.slice(0, Math.min(allowance, size - chosen.length));

  return {
    generatorIds: [...chosen, ...extras],
    aboveGrade: extras.length,
    heldBack: above.length - extras.length,
  };
}

export interface ReviewStats {
  due: number;
  learning: number;
  mastered: number;
  tracked: number;
  /** The soonest upcoming date, when nothing is due right now. */
  nextDueOn: string | null;
}

export function reviewStats(schedule: ReviewSchedule, today: string): ReviewStats {
  const items = Object.values(schedule);
  const due = items.filter((i) => compareIso(i.dueOn, today) <= 0);
  const upcoming = items
    .filter((i) => compareIso(i.dueOn, today) > 0)
    .sort((a, b) => compareIso(a.dueOn, b.dueOn));

  return {
    due: due.length,
    learning: items.filter((i) => i.box > 0 && i.box < MASTERED_BOX).length,
    mastered: items.filter((i) => i.box >= MASTERED_BOX).length,
    tracked: items.length,
    nextDueOn: upcoming[0]?.dueOn ?? null,
  };
}

/**
 * Folds one finished run into the schedule, one entry per question TYPE.
 *
 * Two rules matter here.
 *
 * A type counts as remembered only if EVERY question of that type in the run
 * was right: meeting three ratio questions and missing one means the skill is
 * not solid, and pretending otherwise would push it a week away.
 *
 * And authored questions count too. They carry no generator id, so they used to
 * be skipped entirely — a grade 7 kid could miss all nine hand-written unit-rate
 * questions, get the three generated ones right, and watch the topic get
 * PROMOTED. Their wrong answers were invisible to the one system meant to bring
 * the topic back.
 *
 * Which topic a miss belongs to comes from the question's own `topics` tags, so
 * getting a percent-change question wrong sends back percent change and leaves
 * percent-of alone. `topicsOf` decides that; this function only folds.
 */
export function applyRunToSchedule(args: {
  schedule: ReviewSchedule;
  /** How many questions the run asked. */
  questionCount: number;
  /** Whether each was right, indexed the same way. */
  answeredCorrect: boolean[];
  /**
   * Which question types each asked question exercises. A generated question
   * reports its own generator; a hand-written one reports its `topics` tags,
   * falling back to the level's topics when it carries none.
   */
  topicsOf: (index: number) => string[];
  mode: ReviewMode;
  today: string;
}): ReviewSchedule {
  const { schedule, questionCount, answeredCorrect, topicsOf, mode, today } = args;

  const verdict = new Map<string, boolean>();
  for (let i = 0; i < questionCount; i++) {
    const correct = answeredCorrect[i] ?? false;
    for (const topic of topicsOf(i)) {
      verdict.set(topic, (verdict.get(topic) ?? true) && correct);
    }
  }

  let next = schedule;
  for (const [generatorId, correct] of verdict) {
    next = recordReview(next, generatorId, correct, mode, today);
  }
  return next;
}
