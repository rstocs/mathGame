/**
 * Who the save on THIS device belongs to.
 *
 * One browser holds one localStorage save, so when two children share a laptop
 * the question "is this progress yours?" has to be answered before any syncing
 * happens. Getting it wrong is not cosmetic: merging one sibling's progress
 * into the other's account writes it into their cloud record permanently, and
 * from then on both accounts claim the same work.
 *
 * The rule is deliberately blunt: a save is only ever merged when it demonstrably
 * belongs to the account signing in. Anything else starts clean.
 *
 *   The save is already this user's  -> merge. This is what lets a kid play
 *                                       offline on their own device and keep it.
 *   Anything else                    -> archive it and start fresh.
 *
 * "Anything else" covers both a brand new account and a second child on a shared
 * laptop, and treating them the same is the point. The alternative was asking
 * whose the progress was, which put a question a nine-year-old cannot reliably
 * answer in front of the one action that can absorb a sibling's work forever.
 * A predictable empty start is worth more than a clever guess.
 *
 * Archiving rather than clearing follows the same rule as everything else here:
 * nothing a child earned is deleted, even when it is in the way and even when
 * nobody intends to go back for it.
 */

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
 * Copies the current save aside before it is replaced.
 *
 * Whatever is here is about to be pushed out of the only place it exists — a
 * kid who played without an account has no cloud copy to fall back on. Starting
 * fresh is the intended behaviour; destroying their afternoon on the way is not,
 * so it is kept under a dated key and can be recovered by hand.
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
  /** This device's save is already theirs: merge it with the cloud. */
  | { kind: 'merge' }
  /** Not theirs, or nobody's: set it aside and begin empty. */
  | { kind: 'fresh-start' };

export function decideOnSignIn(args: { userId: string; owner: string | null }): SignInDecision {
  // Only a save this exact account has claimed before is merged. Unclaimed
  // progress is not assumed to be theirs, however tempting: on a shared device
  // that assumption writes one child's work into another's account for good,
  // and there is no undo once both accounts claim it.
  return args.owner === args.userId ? { kind: 'merge' } : { kind: 'fresh-start' };
}
