import { describe, it, expect } from 'vitest';
import {
  mergeLevelProgress,
  mergeProgress,
  mergeReviewItem,
  mergeReviewSchedule,
} from './mergeProgress';
import type { LevelProgress, PersistedState } from '../types/game';
import type { ReviewItem } from './review';

/**
 * These tests are the reason the merge lives in its own file.
 *
 * Every failure they describe is silent in the running app: no error, no crash,
 * nothing on screen. A kid just quietly loses stars, or quietly stops being
 * asked about a topic they cannot do. The only place that can be caught is
 * here.
 */

const level = (over: Partial<LevelProgress> = {}): LevelProgress => ({
  stars: 0,
  bestAccuracy: 0,
  timesPlayed: 0,
  lastPlayedAt: '2026-01-01T00:00:00.000Z',
  ...over,
});

const item = (over: Partial<ReviewItem> = {}): ReviewItem => ({
  box: 0,
  dueOn: '2026-08-16',
  lapses: 0,
  seen: 1,
  ...over,
});

const state = (over: Partial<PersistedState> = {}): PersistedState => ({
  version: 3,
  playerName: 'Alex',
  totalXP: 0,
  bestStreakEver: 0,
  unlockedBadgeIds: [],
  levelProgress: {},
  currentWorldId: 'g7-ratios-proportions',
  selectedGradeId: 7,
  soundEnabled: true,
  reviewSchedule: {},
  reviewMode: 'standard',
  ...over,
});

describe('achievement fields: a stale device can never lower them', () => {
  it('keeps the higher XP and best streak', () => {
    const merged = mergeProgress(
      state({ totalXP: 40, bestStreakEver: 3 }),
      state({ totalXP: 950, bestStreakEver: 12 }),
      { preferences: 'local' },
    );
    expect(merged.totalXP).toBe(950);
    expect(merged.bestStreakEver).toBe(12);
  });

  it('keeps every badge either side has earned', () => {
    const merged = mergeProgress(
      state({ unlockedBadgeIds: ['first-steps', 'streak-5'] }),
      state({ unlockedBadgeIds: ['first-steps', 'world-clear'] }),
      { preferences: 'local' },
    );
    expect([...merged.unlockedBadgeIds].sort()).toEqual(['first-steps', 'streak-5', 'world-clear']);
  });

  it('never lowers stars or best accuracy on a level', () => {
    expect(
      mergeLevelProgress(
        level({ stars: 1, bestAccuracy: 0.55 }),
        level({ stars: 3, bestAccuracy: 0.92 }),
      ),
    ).toMatchObject({ stars: 3, bestAccuracy: 0.92 });
  });

  it('does not add up timesPlayed', () => {
    // Summing inflates without bound, because merges run on every sync and each
    // side keeps re-adding the other's total.
    const once = mergeLevelProgress(level({ timesPlayed: 3 }), level({ timesPlayed: 5 }));
    const twice = mergeLevelProgress(once, level({ timesPlayed: 5 }));
    expect(once.timesPlayed).toBe(5);
    expect(twice.timesPlayed).toBe(5);
  });

  it('keeps levels that only one side knows about', () => {
    const merged = mergeProgress(
      state({ levelProgress: { 'rp-l1': level({ stars: 3 }) } }),
      state({ levelProgress: { 'ns-l1': level({ stars: 2 }) } }),
      { preferences: 'local' },
    );
    expect(merged.levelProgress['rp-l1'].stars).toBe(3);
    expect(merged.levelProgress['ns-l1'].stars).toBe(2);
  });
});

describe('review schedule: the evidence of forgetting wins', () => {
  it('keeps a topic the kid just failed, over a stale device that thinks they know it', () => {
    // THE case this file exists for.
    //
    // Phone: failed it today, so box 0 and due tomorrow.
    // Laptop: has not synced in a fortnight, still holds box 4 due in 30 days.
    //
    // Taking the highest would keep box 4 — discarding the fact that they just
    // got it wrong, and pushing the topic a month away. No error, nothing on
    // screen; the kid simply never sees it again.
    const justFailed = item({ box: 0, dueOn: '2026-08-16', lapses: 1, seen: 9 });
    const staleConfident = item({ box: 4, dueOn: '2026-09-15', lapses: 0, seen: 7 });

    expect(mergeReviewItem(justFailed, staleConfident)).toMatchObject({
      box: 0,
      dueOn: '2026-08-16',
    });
    // Order must not matter — the same two devices sync in both directions.
    expect(mergeReviewItem(staleConfident, justFailed)).toMatchObject({
      box: 0,
      dueOn: '2026-08-16',
    });
  });

  it('takes the earlier due date when the boxes agree', () => {
    expect(
      mergeReviewItem(
        item({ box: 2, dueOn: '2026-09-01' }),
        item({ box: 2, dueOn: '2026-08-20' }),
      ).dueOn,
    ).toBe('2026-08-20');
  });

  it('keeps the higher lapse and seen counts whichever box wins', () => {
    // These count things that really happened on some device; the box winning
    // says nothing about whether those events occurred.
    expect(
      mergeReviewItem(
        item({ box: 0, lapses: 3, seen: 11 }),
        item({ box: 5, lapses: 1, seen: 20 }),
      ),
    ).toMatchObject({ box: 0, lapses: 3, seen: 20 });
  });

  it('keeps topics only one side has seen', () => {
    const merged = mergeReviewSchedule(
      { 'rp-unit-rate': item({ box: 2 }) },
      { 'ns-fraction-add': item({ box: 1 }) },
    );
    expect(Object.keys(merged).sort()).toEqual(['ns-fraction-add', 'rp-unit-rate']);
  });

  it('is stable when applied twice', () => {
    // Sync runs repeatedly. A merge that keeps changing its answer would make
    // a topic drift earlier on every round trip.
    const a = { t: item({ box: 4, dueOn: '2026-09-15' }) };
    const b = { t: item({ box: 0, dueOn: '2026-08-16' }) };
    const once = mergeReviewSchedule(a, b);
    expect(mergeReviewSchedule(once, b)).toEqual(once);
    expect(mergeReviewSchedule(once, a)).toEqual(once);
  });
});

describe('preferences', () => {
  it('adopts the cloud when signing in on a new device', () => {
    // A fresh install defaults to grade 7 with no name. Letting those win would
    // blank the kid's name and drop them back several grades.
    const freshInstall = state({ playerName: '', selectedGradeId: 7 });
    const theirRealProfile = state({ playerName: 'Sam', selectedGradeId: 10 });

    const merged = mergeProgress(freshInstall, theirRealProfile, { preferences: 'remote' });
    expect(merged.playerName).toBe('Sam');
    expect(merged.selectedGradeId).toBe(10);
  });

  it('keeps a change the kid just made when pushing up', () => {
    const merged = mergeProgress(
      state({ reviewMode: 'careful', soundEnabled: false }),
      state({ reviewMode: 'standard', soundEnabled: true }),
      { preferences: 'local' },
    );
    expect(merged.reviewMode).toBe('careful');
    expect(merged.soundEnabled).toBe(false);
  });

  it('falls back rather than blanking a name', () => {
    const merged = mergeProgress(
      state({ playerName: 'Sam' }),
      state({ playerName: '' }),
      { preferences: 'remote' },
    );
    expect(merged.playerName).toBe('Sam');
  });

  it('never migrates backwards', () => {
    expect(mergeProgress(state({ version: 2 }), state({ version: 3 }), { preferences: 'local' }).version).toBe(3);
  });
});

describe('the guarantee, stated directly', () => {
  it('a month-old device syncing costs nothing', () => {
    const current = state({
      totalXP: 4200,
      bestStreakEver: 15,
      unlockedBadgeIds: ['a', 'b', 'c'],
      levelProgress: { 'rp-l1': level({ stars: 3, bestAccuracy: 1, timesPlayed: 4 }) },
      reviewSchedule: { 'rp-unit-rate': item({ box: 5, dueOn: '2026-10-01' }) },
    });
    const veryStale = state({
      totalXP: 10,
      bestStreakEver: 1,
      unlockedBadgeIds: [],
      levelProgress: { 'rp-l1': level({ stars: 0, bestAccuracy: 0, timesPlayed: 1 }) },
      reviewSchedule: {},
    });

    for (const opts of [{ preferences: 'local' }, { preferences: 'remote' }] as const) {
      const merged = mergeProgress(veryStale, current, opts);
      expect(merged.totalXP).toBe(4200);
      expect(merged.bestStreakEver).toBe(15);
      expect(merged.unlockedBadgeIds).toHaveLength(3);
      expect(merged.levelProgress['rp-l1']).toMatchObject({ stars: 3, bestAccuracy: 1 });
      // The stale side has no opinion on this topic, so the real one survives.
      expect(merged.reviewSchedule['rp-unit-rate'].box).toBe(5);
    }
  });
});

describe('signing up on the device that already has the progress', () => {
  it('would send a grade 9 student back to grade 7 if defaults were treated as real', () => {
    // Documents WHY progressSync refuses to merge against an untouched profile.
    //
    // The sign-up trigger creates a row carrying defaults: grade 7, the first
    // world, sound on. Those are placeholders, not choices. Merging against
    // them with preferences:'remote' — correct when the remote is real — hands
    // the placeholder the win.
    //
    // XP and stars are never at risk, since those take the highest value. The
    // grade is, and a silently reset grade is exactly the kind of "the app lost
    // my place" that makes a kid stop trusting it.
    const macbook = state({ selectedGradeId: 9, currentWorldId: 'g9-linear', totalXP: 3000 });
    const untouchedRow = state({ selectedGradeId: 7, currentWorldId: 'g7-ratios-proportions', totalXP: 0 });

    const ifWeMergedAnyway = mergeProgress(macbook, untouchedRow, { preferences: 'remote' });
    expect(ifWeMergedAnyway.selectedGradeId).toBe(7); // the regression, shown
    expect(ifWeMergedAnyway.totalXP).toBe(3000); // achievement was never at risk

    // remoteIsAuthoritative() is what stops that merge happening at all, so the
    // device keeps its own state untouched.
    expect(macbook.selectedGradeId).toBe(9);
  });

  it('keeps the local grade once the remote is genuinely a synced profile', () => {
    const laptop = state({ selectedGradeId: 9, totalXP: 3000 });
    const realRemote = state({ selectedGradeId: 10, totalXP: 5000 });
    // A real remote SHOULD win on preferences — that is a device catching up.
    expect(mergeProgress(laptop, realRemote, { preferences: 'remote' }).selectedGradeId).toBe(10);
  });
});
