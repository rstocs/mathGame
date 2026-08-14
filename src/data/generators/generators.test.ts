import { describe, it, expect } from 'vitest';
import { allGenerators, generateQuestion, parseGeneratedId } from './index';
import type { Difficulty } from './types';
import { isAnswerCorrect, type UserAnswer } from '../../lib/scoring';
import { parseExpression } from '../../lib/expression';
import type { Question } from '../../types/game';

const DIFFICULTIES: Difficulty[] = [1, 2, 3];
const SEEDS_PER_DIFFICULTY = 120;

/** The answer the question itself claims is correct. */
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

function eachGenerated(fn: (q: Question, meta: { generatorId: string; difficulty: Difficulty; seed: number }) => void) {
  for (const generator of allGenerators) {
    for (const difficulty of DIFFICULTIES) {
      for (let seed = 1; seed <= SEEDS_PER_DIFFICULTY; seed += 1) {
        fn(generateQuestion(generator.id, difficulty, seed), {
          generatorId: generator.id,
          difficulty,
          seed,
        });
      }
    }
  }
}

describe('generator registry', () => {
  it('has unique generator ids', () => {
    const ids = allGenerators.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers every strand', () => {
    const strands = new Set(allGenerators.map((g) => g.strand));
    expect(strands).toContain('ratios-proportions');
    expect(strands).toContain('number-system');
    expect(strands).toContain('expressions-equations');
    expect(strands).toContain('geometry');
    expect(strands).toContain('statistics-probability');
  });

  it('throws on an unknown generator rather than returning junk', () => {
    expect(() => generateQuestion('nope', 1, 1)).toThrow();
  });
});

describe('generated questions', () => {
  it('are deterministic for a given seed', () => {
    for (const generator of allGenerators) {
      const a = generateQuestion(generator.id, 2, 4242);
      const b = generateQuestion(generator.id, 2, 4242);
      expect(a).toEqual(b);
    }
  });

  it('vary across seeds', () => {
    for (const generator of allGenerators) {
      // Compare the whole question, not just the prompt: for an ordering
      // question the prompt is fixed boilerplate and all the variety lives in
      // `items`, so measuring the prompt alone would wrongly flag it.
      const variants = new Set(
        Array.from({ length: 40 }, (_, i) => {
          const { id: _ignored, ...rest } = generateQuestion(generator.id, 2, i + 1);
          return JSON.stringify(rest);
        }),
      );
      // Some generators legitimately repeat occasionally; requiring most to
      // differ catches one that ignores the rng, or has too small a space to
      // survive a kid replaying the level.
      expect(variants.size, `${generator.id} produced only ${variants.size} distinct questions in 40 seeds`)
        .toBeGreaterThan(12);
    }
  });

  it('mark their own stated answer as correct', () => {
    eachGenerated((q, meta) => {
      const correct = isAnswerCorrect(q, statedAnswer(q));
      if (!correct) {
        throw new Error(
          `${meta.generatorId} d${meta.difficulty} seed ${meta.seed} rejects its own answer.\n` +
            `prompt: ${q.prompt}\n${JSON.stringify(q)}`,
        );
      }
    });
  });

  it('carry a round-trippable id', () => {
    eachGenerated((q, meta) => {
      const parsed = parseGeneratedId(q.id);
      expect(parsed).toEqual({
        generatorId: meta.generatorId,
        difficulty: meta.difficulty,
        seed: meta.seed,
      });
      // Regenerating from the id reproduces the identical question.
      expect(generateQuestion(parsed!.generatorId, parsed!.difficulty, parsed!.seed)).toEqual(q);
    });
  });

  it('always explain, specifically', () => {
    eachGenerated((q, meta) => {
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      expect(q.explanation, where).toBeTruthy();
      // An explanation that never cites a number, for a question that HAS
      // numbers, is boilerplate — and the explanation is the whole pedagogical
      // point. Conceptual questions ("positive or negative association?")
      // legitimately have no numbers on either side.
      if (/\d/.test(q.prompt)) {
        expect(/\d/.test(q.explanation), `${where} explanation has no numbers`).toBe(true);
      }
      expect(q.explanation.length, where).toBeGreaterThan(40);
      expect(q.explanation, where).not.toContain('undefined');
      expect(q.explanation, where).not.toContain('NaN');
    });
  });

  it('never render undefined or NaN into a prompt', () => {
    eachGenerated((q, meta) => {
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      expect(q.prompt, where).not.toContain('undefined');
      expect(q.prompt, where).not.toContain('NaN');
      expect(q.prompt.trim().length, where).toBeGreaterThan(10);
    });
  });
});

describe('multiple-choice generators', () => {
  it('offer exactly one correct option, with no duplicates', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'multiple-choice') return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;

      // Usually four options, but a genuinely binary question (rational or
      // irrational?) has two, and padding it with filler would be silly.
      expect(q.choices.length, where).toBeGreaterThanOrEqual(2);
      expect(q.choices.length, where).toBeLessThanOrEqual(4);
      expect(new Set(q.choices).size, `${where} has duplicate choices: ${q.choices.join(' | ')}`).toBe(
        q.choices.length,
      );

      // A distractor equal to the correct value would mean two right answers.
      const correctText = q.choices[q.correctIndex];
      const duplicates = q.choices.filter((c) => c === correctText).length;
      expect(duplicates, `${where} repeats the correct answer`).toBe(1);
      expect(q.correctIndex, where).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex, where).toBeLessThan(q.choices.length);
    });
  });
});

describe('numeric generators', () => {
  it('produce finite, sensible answers', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'numeric') return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      expect(Number.isFinite(q.correctAnswer), `${where} answer is ${q.correctAnswer}`).toBe(true);
    });
  });

  it('never ask for a negative length, area, or probability', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'numeric') return;
      if (q.strand !== 'geometry') return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      expect(q.correctAnswer, `${where} yields a negative measurement`).toBeGreaterThan(0);
    });
  });
});

describe('expression generators', () => {
  it('state a parseable correct expression', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'expression') return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      const parsed = parseExpression(q.correctExpression);
      expect(parsed.ok, `${where} correctExpression "${q.correctExpression}" does not parse`).toBe(true);
    });
  });

  it('reject the unexpanded form where one is declared', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'expression' || q.rejectSameAs === undefined) return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      // The guard only means something if the form it blocks would otherwise
      // have been accepted as equivalent.
      const parsed = parseExpression(q.rejectSameAs);
      expect(parsed.ok, `${where} rejectSameAs "${q.rejectSameAs}" does not parse`).toBe(true);
      expect(
        isAnswerCorrect(q, { type: 'expression', text: q.rejectSameAs }),
        `${where} accepts the copy-back "${q.rejectSameAs}"`,
      ).toBe(false);
    });
  });
});

describe('graph-plot generators', () => {
  it('keep every correct point inside the visible grid', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'graph-plot') return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      for (const p of q.correctPoints) {
        expect(p.x, `${where} x out of bounds`).toBeGreaterThanOrEqual(q.bounds.xMin);
        expect(p.x, `${where} x out of bounds`).toBeLessThanOrEqual(q.bounds.xMax);
        expect(p.y, `${where} y out of bounds`).toBeGreaterThanOrEqual(q.bounds.yMin);
        expect(p.y, `${where} y out of bounds`).toBeLessThanOrEqual(q.bounds.yMax);
        expect(Number.isInteger(p.x) && Number.isInteger(p.y), `${where} point is off-lattice`).toBe(true);
      }
    });
  });

  it('never define a line by two identical points', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'graph-plot' || q.mode.kind !== 'line') return;
      const [a, b] = q.correctPoints;
      expect(
        a.x !== b.x || a.y !== b.y,
        `${meta.generatorId} d${meta.difficulty} seed ${meta.seed} has a degenerate line`,
      ).toBe(true);
    });
  });
});

describe('question quality', () => {
  it('never poses a degenerate proportion with a ratio of 1', () => {
    eachGenerated((q, meta) => {
      if (meta.generatorId !== 'rp-solve-proportion') return;
      // "4/4 = x/8" is answerable by pattern-matching, not by reasoning.
      const match = q.prompt.match(/(\d+)\/(\d+) = x\/(\d+)/);
      expect(match, `unexpected prompt shape: ${q.prompt}`).not.toBeNull();
      expect(match![1], `${meta.seed}: ratio of 1 in "${q.prompt}"`).not.toBe(match![2]);
    });
  });

  it('writes algebra the way it is written by hand', () => {
    eachGenerated((q) => {
      const text = `${q.prompt} ${q.type === 'multiple-choice' ? q.choices.join(' ') : ''}`;
      // "x² − 1x − 2" should read "x² − x − 2"; a 1 coefficient is implied.
      expect(text, `implied-1 coefficient in: ${q.prompt}`).not.toMatch(/(?<!\d)1x\b/);
      // A stray "+ -3" instead of "− 3".
      expect(text, `unformatted negative in: ${q.prompt}`).not.toMatch(/[+−-]\s+-\d/);
    });
  });

  it('labels the discriminant according to its actual value', () => {
    // The self-answer check only proves a question agrees with itself. This
    // checks the claim is TRUE: a discriminant of 0 must not be sold as "no
    // real roots", which is what a=1, b=4, c=4 used to produce.
    eachGenerated((q, meta) => {
      if (meta.generatorId !== 'g11-discriminant' || q.type !== 'multiple-choice') return;
      const match = q.prompt.match(/does (\d*)x² ([−+]) (\d*)x ([−+]) (\d+) = 0/);
      expect(match, `unexpected prompt shape: ${q.prompt}`).not.toBeNull();
      const a = match![1] === '' ? 1 : Number(match![1]);
      const b = (match![2] === '−' ? -1 : 1) * (match![3] === '' ? 1 : Number(match![3]));
      const c = (match![4] === '−' ? -1 : 1) * Number(match![5]);
      const value = b * b - 4 * a * c;

      const expected = value > 0 ? 'Two real roots' : value === 0 ? 'One real root' : 'No real roots';
      expect(
        q.choices[q.correctIndex],
        `${meta.seed}: "${q.prompt}" has discriminant ${value} but claims`,
      ).toBe(expected);
    });
  });

  it('asks for the larger root only when the roots actually differ', () => {
    eachGenerated((q, meta) => {
      if (meta.generatorId !== 'g11-quadratic-formula') return;
      // The explanation names both roots; a repeated root makes "the LARGER"
      // meaningless.
      const roots = [...q.explanation.matchAll(/x = (−?-?\d+)/g)].map((m) => Number(m[1]));
      expect(new Set(roots).size, `${meta.seed}: repeated root in "${q.prompt}"`).toBeGreaterThan(1);
    });
  });

  it('never poses a GCF question whose answer is 1', () => {
    eachGenerated((q, meta) => {
      if (meta.generatorId !== 'g6-gcf-lcm' || q.type !== 'numeric') return;
      // "The GCF of 5 and 12 is 1" is true but drills nothing.
      if (q.prompt.includes('greatest common factor')) {
        expect(q.correctAnswer, `${meta.seed}: coprime pair in "${q.prompt}"`).toBeGreaterThan(1);
      }
    });
  });

  it('never asks for a percent change from a zero starting price', () => {
    eachGenerated((q, meta) => {
      if (meta.generatorId !== 'rp-percent-change') return;
      expect(q.prompt, `${meta.seed}`).not.toMatch(/from \$0\.00/);
    });
  });
});

describe('ordering generators', () => {
  it('give a correctOrder that is a permutation of the items shown', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'drag-drop-order') return;
      const where = `${meta.generatorId} d${meta.difficulty} seed ${meta.seed}`;
      expect([...q.items].sort(), where).toEqual([...q.correctOrder].sort());
      // Duplicate labels would make the ordering ambiguous.
      expect(new Set(q.items).size, `${where} has duplicate items`).toBe(q.items.length);
    });
  });

  it('sort numerically, not as text', () => {
    eachGenerated((q, meta) => {
      if (q.type !== 'drag-drop-order') return;
      const numbers = q.correctOrder.map(Number);
      if (numbers.some(Number.isNaN)) return;
      for (let i = 1; i < numbers.length; i += 1) {
        expect(
          numbers[i] > numbers[i - 1],
          `${meta.generatorId} seed ${meta.seed} not ascending: ${q.correctOrder.join(', ')}`,
        ).toBe(true);
      }
    });
  });
});
