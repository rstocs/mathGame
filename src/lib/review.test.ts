import { describe, it, expect } from 'vitest';
import {
  MASTERED_BOX,
  REVIEW_LADDERS,
  REVIEW_MODES,
  addDays,
  applyRunToSchedule,
  compareIso,
  difficultyForBox,
  dueGenerators,
  planReviewSession,
  recordReview,
  reviewStats,
  todayIso,
  type ReviewSchedule,
} from './review';

const DAY1 = '2026-03-01';

/** Answers a type correctly `times` times, following the schedule each time. */
function studyCorrectly(times: number, mode: 'careful' | 'standard' | 'confident' = 'standard') {
  let schedule: ReviewSchedule = {};
  let day = DAY1;
  const days = [day];
  for (let i = 0; i < times; i += 1) {
    schedule = recordReview(schedule, 'g', true, mode, day);
    day = schedule.g.dueOn;
    days.push(day);
  }
  return { schedule, days };
}

describe('date helpers', () => {
  it('formats a local date, not a UTC timestamp', () => {
    expect(todayIso(new Date(2026, 2, 1, 23, 30))).toBe('2026-03-01');
    expect(todayIso(new Date(2026, 0, 5, 0, 15))).toBe('2026-01-05');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-03-01', 1)).toBe('2026-03-02');
    expect(addDays('2026-03-30', 3)).toBe('2026-04-02');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-01-01', 0)).toBe('2026-01-01');
  });

  it('handles a leap year', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-28', 2)).toBe('2028-03-01');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
  });

  it('orders ISO dates as text', () => {
    expect(compareIso('2026-03-01', '2026-03-02')).toBeLessThan(0);
    expect(compareIso('2026-03-02', '2026-03-01')).toBeGreaterThan(0);
    expect(compareIso('2026-03-01', '2026-03-01')).toBe(0);
    expect(compareIso('2026-09-01', '2026-10-01')).toBeLessThan(0);
  });
});

describe('the standard ladder', () => {
  it('returns on days 1, 3, 7 and 15 as promised', () => {
    const { days } = studyCorrectly(4);
    // Start on day 1, then +1, +3, +7, +15.
    expect(days).toEqual(['2026-03-01', '2026-03-02', '2026-03-05', '2026-03-12', '2026-03-27']);
  });

  it('climbs one box per correct answer and stops at the top', () => {
    let schedule: ReviewSchedule = {};
    let day = DAY1;
    for (let i = 0; i < 20; i += 1) {
      schedule = recordReview(schedule, 'g', true, 'standard', day);
      day = schedule.g.dueOn;
    }
    expect(schedule.g.box).toBe(REVIEW_LADDERS.standard.length);
    expect(schedule.g.seen).toBe(20);
  });
});

describe('mode', () => {
  it('brings a type back sooner in careful mode than standard', () => {
    const careful = studyCorrectly(4, 'careful').days;
    const standard = studyCorrectly(4, 'standard').days;
    const confident = studyCorrectly(4, 'confident').days;
    // Compare the fourth review date: careful should be earliest.
    expect(compareIso(careful[4], standard[4])).toBeLessThan(0);
    expect(compareIso(standard[4], confident[4])).toBeLessThan(0);
  });

  it('offers a strictly increasing ladder in every mode', () => {
    for (const mode of REVIEW_MODES) {
      const ladder = REVIEW_LADDERS[mode];
      for (let i = 1; i < ladder.length; i += 1) {
        expect(ladder[i], `${mode} ladder goes backwards at step ${i}`).toBeGreaterThan(ladder[i - 1]);
      }
    }
  });

  it('lets the mode change without losing progress', () => {
    let schedule = studyCorrectly(3).schedule;
    const boxBefore = schedule.g.box;
    schedule = recordReview(schedule, 'g', true, 'confident', '2026-04-01');
    expect(schedule.g.box).toBe(boxBefore + 1);
  });
});

describe('getting it wrong', () => {
  it('drops the type to the bottom and returns it tomorrow', () => {
    const { schedule } = studyCorrectly(4);
    expect(schedule.g.box).toBe(4);

    const after = recordReview(schedule, 'g', false, 'standard', '2026-05-01');
    expect(after.g.box).toBe(0);
    expect(after.g.dueOn).toBe('2026-05-02');
  });

  it('counts a lapse only when something known is forgotten', () => {
    // Failing a brand-new type is not a lapse, it just has not been learnt yet.
    let schedule = recordReview({}, 'g', false, 'standard', DAY1);
    expect(schedule.g.lapses).toBe(0);

    schedule = recordReview(schedule, 'g', true, 'standard', DAY1);
    schedule = recordReview(schedule, 'g', false, 'standard', DAY1);
    expect(schedule.g.lapses).toBe(1);
  });

  it('climbs again from the bottom after a lapse', () => {
    let schedule = recordReview({}, 'g', false, 'standard', DAY1);
    schedule = recordReview(schedule, 'g', true, 'standard', '2026-03-02');
    expect(schedule.g.box).toBe(1);
    expect(schedule.g.dueOn).toBe('2026-03-03');
  });
});

describe('dueGenerators', () => {
  const schedule: ReviewSchedule = {
    overdue: { box: 2, dueOn: '2026-02-25', lapses: 0, seen: 2 },
    today: { box: 1, dueOn: '2026-03-01', lapses: 0, seen: 1 },
    tomorrow: { box: 3, dueOn: '2026-03-02', lapses: 0, seen: 3 },
    later: { box: 5, dueOn: '2026-06-01', lapses: 0, seen: 5 },
  };

  it('includes overdue and due-today, and excludes the future', () => {
    expect(dueGenerators(schedule, DAY1)).toEqual(['overdue', 'today']);
  });

  it('puts the most overdue first', () => {
    expect(dueGenerators(schedule, '2026-03-05')[0]).toBe('overdue');
  });

  it('returns nothing for an empty schedule', () => {
    expect(dueGenerators({}, DAY1)).toEqual([]);
  });

  it('catches everything up after a long absence', () => {
    expect(dueGenerators(schedule, '2027-01-01')).toHaveLength(4);
  });
});

describe('difficultyForBox', () => {
  it('gets harder as a type becomes better known', () => {
    expect(difficultyForBox(0)).toBe(1);
    expect(difficultyForBox(1)).toBe(1);
    expect(difficultyForBox(2)).toBe(2);
    expect(difficultyForBox(3)).toBe(2);
    expect(difficultyForBox(4)).toBe(3);
    expect(difficultyForBox(9)).toBe(3);
  });
});

describe('reviewStats', () => {
  it('reports nothing for a kid who has not started', () => {
    expect(reviewStats({}, DAY1)).toEqual({
      due: 0,
      learning: 0,
      mastered: 0,
      tracked: 0,
      nextDueOn: null,
    });
  });

  it('splits due, learning and mastered', () => {
    const schedule: ReviewSchedule = {
      a: { box: 0, dueOn: '2026-02-01', lapses: 1, seen: 3 },
      b: { box: 2, dueOn: '2026-06-01', lapses: 0, seen: 2 },
      c: { box: MASTERED_BOX, dueOn: '2026-09-01', lapses: 0, seen: 8 },
    };
    const stats = reviewStats(schedule, DAY1);
    expect(stats.due).toBe(1);
    expect(stats.learning).toBe(1);
    expect(stats.mastered).toBe(1);
    expect(stats.tracked).toBe(3);
    expect(stats.nextDueOn).toBe('2026-06-01');
  });

  it('reports the soonest upcoming date when nothing is due', () => {
    const schedule: ReviewSchedule = {
      a: { box: 3, dueOn: '2026-05-20', lapses: 0, seen: 3 },
      b: { box: 1, dueOn: '2026-03-04', lapses: 0, seen: 1 },
    };
    expect(reviewStats(schedule, DAY1).nextDueOn).toBe('2026-03-04');
  });
});

describe('planReviewSession', () => {
  // g6a/g6b are grade 6; g9a.. are grade 9.
  const grades: Record<string, number> = {
    g6a: 6,
    g6b: 6,
    g6c: 6,
    g9a: 9,
    g9b: 9,
    g9c: 9,
    g9d: 9,
  };
  const homeGradeOf = (id: string) => grades[id];

  it('fills a session with grade-appropriate types first', () => {
    const plan = planReviewSession({
      due: ['g9a', 'g6a', 'g9b', 'g6b', 'g6c'],
      homeGradeOf,
      currentGrade: 6,
      size: 10,
    });
    expect(plan.generatorIds.slice(0, 3)).toEqual(['g6a', 'g6b', 'g6c']);
  });

  it('lets only a small share of above-grade material in', () => {
    const plan = planReviewSession({
      due: ['g9a', 'g9b', 'g9c', 'g9d', 'g6a'],
      homeGradeOf,
      currentGrade: 6,
      size: 10,
    });
    // 20% of 10 is 2, so at most two grade 9 topics however many are due.
    expect(plan.aboveGrade).toBe(2);
    expect(plan.heldBack).toBe(2);
    expect(plan.generatorIds).toContain('g6a');
  });

  it('never leaves a kid with an empty session', () => {
    // Only above-grade work is due, and the session is short.
    const plan = planReviewSession({
      due: ['g9a', 'g9b', 'g9c'],
      homeGradeOf,
      currentGrade: 6,
      size: 3,
    });
    expect(plan.generatorIds.length).toBeGreaterThan(0);
    expect(plan.aboveGrade).toBeGreaterThan(0);
  });

  it('treats everything as in-grade for a kid working at the top grade', () => {
    const plan = planReviewSession({
      due: ['g9a', 'g9b', 'g6a'],
      homeGradeOf,
      currentGrade: 11,
      size: 10,
    });
    expect(plan.generatorIds).toHaveLength(3);
    expect(plan.aboveGrade).toBe(0);
    expect(plan.heldBack).toBe(0);
  });

  it('includes below-grade types without restriction', () => {
    // A grade 9 kid reviewing grade 6 material is revision, not frustration.
    const plan = planReviewSession({
      due: ['g6a', 'g6b', 'g6c'],
      homeGradeOf,
      currentGrade: 9,
      size: 10,
    });
    expect(plan.generatorIds).toHaveLength(3);
    expect(plan.aboveGrade).toBe(0);
  });

  it('treats an unknown generator as in-grade rather than dropping it', () => {
    const plan = planReviewSession({
      due: ['mystery'],
      homeGradeOf: () => undefined,
      currentGrade: 6,
      size: 10,
    });
    expect(plan.generatorIds).toEqual(['mystery']);
    expect(plan.aboveGrade).toBe(0);
  });

  it('respects the session size', () => {
    const plan = planReviewSession({
      due: ['g6a', 'g6b', 'g6c', 'g9a'],
      homeGradeOf,
      currentGrade: 6,
      size: 2,
    });
    expect(plan.generatorIds).toHaveLength(2);
  });

  it('reports nothing for an empty queue', () => {
    const plan = planReviewSession({ due: [], homeGradeOf, currentGrade: 6, size: 10 });
    expect(plan).toEqual({ generatorIds: [], aboveGrade: 0, heldBack: 0 });
  });

  it('skips types the code no longer has', () => {
    // Saved schedules outlive the question pool. A generator renamed or retired
    // in a later release is still sitting in every existing save, and asking
    // for it would throw — so the session must step over it, not choke.
    const plan = planReviewSession({
      due: ['g6a', 'retired-in-a-later-release', 'g6b'],
      homeGradeOf,
      currentGrade: 6,
      size: 10,
      isKnown: (id) => id !== 'retired-in-a-later-release',
    });
    expect(plan.generatorIds).toEqual(['g6a', 'g6b']);
  });

  it('does not count a retired above-grade type as held back', () => {
    const plan = planReviewSession({
      due: ['g6a', 'retired'],
      homeGradeOf: (id) => (id === 'retired' ? 9 : 6),
      currentGrade: 6,
      size: 10,
      isKnown: (id) => id !== 'retired',
    });
    expect(plan.heldBack).toBe(0);
  });
});

describe('the whole point', () => {
  it('a forgotten type reappears far sooner than a remembered one', () => {
    // Two types, learnt together to the same box.
    let schedule: ReviewSchedule = {};
    let day = DAY1;
    for (let i = 0; i < 4; i += 1) {
      schedule = recordReview(schedule, 'remembered', true, 'standard', day);
      schedule = recordReview(schedule, 'forgotten', true, 'standard', day);
      day = schedule.remembered.dueOn;
    }

    // On the next review one is missed.
    schedule = recordReview(schedule, 'remembered', true, 'standard', day);
    schedule = recordReview(schedule, 'forgotten', false, 'standard', day);

    expect(compareIso(schedule.forgotten.dueOn, schedule.remembered.dueOn)).toBeLessThan(0);
    expect(dueGenerators(schedule, addDays(day, 1))).toEqual(['forgotten']);
  });
});

describe('folding a finished run into the schedule', () => {
  const fold = (topics: string[][], correct: boolean[]) =>
    applyRunToSchedule({
      schedule: {},
      questionCount: topics.length,
      answeredCorrect: correct,
      topicsOf: (i) => topics[i],
      mode: 'standard',
      today: '2026-08-15',
    });

  it('brings a topic back tomorrow when hand-written questions were missed', () => {
    // The regression that mattered: grade 7 is mostly hand-written, and those
    // questions carry no generator id. A kid missed all the written unit-rate
    // questions, got the generated ones right, and the topic was PROMOTED —
    // the system meant to re-ask it never heard about the failures.
    const schedule = fold(
      [['rp-unit-rate'], ['rp-unit-rate'], ['rp-unit-rate']],
      [false, false, true],
    );
    expect(schedule['rp-unit-rate'].box).toBe(0);
    expect(schedule['rp-unit-rate'].dueOn).toBe('2026-08-16');
  });

  it('sends back only the topic that was missed, not its neighbours', () => {
    // Both live in the same level. Getting percent change wrong says nothing
    // about percent-of, and re-drilling a topic the kid just demonstrated is
    // wasted practice that makes review feel like punishment.
    const schedule = fold(
      [['rp-percent-of'], ['rp-percent-change'], ['rp-percent-of']],
      [true, false, true],
    );
    expect(schedule['rp-percent-change'].box).toBe(0);
    expect(schedule['rp-percent-of'].box).toBe(1);
  });

  it('counts a question that genuinely needs two skills against both', () => {
    // Solving 4x + 3 - x = 18 means combining like terms first. Missing it is
    // evidence about both, and there is no way to tell which half broke.
    const schedule = fold([['ee-solve-two-step', 'ee-combine-like-terms']], [false]);
    expect(Object.keys(schedule).sort()).toEqual(['ee-combine-like-terms', 'ee-solve-two-step']);
  });

  it('still promotes a topic when every question was right', () => {
    expect(fold([['rp-unit-rate'], ['rp-unit-rate']], [true, true])['rp-unit-rate'].box).toBe(1);
  });

  it('needs every question of a type right, not just the last one', () => {
    expect(fold([['rp-unit-rate'], ['rp-unit-rate']], [false, true])['rp-unit-rate'].box).toBe(0);
  });

  it('records nothing when a question has no topic to attribute to', () => {
    // An authored question with no tags in a level that generates nothing.
    // Inventing an entry would be worse than skipping it.
    expect(fold([[]], [false])).toEqual({});
  });
});
