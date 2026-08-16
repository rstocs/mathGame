/**
 * Keeps the store and the database loosely in step.
 *
 * "Loosely" is the design, not a compromise. localStorage remains the thing the
 * game plays from; the cloud is a copy that lets progress follow a kid between
 * devices. So every path here can fail without stopping anyone practising, and
 * the status it reports is for a quiet line of text rather than a dialog.
 *
 * Sync is whole-state, not a queue of changes. That is what makes it safe to
 * drop a failed sync on the floor: the next one carries everything, and the
 * merge means a late write can only ever raise a value.
 */

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { getSession, onAuthChange } from './auth';
import { debounce, pullAndMerge, pushProgress } from './progressSync';
import { isCloudEnabled } from './supabase';
import type { PersistedState } from '../types/game';

export type SyncStatus = 'off' | 'signed-out' | 'syncing' | 'synced' | 'error';

/** The persisted slice, which is the only part worth sending anywhere. */
function persistedSlice(state: ReturnType<typeof useGameStore.getState>): PersistedState {
  return {
    version: state.version,
    playerName: state.playerName,
    totalXP: state.totalXP,
    bestStreakEver: state.bestStreakEver,
    unlockedBadgeIds: state.unlockedBadgeIds,
    levelProgress: state.levelProgress,
    currentWorldId: state.currentWorldId,
    selectedGradeId: state.selectedGradeId,
    soundEnabled: state.soundEnabled,
    reviewSchedule: state.reviewSchedule,
    reviewMode: state.reviewMode,
  };
}

/** Fields worth a round trip. Screen changes and in-progress runs are not. */
function syncKey(state: PersistedState): string {
  return JSON.stringify([
    state.totalXP,
    state.bestStreakEver,
    state.unlockedBadgeIds,
    state.levelProgress,
    state.reviewSchedule,
    state.reviewMode,
    state.selectedGradeId,
    state.playerName,
  ]);
}

export function useCloudSync(): { status: SyncStatus; userId: string | null } {
  const [status, setStatus] = useState<SyncStatus>(isCloudEnabled() ? 'signed-out' : 'off');
  const [userId, setUserId] = useState<string | null>(null);
  const lastPushed = useRef<string | null>(null);

  // Pull once per sign-in, and follow sign-out.
  useEffect(() => {
    if (!isCloudEnabled()) return;
    let cancelled = false;

    async function adopt(id: string | null) {
      if (cancelled) return;
      setUserId(id);
      if (!id) {
        setStatus('signed-out');
        return;
      }
      setStatus('syncing');
      try {
        const merged = await pullAndMerge(id, persistedSlice(useGameStore.getState()));
        if (cancelled) return;
        useGameStore.setState(merged);
        // Seed the change detector with what we just adopted, so arriving does
        // not immediately look like a local edit and bounce straight back up.
        lastPushed.current = syncKey(merged);
        setStatus('synced');
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    void getSession().then((session) => adopt(session?.user.id ?? null));
    const unsubscribe = onAuthChange((session) => void adopt(session?.user.id ?? null));

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Push after changes settle.
  useEffect(() => {
    if (!isCloudEnabled() || !userId) return;

    const push = debounce(async (state: PersistedState) => {
      const key = syncKey(state);
      if (key === lastPushed.current) return;
      setStatus('syncing');
      const result = await pushProgress(userId, state);
      if (result.ok) {
        lastPushed.current = key;
        setStatus('synced');
      } else {
        // Left unrecorded on purpose, so the next change retries this state
        // rather than treating it as already saved.
        setStatus('error');
      }
      // Finishing a level moves XP, progress, badges and the review schedule at
      // once. Two seconds turns that into one write, and is short enough that
      // closing the tab afterwards rarely loses the round trip.
    }, 2000);

    return useGameStore.subscribe((state) => push(persistedSlice(state)));
  }, [userId]);

  return { status, userId };
}
