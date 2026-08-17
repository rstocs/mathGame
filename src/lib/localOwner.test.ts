import { describe, it, expect } from 'vitest';
import { decideOnSignIn, hasMeaningfulProgress } from './localOwner';

/**
 * Two children share a laptop. Every wrong answer here is silent and, in one
 * direction, permanent: merging one sibling's progress into the other's account
 * writes it into their cloud record, and afterwards both accounts claim the
 * same work with no way to tell which was whose.
 */

describe('deciding what a sign-in means for the save on this device', () => {
  it('merges when the same person signs back in', () => {
    expect(decideOnSignIn({ userId: 'alice', owner: 'alice', localHasProgress: true }))
      .toEqual({ kind: 'merge' });
  });

  it('never merges one sibling\'s progress into the other\'s account', () => {
    // Alice has been playing here and is signed in. Ben signs in on the same
    // laptop. We KNOW this save is not his, so there is nothing to ask: keep
    // Alice's work safe and give Ben a clean start.
    expect(decideOnSignIn({ userId: 'ben', owner: 'alice', localHasProgress: true }))
      .toEqual({ kind: 'switch-user' });
  });

  it('asks when nobody has claimed the progress', () => {
    // Somebody played here without an account. Only a person knows whether that
    // was the one now signing in, and guessing either way is destructive: guess
    // "theirs" and a sibling's work is absorbed; guess "not theirs" and the kid
    // who just played loses the account they were making to keep it.
    expect(decideOnSignIn({ userId: 'ben', owner: null, localHasProgress: true }))
      .toEqual({ kind: 'ask' });
  });

  it('does not ask about an empty save', () => {
    // Asking whether they want to keep nothing is noise, and trains a kid to
    // click through the one question that matters.
    expect(decideOnSignIn({ userId: 'ben', owner: null, localHasProgress: false }))
      .toEqual({ kind: 'merge' });
  });

  it('treats a fresh install with an owner as a user switch, not a merge', () => {
    // The save was cleared but the owner marker survived. Still not this user's
    // device-state to absorb.
    expect(decideOnSignIn({ userId: 'ben', owner: 'alice', localHasProgress: false }))
      .toEqual({ kind: 'switch-user' });
  });
});

describe('what counts as progress worth asking about', () => {
  it('counts earned XP', () => {
    expect(hasMeaningfulProgress({ totalXP: 30, levelProgress: {} })).toBe(true);
  });

  it('counts a level that was played, even for no XP', () => {
    expect(
      hasMeaningfulProgress({
        totalXP: 0,
        levelProgress: { 'rp-l1': { stars: 0, bestAccuracy: 0.2, timesPlayed: 1, lastPlayedAt: '' } },
      }),
    ).toBe(true);
  });

  it('does not count an untouched install', () => {
    expect(hasMeaningfulProgress({ totalXP: 0, levelProgress: {} })).toBe(false);
  });
});
