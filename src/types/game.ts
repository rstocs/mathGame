export type StrandId =
  | 'ratios-proportions'
  | 'number-system'
  | 'expressions-equations'
  | 'geometry'
  | 'statistics-probability';

export type QuestionType =
  | 'multiple-choice'
  | 'numeric'
  | 'drag-drop-order'
  | 'drag-drop-match';

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

export type Question =
  | MultipleChoiceQuestion
  | NumericQuestion
  | DragDropOrderQuestion
  | DragDropMatchQuestion;

export interface Level {
  id: string;
  strand: StrandId;
  order: number;
  title: string;
  description: string;
  questionIds: string[];
  passThreshold: number;
}

export type WorldIcon = 'mountain' | 'wave' | 'crystal' | 'temple' | 'observatory';

export interface WorldColorTheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface World {
  id: StrandId;
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
  currentWorldId: StrandId;
  soundEnabled: boolean;
}

export type ScreenId = 'onboarding' | 'world-map' | 'level-intro' | 'gameplay' | 'level-complete';

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
