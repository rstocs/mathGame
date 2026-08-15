import type { Question } from '../../types/game';
import { createRng, hashSeed } from '../../lib/rng';
import type { Difficulty, QuestionGenerator } from './types';
import { ratioGenerators } from './ratios';
import { numberSystemGenerators } from './numberSystem';
import { equationGenerators } from './equations';
import { geometryStatsGenerators } from './geometryStats';
import { grade5Generators } from './grade5';
import { grade6Generators } from './grade6';
import { grade8Generators } from './grade8';
import { grade9Generators } from './grade9';
import { grade10Generators } from './grade10';
import { grade11Generators } from './grade11';
import { connectionGenerators } from './connections';
import { advancedConnectionGenerators } from './connectionsAdvanced';
import { classicConnectionGenerators } from './connectionsClassic';

export const allGenerators: QuestionGenerator[] = [
  ...grade5Generators,
  ...grade6Generators,
  ...ratioGenerators,
  ...numberSystemGenerators,
  ...equationGenerators,
  ...geometryStatsGenerators,
  ...grade8Generators,
  ...grade9Generators,
  ...grade10Generators,
  ...grade11Generators,
  ...connectionGenerators,
  ...advancedConnectionGenerators,
  ...classicConnectionGenerators,
];

const generatorsById = new Map(allGenerators.map((g) => [g.id, g]));

/**
 * Whether a generator still exists. Saved data outlives the code: a schedule
 * written today can be read after a generator has been renamed or retired, and
 * asking for one that has gone would throw.
 */
export function hasGenerator(id: string): boolean {
  return generatorsById.has(id);
}

export function getGenerator(id: string): QuestionGenerator {
  const generator = generatorsById.get(id);
  if (!generator) throw new Error(`Unknown generator id: ${id}`);
  return generator;
}

/**
 * Produces one concrete question from a generator and a seed. The id encodes
 * both, so a question a kid saw can be regenerated exactly from its id alone.
 */
export function generateQuestion(generatorId: string, difficulty: Difficulty, seed: number): Question {
  const generator = getGenerator(generatorId);
  const built = generator.build(createRng(seed), difficulty);
  return { ...built, id: `gen:${generatorId}:${difficulty}:${seed >>> 0}` } as Question;
}

/** Parses an id produced by `generateQuestion` back into its parts. */
export function parseGeneratedId(
  id: string,
): { generatorId: string; difficulty: Difficulty; seed: number } | null {
  if (!id.startsWith('gen:')) return null;
  const parts = id.split(':');
  if (parts.length !== 4) return null;
  const [, generatorId, difficultyText, seedText] = parts;
  const difficulty = Number(difficultyText);
  const seed = Number(seedText);
  if (!generatorsById.has(generatorId)) return null;
  if (![1, 2, 3].includes(difficulty) || !Number.isFinite(seed)) return null;
  return { generatorId, difficulty: difficulty as Difficulty, seed };
}

export { hashSeed };
export type { Difficulty, QuestionGenerator };
