import type { Level, Question } from '../../types/game';
import { generateQuestion, hashSeed } from '../generators';
import { ratiosProportionsQuestions } from './ratiosProportions';
import { numberSystemQuestions } from './numberSystem';
import { expressionsEquationsQuestions } from './expressionsEquations';
import { geometryQuestions } from './geometry';
import { statisticsProbabilityQuestions } from './statisticsProbability';

export const allQuestions: Question[] = [
  ...ratiosProportionsQuestions,
  ...numberSystemQuestions,
  ...expressionsEquationsQuestions,
  ...geometryQuestions,
  ...statisticsProbabilityQuestions,
];

const questionsById = new Map<string, Question>(allQuestions.map((q) => [q.id, q]));

export function getQuestionById(id: string): Question {
  const question = questionsById.get(id);
  if (!question) {
    throw new Error(`Unknown question id: ${id}`);
  }
  return question;
}

export function getQuestionsForLevel(questionIds: string[]): Question[] {
  return questionIds.map(getQuestionById);
}

/**
 * Resolves a level into the concrete questions for one attempt: the authored
 * bank followed by freshly generated ones. `attemptSeed` varies per attempt, so
 * a retry serves new variants of the generated slots rather than the same set.
 */
export function resolveLevelQuestions(level: Level, attemptSeed: number): Question[] {
  const authored = getQuestionsForLevel(level.questionIds);
  const generated = (level.generated ?? []).map((slot, index) =>
    // Offsetting by the slot index keeps two slots using the same generator
    // from producing the identical question within one attempt.
    generateQuestion(slot.generatorId, slot.difficulty, (attemptSeed + index * 0x9e3779b1) >>> 0),
  );
  return [...authored, ...generated];
}

/** A seed that is stable within an attempt but differs between attempts. */
export function attemptSeedFor(levelId: string, attemptNumber: number): number {
  return (hashSeed(levelId) + attemptNumber * 0x85ebca6b) >>> 0;
}
