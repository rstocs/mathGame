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
