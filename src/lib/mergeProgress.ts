/**
 * Reconciling one kid's progress across two devices.
 *
 * The whole reason this file is separate, pure, and heavily tested: once
 * progress lives in a database instead of on one device, every mistake here
 * stops being "this phone lost its save" and becomes "the phone overwrote the
 * laptop", silently, with no error and nothing on screen to show it.
 *
 * There are three kinds of field and THREE DIFFERENT RULES, and using one rule
 * for everything breaks something important each time.
 *
 *   1. Achievement — XP, stars, best accuracy, badges, best streak.
 *      HIGHEST WINS. These only ever go up. A stale device must be incapable
 *      of lowering them, no matter how out of date it is.
 *
 *   2. The review schedule — which topics come back, and when.
 *      FORGETTING WINS, which is the opposite rule. See below.
 *
 *   3. Preferences — name, grade, sound, review pace.
 *      One side is chosen deliberately by the caller, because there is no
 *      correct automatic answer and guessing wrong is visible and annoying
 *      rather than destructive.
 */

import type { LevelProgress, PersistedState } from '../types/game';
import type { ReviewItem, ReviewSchedule } from './review';

export interface MergeOptions {
  /**
   * Whose preferences to keep.
   *
   * `'remote'` when adopting the cloud on this device — signing in on a new
   * phone should bring the kid's name and grade with it, and the local values
   * are just install defaults that would otherwise overwrite the real ones.
   *
   * `'local'` when pushing this device's state up: the kid is sitting here, so
   * a change they just made wins over whatever the server last heard.
   */
  preferences: 'local' | 'remote';
}

const maxOf = (a: number | undefined, b: number | undefined): number =>
  Math.max(a ?? 0, b ?? 0);

/** The later of two ISO timestamps; either may be missing. */
function latestIso(a: string | undefined, b: string | undefined): string {
  if (!a) return b ?? '';
  if (!b) return a;
  return a > b ? a : b;
}

/**
 * One level's progress. Every field is an achievement, so every field takes the
 * higher value.
 *
 * `timesPlayed` takes the max rather than the sum on purpose. Summing looks
 * more correct and is wrong: merges run repeatedly, on every sync, so the two
 * sides would keep adding each other's totals and the count would inflate
 * without bound. Max understates when a kid genuinely played on both devices
 * while offline, and that is the harmless direction — the number decides
 * nothing except which generated questions get rerolled.
 */
export function mergeLevelProgress(local: LevelProgress, remote: LevelProgress): LevelProgress {
  return {
    stars: Math.max(local.stars, remote.stars) as LevelProgress['stars'],
    bestAccuracy: maxOf(local.bestAccuracy, remote.bestAccuracy),
    timesPlayed: maxOf(local.timesPlayed, remote.timesPlayed),
    lastPlayedAt: latestIso(local.lastPlayedAt, remote.lastPlayedAt),
  };
}

/**
 * One question type's review state. This is where the rule inverts.
 *
 * THE LOWER BOX WINS, and taking the max here would be a real bug rather than a
 * stylistic choice:
 *
 *   A kid fails a topic on the phone. It drops to box 0, due tomorrow. The
 *   laptop has not synced in a fortnight and still holds "box 4, due in 30
 *   days". Highest-wins keeps box 4 — discarding the fact that they JUST GOT
 *   IT WRONG and pushing the topic a month out.
 *
 * That is precisely the failure spaced repetition exists to prevent, aimed at
 * the kid who needs it most, and it is invisible: no error, no wrong answer on
 * screen, just a topic they cannot do that never comes back.
 *
 * The inverse case costs almost nothing. If the low box is the stale one, the
 * kid sees a topic they already know slightly sooner than needed. Wasting one
 * question is not in the same category as never re-asking a topic they failed,
 * so when the two sides disagree, the pessimistic one wins.
 *
 * `lapses` and `seen` are counters of things that really happened, so they take
 * the higher value regardless of which box won.
 */
export function mergeReviewItem(local: ReviewItem, remote: ReviewItem): ReviewItem {
  const behind = local.box <= remote.box ? local : remote;
  // Same box on both sides: take the earlier due date, for the same reason.
  const dueOn =
    local.box === remote.box
      ? (local.dueOn < remote.dueOn ? local.dueOn : remote.dueOn)
      : behind.dueOn;

  return {
    box: behind.box,
    dueOn,
    lapses: maxOf(local.lapses, remote.lapses),
    seen: maxOf(local.seen, remote.seen),
  };
}

/** Per-key merge over two records, keeping keys present on either side. */
function mergeRecords<T>(
  local: Record<string, T> | undefined,
  remote: Record<string, T> | undefined,
  mergeOne: (a: T, b: T) => T,
): Record<string, T> {
  const out: Record<string, T> = { ...(remote ?? {}) };
  for (const [key, localValue] of Object.entries(local ?? {})) {
    const remoteValue = out[key];
    out[key] = remoteValue === undefined ? localValue : mergeOne(localValue, remoteValue);
  }
  return out;
}

export function mergeLevelProgressMap(
  local: Record<string, LevelProgress> | undefined,
  remote: Record<string, LevelProgress> | undefined,
): Record<string, LevelProgress> {
  return mergeRecords(local, remote, mergeLevelProgress);
}

export function mergeReviewSchedule(
  local: ReviewSchedule | undefined,
  remote: ReviewSchedule | undefined,
): ReviewSchedule {
  return mergeRecords(local, remote, mergeReviewItem);
}

/**
 * Reconciles a whole saved profile.
 *
 * Never returns less than either side had: no level loses stars, no badge is
 * dropped, no total goes down. A device that has been offline for a month can
 * sync without costing anyone anything, which is the property that makes this
 * safe to run automatically.
 */
export function mergeProgress(
  local: PersistedState,
  remote: PersistedState,
  options: MergeOptions,
): PersistedState {
  const prefer = options.preferences === 'local' ? local : remote;
  const other = options.preferences === 'local' ? remote : local;

  return {
    // Whichever side wrote last defines the shape; take the newer schema so a
    // migration is never run backwards.
    version: Math.max(local.version ?? 0, remote.version ?? 0),

    // Preferences: chosen side, falling back when it has nothing to say. A
    // fresh install has an empty name, and letting that win would blank out a
    // real one.
    playerName: prefer.playerName || other.playerName || '',
    selectedGradeId: prefer.selectedGradeId ?? other.selectedGradeId,
    currentWorldId: prefer.currentWorldId || other.currentWorldId,
    reviewMode: prefer.reviewMode ?? other.reviewMode,
    soundEnabled: prefer.soundEnabled ?? other.soundEnabled,

    // Achievement: highest wins, always.
    totalXP: maxOf(local.totalXP, remote.totalXP),
    bestStreakEver: maxOf(local.bestStreakEver, remote.bestStreakEver),
    unlockedBadgeIds: [...new Set([...(local.unlockedBadgeIds ?? []), ...(remote.unlockedBadgeIds ?? [])])],
    levelProgress: mergeLevelProgressMap(local.levelProgress, remote.levelProgress),

    // Review: forgetting wins.
    reviewSchedule: mergeReviewSchedule(local.reviewSchedule, remote.reviewSchedule),
  };
}
