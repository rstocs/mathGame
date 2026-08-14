import { describe, it, expect } from 'vitest';
import { resolveLevelQuestions, attemptSeedFor, getQuestionById } from './index';
import { worlds, getLevel } from '../worlds';
import { allGenerators } from '../generators';
import { isAnswerCorrect, type UserAnswer } from '../../lib/scoring';
import type { Question } from '../../types/game';

const allLevels = worlds.flatMap((w) => w.levels);

function statedAnswer(q: Question): UserAnswer {
  switch (q.type) {
    case 'multiple-choice':
      return { type: 'multiple-choice', choiceIndex: q.correctIndex };
    case 'numeric':
      return { type: 'numeric', value: q.correctAnswer };
    case 'drag-drop-order':
      return { type: 'drag-drop-order', order: q.correctOrder };
    case 'drag-drop-match':
      return { type: 'drag-drop-match', pairs: q.pairs };
    case 'graph-plot':
      return { type: 'graph-plot', points: q.correctPoints };
    case 'expression':
      return { type: 'expression', text: q.correctExpression };
  }
}

describe('level content integrity', () => {
  it('every authored question id referenced by a level exists', () => {
    for (const level of allLevels) {
      for (const id of level.questionIds) {
        expect(() => getQuestionById(id), `${level.id} references missing ${id}`).not.toThrow();
      }
    }
  });

  it('every generator id referenced by a level exists', () => {
    const known = new Set(allGenerators.map((g) => g.id));
    for (const level of allLevels) {
      for (const slot of level.generated ?? []) {
        expect(known.has(slot.generatorId), `${level.id} references missing generator ${slot.generatorId}`).toBe(
          true,
        );
      }
    }
  });

  it('draws generated questions from the same strand as the level', () => {
    const byId = new Map(allGenerators.map((g) => [g.id, g]));
    for (const level of allLevels) {
      for (const slot of level.generated ?? []) {
        expect(byId.get(slot.generatorId)!.strand, `${level.id} mixes in an off-strand generator`).toBe(
          level.strand,
        );
      }
    }
  });
});

describe('resolveLevelQuestions', () => {
  it('returns authored questions followed by generated ones', () => {
    const level = getLevel('rp-l4')!;
    const questions = resolveLevelQuestions(level, attemptSeedFor('rp-l4', 1));
    expect(questions).toHaveLength(level.questionIds.length + (level.generated?.length ?? 0));
    expect(questions.slice(0, 9).map((q) => q.id)).toEqual(level.questionIds);
    expect(questions.slice(9).every((q) => q.id.startsWith('gen:'))).toBe(true);
  });

  it('is stable within an attempt', () => {
    const level = getLevel('ee-l4')!;
    const seed = attemptSeedFor('ee-l4', 3);
    expect(resolveLevelQuestions(level, seed)).toEqual(resolveLevelQuestions(level, seed));
  });

  it('rerolls generated questions on a retry, keeping authored ones fixed', () => {
    const level = getLevel('ns-l4')!;
    const first = resolveLevelQuestions(level, attemptSeedFor('ns-l4', 1));
    const second = resolveLevelQuestions(level, attemptSeedFor('ns-l4', 2));

    // The authored bank is the same nine questions both times.
    expect(second.slice(0, 9)).toEqual(first.slice(0, 9));
    // The generated tail is different — that is the point of the reroll.
    expect(second.slice(9)).not.toEqual(first.slice(9));
  });

  it('gives different questions to two slots that share a generator', () => {
    // sp-l4 deliberately uses sp-mean twice; without the per-slot offset both
    // slots would produce the identical question in the same attempt.
    const level = getLevel('sp-l4')!;
    const questions = resolveLevelQuestions(level, attemptSeedFor('sp-l4', 1));
    const generated = questions.slice(level.questionIds.length);
    const prompts = generated.map((q) => q.prompt);
    expect(new Set(prompts).size).toBe(prompts.length);
  });

  it('leaves purely authored levels untouched', () => {
    const level = getLevel('rp-l1')!;
    const questions = resolveLevelQuestions(level, attemptSeedFor('rp-l1', 1));
    expect(questions.map((q) => q.id)).toEqual(level.questionIds);
  });

  it('produces answerable questions for every level across several attempts', () => {
    for (const level of allLevels) {
      for (let attempt = 1; attempt <= 5; attempt += 1) {
        for (const q of resolveLevelQuestions(level, attemptSeedFor(level.id, attempt))) {
          expect(
            isAnswerCorrect(q, statedAnswer(q)),
            `${level.id} attempt ${attempt}: "${q.prompt}" rejects its own answer`,
          ).toBe(true);
          expect(q.explanation.length, `${level.id}: ${q.id} has no explanation`).toBeGreaterThan(20);
        }
      }
    }
  });

  it('never repeats a question id within one attempt', () => {
    for (const level of allLevels) {
      const ids = resolveLevelQuestions(level, attemptSeedFor(level.id, 1)).map((q) => q.id);
      expect(new Set(ids).size, `${level.id} has duplicate question ids`).toBe(ids.length);
    }
  });
});

describe('attemptSeedFor', () => {
  it('is stable per level and attempt, and differs across both', () => {
    expect(attemptSeedFor('rp-l4', 1)).toBe(attemptSeedFor('rp-l4', 1));
    expect(attemptSeedFor('rp-l4', 1)).not.toBe(attemptSeedFor('rp-l4', 2));
    expect(attemptSeedFor('rp-l4', 1)).not.toBe(attemptSeedFor('ns-l4', 1));
  });

  it('stays a valid unsigned 32-bit seed even for high attempt counts', () => {
    for (const attempt of [1, 50, 1000, 99999]) {
      const seed = attemptSeedFor('ee-l4', attempt);
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(2 ** 32);
    }
  });
});
