import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LevelRunResult, PersistedState, Question, ScreenId, StrandId } from '../types/game';
import { worlds, getLevel } from '../data/worlds';
import { attemptSeedFor, resolveLevelQuestions } from '../data/questions';
import { checkBadgeUnlocks } from '../data/badges';
import { isAnswerCorrect, starsForAccuracy, type UserAnswer } from '../lib/scoring';
import { xpForCorrectAnswer, xpForLevelCompletion } from '../lib/xp';

const SCHEMA_VERSION = 1;

interface RunState {
  levelId: string;
  /**
   * Resolved at start time rather than looked up per render: generated
   * questions only exist for this attempt, so there is nothing to look them up
   * from. Runtime-only, so none of this is persisted.
   */
  questions: Question[];
  currentIndex: number;
  correctCount: number;
  streak: number;
  bestStreakThisRun: number;
  xpEarnedThisRun: number;
  lastAnswerCorrect: boolean | null;
}

interface RuntimeState {
  currentScreen: ScreenId;
  selectedWorldId: StrandId | null;
  selectedLevelId: string | null;
  run: RunState | null;
  lastLevelResult: LevelRunResult | null;
}

interface GameActions {
  setPlayerName: (name: string) => void;
  goToWorldMap: () => void;
  selectWorld: (worldId: StrandId) => void;
  startLevel: (levelId: string) => void;
  submitAnswer: (answer: UserAnswer) => { correct: boolean; xpGained: number };
  advanceAfterFeedback: () => void;
  retryLevel: () => void;
  goToNextLevel: () => void;
  toggleSound: () => void;
  resetProgress: () => void;
}

export type GameStore = PersistedState & RuntimeState & GameActions;

function defaultPersistedState(): PersistedState {
  return {
    version: SCHEMA_VERSION,
    playerName: '',
    totalXP: 0,
    bestStreakEver: 0,
    unlockedBadgeIds: [],
    levelProgress: {},
    currentWorldId: 'ratios-proportions',
    soundEnabled: true,
  };
}

function readInitialScreen(): ScreenId {
  try {
    const raw = localStorage.getItem('math-adventure-save');
    if (!raw) return 'onboarding';
    const parsed = JSON.parse(raw);
    return parsed?.state?.playerName ? 'world-map' : 'onboarding';
  } catch {
    return 'onboarding';
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...defaultPersistedState(),
      currentScreen: readInitialScreen(),
      selectedWorldId: null,
      selectedLevelId: null,
      run: null,
      lastLevelResult: null,

      setPlayerName: (name) => {
        set({ playerName: name.trim() || 'Explorer', currentScreen: 'world-map' });
      },

      goToWorldMap: () => {
        set({ currentScreen: 'world-map', selectedWorldId: null, selectedLevelId: null });
      },

      selectWorld: (worldId) => {
        set({ selectedWorldId: worldId, currentScreen: 'level-intro' });
      },

      startLevel: (levelId) => {
        const level = getLevel(levelId);
        if (!level) return;
        // Seed off the attempt count so each replay rerolls the generated
        // slots; the authored questions are unaffected.
        const attempt = (get().levelProgress[levelId]?.timesPlayed ?? 0) + 1;
        set({
          selectedLevelId: levelId,
          currentScreen: 'gameplay',
          run: {
            levelId,
            questions: resolveLevelQuestions(level, attemptSeedFor(levelId, attempt)),
            currentIndex: 0,
            correctCount: 0,
            streak: 0,
            bestStreakThisRun: 0,
            xpEarnedThisRun: 0,
            lastAnswerCorrect: null,
          },
        });
      },

      submitAnswer: (answer) => {
        const state = get();
        const run = state.run;
        if (!run) return { correct: false, xpGained: 0 };
        const question = run.questions[run.currentIndex];
        const correct = isAnswerCorrect(question, answer);

        const newStreak = correct ? run.streak + 1 : 0;
        const xpGained = correct ? xpForCorrectAnswer(run.streak) : 0;

        set({
          run: {
            ...run,
            correctCount: run.correctCount + (correct ? 1 : 0),
            streak: newStreak,
            bestStreakThisRun: Math.max(run.bestStreakThisRun, newStreak),
            xpEarnedThisRun: run.xpEarnedThisRun + xpGained,
            lastAnswerCorrect: correct,
          },
          bestStreakEver: Math.max(state.bestStreakEver, newStreak),
        });

        return { correct, xpGained };
      },

      advanceAfterFeedback: () => {
        const state = get();
        const run = state.run;
        if (!run) return;

        const isLastQuestion = run.currentIndex >= run.questions.length - 1;
        if (!isLastQuestion) {
          set({ run: { ...run, currentIndex: run.currentIndex + 1, lastAnswerCorrect: null } });
          return;
        }

        const level = getLevel(run.levelId);
        if (!level) return;

        const accuracy = run.correctCount / run.questions.length;
        const stars = starsForAccuracy(accuracy, level.passThreshold);
        const passed = accuracy >= level.passThreshold;
        const completionBonus = xpForLevelCompletion(stars);
        const totalXpEarned = run.xpEarnedThisRun + completionBonus;

        const existingProgress = state.levelProgress[level.id];
        const newLevelProgress = {
          ...state.levelProgress,
          [level.id]: {
            stars: (Math.max(existingProgress?.stars ?? 0, stars) as 0 | 1 | 2 | 3),
            bestAccuracy: Math.max(existingProgress?.bestAccuracy ?? 0, accuracy),
            timesPlayed: (existingProgress?.timesPlayed ?? 0) + 1,
            lastPlayedAt: new Date().toISOString(),
          },
        };

        const world = worlds.find((w) => w.id === level.strand);
        let newCurrentWorldId = state.currentWorldId;
        if (world && passed) {
          const worldIndex = worlds.findIndex((w) => w.id === world.id);
          const isFinalLevelOfWorld = level.order === world.levels.length;
          if (isFinalLevelOfWorld && worldIndex < worlds.length - 1) {
            newCurrentWorldId = worlds[worldIndex + 1].id;
          } else if (worlds.findIndex((w) => w.id === newCurrentWorldId) < worldIndex) {
            newCurrentWorldId = world.id;
          }
        }

        const newTotalXP = state.totalXP + totalXpEarned;

        const stateForBadgeCheck: PersistedState = {
          ...state,
          totalXP: newTotalXP,
          levelProgress: newLevelProgress,
          currentWorldId: newCurrentWorldId,
        };
        const newlyUnlockedBadgeIds = checkBadgeUnlocks(stateForBadgeCheck);

        const result: LevelRunResult = {
          levelId: level.id,
          correctCount: run.correctCount,
          totalCount: run.questions.length,
          accuracy,
          stars,
          xpEarned: totalXpEarned,
          bestStreak: run.bestStreakThisRun,
          passed,
          newlyUnlockedBadgeIds,
        };

        set({
          totalXP: newTotalXP,
          levelProgress: newLevelProgress,
          currentWorldId: newCurrentWorldId,
          unlockedBadgeIds: [...state.unlockedBadgeIds, ...newlyUnlockedBadgeIds],
          lastLevelResult: result,
          currentScreen: 'level-complete',
        });
      },

      retryLevel: () => {
        const levelId = get().selectedLevelId;
        if (levelId) get().startLevel(levelId);
      },

      goToNextLevel: () => {
        const level = getLevel(get().selectedLevelId ?? '');
        if (!level) return;
        const world = worlds.find((w) => w.id === level.strand);
        if (!world) return;
        const nextLevel = world.levels.find((l) => l.order === level.order + 1);
        if (nextLevel) {
          get().startLevel(nextLevel.id);
        } else {
          get().goToWorldMap();
        }
      },

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      resetProgress: () => {
        set({
          ...defaultPersistedState(),
          currentScreen: 'onboarding',
          selectedWorldId: null,
          selectedLevelId: null,
          run: null,
          lastLevelResult: null,
        });
      },
    }),
    {
      name: 'math-adventure-save',
      version: SCHEMA_VERSION,
      partialize: (state) => ({
        version: state.version,
        playerName: state.playerName,
        totalXP: state.totalXP,
        bestStreakEver: state.bestStreakEver,
        unlockedBadgeIds: state.unlockedBadgeIds,
        levelProgress: state.levelProgress,
        currentWorldId: state.currentWorldId,
        soundEnabled: state.soundEnabled,
      }),
      migrate: (persistedState) => persistedState as GameStore,
    },
  ),
);
