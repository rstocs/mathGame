import type { GeneratedSlot, Level, StrandId } from '../types/game';

/**
 * Builds a level made entirely of generated questions.
 *
 * Grades 5, 6, 8 and 9 are generator-driven rather than hand-authored: they are
 * mostly procedural skills (order of operations, dividing fractions, exponent
 * rules, factoring) where the value is unlimited fresh practice, and every
 * generator already carries a number-specific explanation. Grade 7 keeps its
 * authored bank, which carries the word problems and conceptual questions that
 * template badly.
 */
export function generatedLevel(args: {
  id: string;
  strand: StrandId;
  order: number;
  title: string;
  description: string;
  /** Generators cycled across the level, difficulty ramping as it goes. */
  generators: string[];
  questionCount?: number;
}): Level {
  const count = args.questionCount ?? 9;
  const generated: GeneratedSlot[] = Array.from({ length: count }, (_, i) => ({
    generatorId: args.generators[i % args.generators.length],
    // Ramp 1 -> 3 across the level so it opens gently and ends hard.
    difficulty: (i < count / 3 ? 1 : i < (count * 2) / 3 ? 2 : 3) as 1 | 2 | 3,
  }));

  return {
    id: args.id,
    strand: args.strand,
    order: args.order,
    title: args.title,
    description: args.description,
    questionIds: [],
    generated,
    passThreshold: 0.6,
  };
}
