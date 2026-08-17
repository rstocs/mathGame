/**
 * Who the save on THIS device belongs to.
 *
 * One browser holds one localStorage save, so when two children share a laptop
 * the question "is this progress yours?" has to be answered before any syncing
 * happens. Getting it wrong is not cosmetic: merging one sibling's progress
 * into the other's account writes it into their cloud record permanently, and
 * from then on both accounts claim the same work.
 *
 * Three situations, and only one of them needs a human:
 *
 *   The save is already this user's   -> merge, silently. The normal case.
 *   The save belongs to someone else  -> archive it and start clean. No
 *                                        question needed: we know it is not
 *                                        theirs.
 *   Nobody has claimed the save       -> genuinely ambiguous. Somebody played
 *                                        here without an account, and only a
 *                                        person knows whether that was them.
 *
 * Archiving rather than clearing follows the same rule as everything else here:
 * nothing a child earned is ever deleted, even when it is in the way.
 */

import type { PersistedState } from '../types/game';

const OWNER_KEY = 'math-adventure-owner';
const SAVE_KEY = 'math-adventure-save';
const ARCHIVE_PREFIX = 'math-adventure-archive:';

/** The user id this device's save belongs to, or null if never claimed. */
export function getLocalOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function setLocalOwner(userId: string): void {
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {
    // A browser refusing localStorage is not a reason to stop the game.
  }
}

export function clearLocalOwner(): void {
  try {
    localStorage.removeItem(OWNER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Whether there is anything here worth asking about.
 *
 * A save with no XP and no level ever finished is an empty install, not
 * somebody's work. Interrupting a kid to ask whether they want to keep nothing
 * would be noise, and worse, would train them to click through the one question
 * that actually matters.
 */
export function hasMeaningfulProgress(state: Pick<PersistedState, 'totalXP' | 'levelProgress'>): boolean {
  return (state.totalXP ?? 0) > 0 || Object.keys(state.levelProgress ?? {}).length > 0;
}

/**
 * Copies the current save aside before it is replaced.
 *
 * The case this exists for: one child played without an account, another signs
 * in on the same device. The first child's progress is about to be pushed out
 * of the only place it exists. It is not ours to delete, so it is kept under a
 * dated key where it can be recovered by hand.
 */
export function archiveLocalSave(reason: string): string | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const key = `${ARCHIVE_PREFIX}${new Date().toISOString()}:${reason}`;
    localStorage.setItem(key, raw);
    return key;
  } catch {
    return null;
  }
}

/** Archive keys, newest first. Exposed so a parent can be pointed at them. */
export function listArchivedSaves(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(ARCHIVE_PREFIX)) keys.push(key);
    }
    return keys.sort().reverse();
  } catch {
    return [];
  }
}

/**
 * What should happen when `userId` signs in on a device holding `local`.
 *
 * Pure, so the decision can be tested without a browser or a network. The
 * consequences of each branch are severe enough that the reasoning should not
 * be buried inside an effect.
 */
export type SignInDecision =
  /** Same person as last time: merge their device and cloud state. */
  | { kind: 'merge' }
  /** Known to be someone else's save: keep it safe, start this account clean. */
  | { kind: 'switch-user' }
  /** Unclaimed progress exists. Only a human can say whose it is. */
  | { kind: 'ask' };

export function decideOnSignIn(args: {
  userId: string;
  owner: string | null;
  localHasProgress: boolean;
}): SignInDecision {
  const { userId, owner, localHasProgress } = args;
  if (owner === userId) return { kind: 'merge' };
  if (owner !== null) return { kind: 'switch-user' };
  // Nobody has claimed this save. With nothing in it, there is nothing to
  // claim and nothing to ask about.
  return localHasProgress ? { kind: 'ask' } : { kind: 'merge' };
}
