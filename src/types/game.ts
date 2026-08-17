import type { ReviewMode, ReviewSchedule } from '../lib/review';

/**
 * The strand a world belongs to. This drives theming and icons, and is shared
 * across grades — grade 7 and grade 8 geometry both use the geometry theme.
 */
export type StrandId =
  | 'ratios-proportions'
  | 'number-system'
  | 'expressions-equations'
  | 'geometry'
  | 'statistics-probability';

/**
 * Massachusetts frameworks grade. The high-school years follow the MA model
 * course sequence: 9 is Algebra I, 10 is Geometry, 11 is Algebra II.
 */
export type GradeId = 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const GRADE_IDS: GradeId[] = [5, 6, 7, 8, 9, 10, 11];

export type QuestionType =
  | 'multiple-choice'
  | 'numeric'
  | 'drag-drop-order'
  | 'drag-drop-match'
  | 'graph-plot'
  | 'expression';

export type VisualHint =
  | { kind: 'circle'; radiusLabel: string }
  | { kind: 'rectangle'; widthLabel: string; heightLabel: string }
  | { kind: 'number-line'; from: number; to: number; markAt?: number }
  | { kind: 'fraction-bars'; numerator: number; denominator: number }
  | { kind: 'bar-chart'; data: { label: string; value: number }[] };

export interface BaseQuestion {
  id: string;
  strand: StrandId;
  type: QuestionType;
  prompt: string;
  explanation: string;
  /**
   * Shown *before* the kid answers, for a question that uses an idea or a
   * notation they may not have met yet. The `explanation` teaches after the
   * fact, which is right for reinforcing a known skill and wrong for
   * introducing a new one — without a primer a kid meeting "f(x)" or
   * "derivative" for the first time can only guess, then be told they were
   * wrong. Keep it to a couple of sentences: define the word, show the
   * notation, and say nothing that gives the answer away.
   */
  /**
   * Question types this hand-written question actually practises, as generator
   * ids. Only for authored questions — a generated one already knows its own
   * type from its id.
   *
   * This is what lets a miss send back the RIGHT topic. Without it the only
   * options are guessing from the level (which re-drills topics the kid got
   * right) or ignoring the miss entirely (which is worse). Two ids means the
   * question genuinely needs both, not that we could not decide.
   */
  topics?: string[];
  primer?: string;
  imageHint?: VisualHint;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  choices: string[];
  correctIndex: number;
}

export interface NumericQuestion extends BaseQuestion {
  type: 'numeric';
  correctAnswer: number;
  tolerance?: number;
  unit?: string;
}

export interface DragDropOrderQuestion extends BaseQuestion {
  type: 'drag-drop-order';
  items: string[];
  correctOrder: string[];
}

export interface DragDropMatchQuestion extends BaseQuestion {
  type: 'drag-drop-match';
  pairs: { left: string; right: string }[];
}

export interface GridPoint {
  x: number;
  y: number;
}

/** What the kid is asked to place on the coordinate plane. */
export type GraphPlotMode =
  /** Tap to place one or more independent points (scatter, plotting a pair). */
  | { kind: 'points'; count: number }
  /** Place two points; the answer is the line through them (slope/intercept). */
  | { kind: 'line' };

export interface GraphPlotQuestion extends BaseQuestion {
  type: 'graph-plot';
  mode: GraphPlotMode;
  /** Inclusive axis bounds, in grid units. */
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  /**
   * For 'points': the expected points, order-insensitive.
   * For 'line': any two distinct points on the target line — the check compares
   * the line itself, so a kid may pick any other two points on it.
   */
  correctPoints: GridPoint[];
}

export interface ExpressionQuestion extends BaseQuestion {
  type: 'expression';
  /**
   * The expected answer. Any algebraically equivalent form is accepted, so
   * `2x+6` also accepts `2(x+3)`.
   */
  correctExpression: string;
  /**
   * A form that is algebraically equivalent but doesn't show the work — for an
   * "expand 3(x + 4)" question, that's `3(x + 4)` itself. Without this the kid
   * can copy the prompt back and be marked correct, since equivalence checking
   * can't tell the two apart.
   */
  rejectSameAs?: string;
  /** Shown as a hint above the keypad, e.g. "x". */
  variableLabel?: string;
}

export type Question =
  | MultipleChoiceQuestion
  | NumericQuestion
  | DragDropOrderQuestion
  | DragDropMatchQuestion
  | GraphPlotQuestion
  | ExpressionQuestion;

/** A question built fresh from a generator each time the level is started. */
export interface GeneratedSlot {
  generatorId: string;
  difficulty: 1 | 2 | 3;
}

export interface Level {
  id: string;
  strand: StrandId;
  order: number;
  title: string;
  description: string;
  /** Hand-authored questions, referenced by id. */
  questionIds: string[];
  /**
   * Generated questions appended after the authored ones. These reroll on every
   * attempt, so replaying a level is practice rather than recall.
   */
  generated?: GeneratedSlot[];
  /**
   * Set on levels that deliberately span strands — mixed reviews and
   * cross-topic "connections" levels. Focused levels must stay on one strand,
   * and `levelResolution.test.ts` enforces that; this flag is how a level opts
   * out on purpose rather than by accident.
   */
  crossTopic?: boolean;
  passThreshold: number;
}

export type WorldIcon = 'mountain' | 'wave' | 'crystal' | 'temple' | 'observatory';

export interface WorldColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface World {
  /** Unique across all grades, e.g. 'g8-geometry'. */
  id: string;
  grade: GradeId;
  /** Drives the colour theme and icon; shared across grades. */
  strand: StrandId;
  name: string;
  shortLabel: string;
  description: string;
  colorTheme: WorldColorTheme;
  icon: WorldIcon;
  levels: Level[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type BadgeCondition = (state: PersistedState) => boolean;

export interface LevelProgress {
  stars: 0 | 1 | 2 | 3;
  bestAccuracy: number;
  timesPlayed: number;
  lastPlayedAt: string;
}

export interface PersistedState {
  version: number;
  playerName: string;
  totalXP: number;
  bestStreakEver: number;
  unlockedBadgeIds: string[];
  levelProgress: Record<string, LevelProgress>;
  currentWorldId: string;
  /** Which grade's map the kid is on. Grades are freely selectable. */
  selectedGradeId: GradeId;
  soundEnabled: boolean;
  /** Spaced-repetition state, keyed by generator id. See `src/lib/review.ts`. */
  reviewSchedule: ReviewSchedule;
  /** How widely spaced reviews should be; the kid picks this. */
  reviewMode: ReviewMode;
}

export type ScreenId =
  | 'onboarding'
  | 'account'
  | 'grade-select'
  | 'review'
  | 'world-map'
  | 'level-intro'
  | 'gameplay'
  | 'level-complete';

export interface LevelRunResult {
  levelId: string;
  correctCount: number;
  totalCount: number;
  accuracy: number;
  stars: 0 | 1 | 2 | 3;
  xpEarned: number;
  bestStreak: number;
  passed: boolean;
  newlyUnlockedBadgeIds: string[];
}
