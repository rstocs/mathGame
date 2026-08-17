import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore, defaultPersistedState } from './gameStore';

/**
 * Where each action leaves the kid.
 *
 * Screen routing is easy to get wrong in a way no type checks and no test
 * notices, because every screen renders fine — just the wrong one at the wrong
 * moment. These pin the two transitions that decide what a new player sees
 * first.
 */

beforeEach(() => {
  useGameStore.setState({ ...defaultPersistedState(), currentScreen: 'onboarding' });
});

describe('a new player', () => {
  it('goes to the grade picker after entering a name, not to a map', () => {
    // Landing them on the map means silently choosing grade 7 for them. A 5th
    // grader would meet material two years ahead and a 10th grader three years
    // behind, with nothing saying a choice had been made or could be changed.
    useGameStore.getState().setPlayerName('Testy');

    expect(useGameStore.getState().currentScreen).toBe('grade-select');
    expect(useGameStore.getState().playerName).toBe('Testy');
  });

  it('still gets a name when they submit an empty one', () => {
    useGameStore.getState().setPlayerName('   ');
    expect(useGameStore.getState().playerName).toBe('Explorer');
    expect(useGameStore.getState().currentScreen).toBe('grade-select');
  });

  it('reaches the map once they pick a grade', () => {
    useGameStore.getState().setPlayerName('Testy');
    useGameStore.getState().selectGrade(9);

    const state = useGameStore.getState();
    expect(state.currentScreen).toBe('world-map');
    expect(state.selectedGradeId).toBe(9);
    // The avatar must not be left standing on a world from another grade.
    expect(state.currentWorldId.startsWith('g9-')).toBe(true);
  });
});

describe('reaching the account screen', () => {
  it('is reachable from anywhere with a TopBar', () => {
    useGameStore.setState({ currentScreen: 'world-map' });
    useGameStore.getState().goToAccount();
    expect(useGameStore.getState().currentScreen).toBe('account');
  });

  it('clears any selected world or level on the way', () => {
    // Otherwise backing out of Account lands on a level intro the kid never
    // asked for, because the selection outlived the screen that made it.
    useGameStore.setState({ selectedWorldId: 'g7-ratios-proportions', selectedLevelId: 'rp-l1' });
    useGameStore.getState().goToAccount();

    const state = useGameStore.getState();
    expect(state.selectedWorldId).toBeNull();
    expect(state.selectedLevelId).toBeNull();
  });

  it('goes back to the map', () => {
    useGameStore.getState().goToAccount();
    useGameStore.getState().goToWorldMap();
    expect(useGameStore.getState().currentScreen).toBe('world-map');
  });
});

describe('getting back to the sign-in screen', () => {
  it('is possible after choosing to play without an account', () => {
    // Without this the choice was permanent short of clearing browser storage,
    // which is not something to ask of a child — and the account screen said
    // "an account would let your progress follow you" while offering no way to
    // make one.
    expect(useGameStore.getState().wantsSignIn).toBe(false);
    useGameStore.getState().showSignIn();
    expect(useGameStore.getState().wantsSignIn).toBe(true);
  });

  it('stops asking once the screen has been dealt with', () => {
    useGameStore.getState().showSignIn();
    useGameStore.getState().dismissSignIn();
    expect(useGameStore.getState().wantsSignIn).toBe(false);
  });

  // That it is never persisted is enforced by the compiler instead: partialize
  // declares a PersistedState return, so adding a runtime field to it is an
  // excess-property error rather than something a test has to notice.
});
