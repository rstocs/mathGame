import type { Question, StrandId } from '../../types/game';
import type { Rng } from '../../lib/rng';

/**
 * Difficulty rises within a level rather than between levels: slot 1 is the
 * gentlest form of the skill, slot 9 the hardest. Generators read this to
 * choose number sizes and whether to include negatives, fractions, etc.
 */
export type Difficulty = 1 | 2 | 3;

export interface QuestionGenerator {
  id: string;
  strand: StrandId;
  /** One-line note on what skill this drills, for the generator index. */
  describes: string;
  /**
   * Builds one question. `id` is assigned by the caller so generated questions
   * carry a stable, seed-derived identifier.
   */
  build: (rng: Rng, difficulty: Difficulty) => Omit<Question, 'id'> & { id?: string };
}

/** Rounds to at most `places` decimals, dropping trailing zeros. */
export function round(value: number, places = 2): number {
  return Number.parseFloat(value.toFixed(places));
}

/** Formats a money amount the way a worksheet would: $4.80, not $4.8. */
export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

/**
 * Builds a 4-choice multiple-choice set from the correct value plus distractors,
 * shuffled. Distractors that collide with the answer (or each other) are dropped
 * and back-filled, so a question can never present the same value twice or,
 * worse, two correct options.
 */
export function choicesFrom(
  rng: Rng,
  correct: string,
  distractors: string[],
  fallback: (index: number) => string,
): { choices: string[]; correctIndex: number } {
  const unique: string[] = [];
  for (const d of distractors) {
    if (d !== correct && !unique.includes(d)) unique.push(d);
  }

  let attempt = 0;
  while (unique.length < 3 && attempt < 50) {
    const candidate = fallback(attempt);
    if (candidate !== correct && !unique.includes(candidate)) unique.push(candidate);
    attempt += 1;
  }

  const choices = rng.shuffle([correct, ...unique.slice(0, 3)]);
  return { choices, correctIndex: choices.indexOf(correct) };
}
