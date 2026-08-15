import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GradeId, LevelRunResult, PersistedState, Question, ScreenId } from '../types/game';
import {
  dueGenerators,
  difficultyForBox,
  recordReview,
  todayIso,
  type ReviewMode,
  type ReviewSchedule,
} from '../lib/review';
import { generateQuestion, parseGeneratedId, hashSeed } from '../data/generators';
import { getLevel, getWorldForLevel, worldsForGrade } from '../data/worlds';
import { attemptSeedFor, resolveLevelQuestions } from '../data/questions';
import { checkBadgeUnlocks } from '../data/badges';
import { isAnswerCorrect, starsForAccuracy, type UserAnswer } from '../lib/scoring';
import { xpForCorrectAnswer, xpForLevelCompletion } from '../lib/xp';
import { migratePersistedState } from './migration';

const SCHEMA_VERSION = 3;

interface RunState {
  levelId: string;
  /**
   * Resolved at start time rather than looked up per render: generated
   * questions only exist for this attempt, so there is nothing to look them up
   * from. Runtime-only, so none of this is persisted.
   */
  questions: Question[];
  /**
   * Whether each question was answered correctly, parallel to `questions`.
   * Needed to update the review schedule per question TYPE at the end of a run
   * — a bare correct count cannot say which skill was the weak one.
   */
  answeredCorrect: boolean[];
  /** A review session rather than a level; scores no stars and no progress. */
  isReview: boolean;
  currentIndex: number;
  correctCount: number;
  streak: number;
  bestStreakThisRun: number;
  xpEarnedThisRun: number;
  lastAnswerCorrect: boolean | null;
}

interface RuntimeState {
  currentScreen: ScreenId;
  selectedWorldId: string | null;
  selectedLevelId: string | null;
  run: RunState | null;
  lastLevelResult: LevelRunResult | null;
}

interface GameActions {
  setPlayerName: (name: string) => void;
  goToWorldMap: () => void;
  selectWorld: (worldId: string) => void;
  selectGrade: (grade: GradeId) => void;
  goToGradeSelect: () => void;
  startReview: () => void;
  setReviewMode: (mode: ReviewMode) => void;
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
    currentWorldId: 'g7-ratios-proportions',
    selectedGradeId: 7,
    soundEnabled: true,
    reviewSchedule: {},
    reviewMode: 'standard',
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


/**
 * Folds one finished run into the review schedule, one entry per question TYPE.
 *
 * A type counts as remembered only if EVERY question of that type in the run
 * was right: meeting three ratio questions and missing one means the skill is
 * not yet solid, and pretending otherwise would push it a week away.
 */
function applyRunToSchedule(
  schedule: ReviewSchedule,
  questions: Question[],
  answeredCorrect: boolean[],
  mode: ReviewMode,
  today: string,
): ReviewSchedule {
  const byGenerator = new Map<string, boolean>();
  questions.forEach((question, i) => {
    const parsed = parseGeneratedId(question.id);
    // Authored questions have no generator to schedule against.
    if (!parsed) return;
    const wasCorrect = answeredCorrect[i] ?? false;
    byGenerator.set(parsed.generatorId, (byGenerator.get(parsed.generatorId) ?? true) && wasCorrect);
  });

  let next = schedule;
  for (const [generatorId, correct] of byGenerator) {
    next = recordReview(next, generatorId, correct, mode, today);
  }
  return next;
}

const REVIEW_SESSION_SIZE = 10;

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

      goToGradeSelect: () => {
        set({ currentScreen: 'grade-select', selectedWorldId: null, selectedLevelId: null });
      },

      selectGrade: (grade) => {
        const first = worldsForGrade(grade)[0];
        set({
          selectedGradeId: grade,
          currentScreen: 'world-map',
          selectedWorldId: null,
          selectedLevelId: null,
          // Park the avatar on this grade's first world rather than leaving it
          // pointing at a world from the grade we just left.
          currentWorldId: first ? first.id : get().currentWorldId,
        });
      },

      selectWorld: (worldId) => {
        set({ selectedWorldId: worldId, currentScreen: 'level-intro' });
      },

      startReview: () => {
        const state = get();
        const today = todayIso();
        const due = dueGenerators(state.reviewSchedule, today).slice(0, REVIEW_SESSION_SIZE);
        if (due.length === 0) return;

        const questions = due.map((generatorId, index) => {
          const box = state.reviewSchedule[generatorId]?.box ?? 0;
          // Seeded from the date and a per-session salt, so two reviews on the
          // same day are not the same ten questions.
          const seed = hashSeed(`${today}:${generatorId}:${index}:${Date.now()}`);
          return generateQuestion(generatorId, difficultyForBox(box), seed);
        });

        set({
          currentScreen: 'gameplay',
          selectedLevelId: null,
          run: {
            levelId: '__review__',
            questions,
            answeredCorrect: [],
            isReview: true,
            currentIndex: 0,
            correctCount: 0,
            streak: 0,
            bestStreakThisRun: 0,
            xpEarnedThisRun: 0,
            lastAnswerCorrect: null,
          },
        });
      },

      setReviewMode: (mode) => set({ reviewMode: mode }),

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
            answeredCorrect: [],
            isReview: false,
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
            answeredCorrect: [...run.answeredCorrect, correct],
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

        const today = todayIso();
        const scheduleAfter = applyRunToSchedule(
          state.reviewSchedule,
          run.questions,
          run.answeredCorrect,
          state.reviewMode,
          today,
        );

        if (run.isReview) {
          // A review session earns its XP but no stars and no level progress —
          // it is not a level, and treating it as one would inflate the map.
          const reviewXp = run.xpEarnedThisRun;
          set({
            reviewSchedule: scheduleAfter,
            totalXP: state.totalXP + reviewXp,
            lastLevelResult: {
              levelId: '__review__',
              correctCount: run.correctCount,
              totalCount: run.questions.length,
              accuracy: run.correctCount / run.questions.length,
              stars: 0,
              xpEarned: reviewXp,
              bestStreak: run.bestStreakThisRun,
              passed: true,
              newlyUnlockedBadgeIds: [],
            },
            currentScreen: 'level-complete',
          });
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

        // Advance the avatar within this level's own grade. Progression never
        // crosses grades: finishing grade 7 should not drag the marker onto the
        // grade 8 map, which the kid may not have chosen to play.
        const world = getWorldForLevel(level.id);
        let newCurrentWorldId = state.currentWorldId;
        if (world && passed) {
          const gradeWorlds = worldsForGrade(world.grade);
          const worldIndex = gradeWorlds.findIndex((w) => w.id === world.id);
          const isFinalLevelOfWorld = level.order === world.levels.length;
          const currentIndex = gradeWorlds.findIndex((w) => w.id === newCurrentWorldId);
          if (isFinalLevelOfWorld && worldIndex < gradeWorlds.length - 1) {
            newCurrentWorldId = gradeWorlds[worldIndex + 1].id;
          } else if (currentIndex < worldIndex) {
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
          reviewSchedule: scheduleAfter,
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
        const world = getWorldForLevel(level.id);
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
        selectedGradeId: state.selectedGradeId,
        soundEnabled: state.soundEnabled,
        reviewSchedule: state.reviewSchedule,
        reviewMode: state.reviewMode,
      }),
      migrate: (persistedState, fromVersion) =>
        migratePersistedState(persistedState as Partial<PersistedState>, fromVersion) as GameStore,
    },
  ),
);
