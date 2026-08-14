import type { Question } from '../../types/game';
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
