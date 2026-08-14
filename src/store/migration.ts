import type { PersistedState } from '../types/game';
import { getWorld } from '../data/worlds';

/**
 * Upgrades an older save in place.
 *
 * Kept out of gameStore.ts so it can be tested directly: a broken migration
 * silently throws away a kid's progress, and that is not something to find out
 * from a bug report.
 */
export function migratePersistedState(
  persisted: Partial<PersistedState>,
  fromVersion: number,
): Partial<PersistedState> {
  const state = { ...persisted };

  if (fromVersion < 2) {
    // v1 stored currentWorldId as a bare strand ('geometry'). Worlds are now
    // keyed per grade ('g7-geometry'), so an un-migrated save points at a world
    // that no longer exists.
    //
    // Check against the real world list rather than sniffing the prefix:
    // 'geometry' starts with "g" just like 'g7-geometry' does, so a
    // startsWith('g') guard silently skips exactly the strand it should have
    // rewritten.
    const worldId = state.currentWorldId;
    if (typeof worldId === 'string' && !getWorld(worldId) && getWorld(`g7-${worldId}`)) {
      state.currentWorldId = `g7-${worldId}`;
    }

    // v1 predates grades entirely; everyone who played it was on grade 7.
    state.selectedGradeId ??= 7;
  }

  return state;
}
