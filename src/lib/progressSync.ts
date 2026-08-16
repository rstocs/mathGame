/**
 * Moving one kid's progress between this device and the database.
 *
 * Two rules shape everything here.
 *
 * **localStorage stays the source of truth for playing.** The cloud is a copy
 * that lets progress follow a kid between their phone and their laptop. The
 * game must remain fully playable with no network, no account, and no Supabase
 * project at all — so every function in this file is allowed to fail, and
 * failing means "not synced yet", never "cannot play".
 *
 * **Nothing is ever deleted.** Resetting progress writes zeroes; it does not
 * remove rows. The tables grant no DELETE to anyone, so an accidental delete is
 * refused by the database as well as absent from the code.
 *
 * All reconciliation happens in mergeProgress.ts, which is pure and tested. The
 * job here is only to translate between rows and the store's shape.
 */

import type { GradeId, LevelProgress, PersistedState } from '../types/game';
import type { ReviewMode, ReviewSchedule } from './review';
import { mergeProgress } from './mergeProgress';
import { requireSupabase, supabase } from './supabase';

/** Shape of what the database holds for one kid, before merging. */
interface RemoteProfile {
  playerName: string;
  selectedGradeId: GradeId;
  currentWorldId: string;
  soundEnabled: boolean;
  reviewMode: ReviewMode;
  version: number;
  totalXP: number;
  bestStreakEver: number;
  unlockedBadgeIds: string[];
  levelProgress: Record<string, LevelProgress>;
  reviewSchedule: ReviewSchedule;
}

export interface SyncResult {
  ok: boolean;
  /** Present when the sync failed; suitable for a quiet status line, not a modal. */
  error?: string;
}

/** The signed-in user's id, or null when signed out or cloud is off. */
export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Reads everything the database holds for this kid.
 *
 * Returns null when there is nothing yet, which is the normal state for a
 * newly created account rather than an error.
 */
export async function loadRemoteProfile(userId: string): Promise<RemoteProfile | null> {
  const db = requireSupabase();

  // Four reads in parallel: they are independent, and the round trip dominates.
  const [profile, stats, levels, schedule] = await Promise.all([
    db.from('profiles').select('*').eq('id', userId).maybeSingle(),
    db.from('stats').select('*').eq('user_id', userId).maybeSingle(),
    db.from('level_progress').select('*').eq('user_id', userId),
    db.from('review_schedule').select('*').eq('user_id', userId),
  ]);

  const firstError = profile.error ?? stats.error ?? levels.error ?? schedule.error;
  if (firstError) throw new Error(firstError.message);
  if (!profile.data) return null;

  const levelProgress: Record<string, LevelProgress> = {};
  for (const row of levels.data ?? []) {
    levelProgress[row.level_id] = {
      stars: row.stars as LevelProgress['stars'],
      bestAccuracy: row.best_accuracy ?? 0,
      timesPlayed: row.times_played ?? 0,
      lastPlayedAt: row.last_played_at ?? '',
    };
  }

  const reviewSchedule: ReviewSchedule = {};
  for (const row of schedule.data ?? []) {
    reviewSchedule[row.generator_id] = {
      box: row.box ?? 0,
      dueOn: row.due_on,
      lapses: row.lapses ?? 0,
      seen: row.seen ?? 0,
    };
  }

  return {
    playerName: profile.data.player_name ?? '',
    selectedGradeId: (profile.data.selected_grade ?? 7) as GradeId,
    currentWorldId: profile.data.current_world_id ?? 'g7-ratios-proportions',
    soundEnabled: profile.data.sound_enabled ?? true,
    reviewMode: (profile.data.review_mode ?? 'standard') as ReviewMode,
    version: profile.data.schema_version ?? 1,
    totalXP: Number(stats.data?.total_xp ?? 0),
    bestStreakEver: stats.data?.best_streak_ever ?? 0,
    unlockedBadgeIds: stats.data?.unlocked_badge_ids ?? [],
    levelProgress,
    reviewSchedule,
  };
}

/**
 * Pulls the cloud copy down and reconciles it with what is on this device.
 *
 * Preferences come from the cloud here: signing in on a new phone should bring
 * the kid's name and grade with them, and this device's values are install
 * defaults that would otherwise overwrite the real ones.
 */
export async function pullAndMerge(userId: string, local: PersistedState): Promise<PersistedState> {
  const remote = await loadRemoteProfile(userId);
  if (!remote) return local;
  return mergeProgress(local, { ...local, ...remote }, { preferences: 'remote' });
}

/**
 * Writes this device's state up, after merging with whatever is already there.
 *
 * The merge before the write is the important part. Without it, a device that
 * had been offline would push its own stale totals over newer ones from another
 * device — the "stale client clobbers achievement" failure. Merging first means
 * a write can only ever raise a value, so the order two devices happen to sync
 * in stops mattering.
 */
export async function pushProgress(userId: string, local: PersistedState): Promise<SyncResult> {
  const db = requireSupabase();

  try {
    const remote = await loadRemoteProfile(userId);
    const merged = remote
      ? mergeProgress(local, { ...local, ...remote }, { preferences: 'local' })
      : local;

    const now = new Date().toISOString();

    // PromiseLike, not Promise: supabase-js query builders are thenable but
    // are not Promises, so awaiting them works while typing them as Promise
    // does not.
    const writes: PromiseLike<{ error: { message: string } | null }>[] = [
      db.from('profiles').upsert({
        id: userId,
        player_name: merged.playerName,
        selected_grade: merged.selectedGradeId,
        current_world_id: merged.currentWorldId,
        sound_enabled: merged.soundEnabled,
        review_mode: merged.reviewMode,
        schema_version: merged.version,
        updated_at: now,
      }),
      db.from('stats').upsert({
        user_id: userId,
        total_xp: merged.totalXP,
        best_streak_ever: merged.bestStreakEver,
        unlocked_badge_ids: merged.unlockedBadgeIds,
        updated_at: now,
      }),
    ];

    const levelRows = Object.entries(merged.levelProgress).map(([levelId, p]) => ({
      user_id: userId,
      level_id: levelId,
      stars: p.stars,
      best_accuracy: p.bestAccuracy,
      times_played: p.timesPlayed,
      last_played_at: p.lastPlayedAt || null,
      updated_at: now,
    }));
    if (levelRows.length) writes.push(db.from('level_progress').upsert(levelRows));

    const scheduleRows = Object.entries(merged.reviewSchedule).map(([generatorId, r]) => ({
      user_id: userId,
      generator_id: generatorId,
      box: r.box,
      due_on: r.dueOn,
      lapses: r.lapses,
      seen: r.seen,
      updated_at: now,
    }));
    if (scheduleRows.length) writes.push(db.from('review_schedule').upsert(scheduleRows));

    const results = await Promise.all(writes);
    const failed = results.find((r) => r.error);
    if (failed?.error) return { ok: false, error: failed.error.message };

    return { ok: true };
  } catch (error) {
    // A failed sync is not a failed session. The kid keeps playing from
    // localStorage and the next push carries everything anyway, because the
    // merge is over whole state rather than a queue of changes.
    return { ok: false, error: error instanceof Error ? error.message : 'Sync failed' };
  }
}

/**
 * Coalesces bursts of writes into one.
 *
 * Finishing a level updates XP, progress, badges and the review schedule at
 * once; without this that is four round trips for one event.
 */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
