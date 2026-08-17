import { describe, it, expect } from 'vitest';
import { decideOnSignIn } from './localOwner';

/**
 * A new account starts empty. The only save ever merged is one this exact
 * account already owned.
 *
 * The rule is blunt on purpose. Guessing that unclaimed progress belongs to
 * whoever is signing in is wrong in a way that cannot be undone: on a shared
 * laptop it writes one child's work into another child's cloud record, and
 * afterwards both accounts claim it with nothing to say which was whose.
 */

describe('what a sign-in does to the save on this device', () => {
  it('merges when the account already owns this save', () => {
    // The case worth protecting: a kid played offline on their own device.
    // That work is theirs and must survive the next sign-in.
    expect(decideOnSignIn({ userId: 'alice', owner: 'alice' })).toEqual({ kind: 'merge' });
  });

  it('starts fresh for a brand new account', () => {
    // Nobody has claimed this device, so nothing here is known to belong to
    // the account being created.
    expect(decideOnSignIn({ userId: 'newcomer', owner: null })).toEqual({ kind: 'fresh-start' });
  });

  it('never absorbs a sibling\'s progress', () => {
    // Alice has been playing here. Ben signs in on the same laptop. Merging
    // would put her stars in his account permanently.
    expect(decideOnSignIn({ userId: 'ben', owner: 'alice' })).toEqual({ kind: 'fresh-start' });
  });

  it('does not depend on how much progress is sitting there', () => {
    // Deliberately not a factor. A rule that behaves differently for a big save
    // than a small one is a rule nobody can predict, and the dangerous case is
    // precisely the one with lots of progress in it.
    expect(decideOnSignIn({ userId: 'ben', owner: 'alice' }).kind).toBe('fresh-start');
    expect(decideOnSignIn({ userId: 'ben', owner: null }).kind).toBe('fresh-start');
  });
});
