import { describe, it, expect } from 'vitest';
import { isAnswerCorrect, starsForAccuracy } from './scoring';
import type {
  MultipleChoiceQuestion,
  NumericQuestion,
  DragDropOrderQuestion,
  DragDropMatchQuestion,
  GraphPlotQuestion,
  ExpressionQuestion,
} from '../types/game';

const mc: MultipleChoiceQuestion = {
  id: 'test-mc',
  strand: 'ratios-proportions',
  type: 'multiple-choice',
  prompt: 'test',
  explanation: 'test',
  choices: ['a', 'b', 'c'],
  correctIndex: 1,
};

const numeric: NumericQuestion = {
  id: 'test-num',
  strand: 'number-system',
  type: 'numeric',
  prompt: 'test',
  explanation: 'test',
  correctAnswer: 42,
};

const order: DragDropOrderQuestion = {
  id: 'test-order',
  strand: 'number-system',
  type: 'drag-drop-order',
  prompt: 'test',
  explanation: 'test',
  items: ['-3', '0', '2'],
  correctOrder: ['-3', '0', '2'],
};

const match: DragDropMatchQuestion = {
  id: 'test-match',
  strand: 'geometry',
  type: 'drag-drop-match',
  prompt: 'test',
  explanation: 'test',
  pairs: [
    { left: 'area', right: 'πr²' },
    { left: 'circumference', right: '2πr' },
  ],
};

describe('isAnswerCorrect — multiple choice', () => {
  it('accepts the correct index and rejects the others', () => {
    expect(isAnswerCorrect(mc, { type: 'multiple-choice', choiceIndex: 1 })).toBe(true);
    expect(isAnswerCorrect(mc, { type: 'multiple-choice', choiceIndex: 0 })).toBe(false);
    expect(isAnswerCorrect(mc, { type: 'multiple-choice', choiceIndex: 2 })).toBe(false);
  });

  it('rejects an answer of the wrong shape', () => {
    expect(isAnswerCorrect(mc, { type: 'numeric', value: 1 })).toBe(false);
  });
});

describe('isAnswerCorrect — numeric', () => {
  it('requires an exact match when no tolerance is given', () => {
    expect(isAnswerCorrect(numeric, { type: 'numeric', value: 42 })).toBe(true);
    expect(isAnswerCorrect(numeric, { type: 'numeric', value: 42.01 })).toBe(false);
    expect(isAnswerCorrect(numeric, { type: 'numeric', value: -42 })).toBe(false);
  });

  it('honours an explicit tolerance at and beyond its edge', () => {
    const withTolerance: NumericQuestion = { ...numeric, correctAnswer: 3.14, tolerance: 0.01 };
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.14 })).toBe(true);
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.15 })).toBe(true);
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.13 })).toBe(true);
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.2 })).toBe(false);
  });

  it('treats the tolerance boundary symmetrically despite float drift', () => {
    // Regression: `3.13 - 3.14` evaluates to 0.010000000000000231, which used
    // to fail a bare `<= 0.01` check while the mirror-image 3.15 passed.
    const withTolerance: NumericQuestion = { ...numeric, correctAnswer: 3.14, tolerance: 0.01 };
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.13 })).toBe(true);
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.15 })).toBe(true);

    const tenths: NumericQuestion = { ...numeric, correctAnswer: 0.3, tolerance: 0.1 };
    expect(isAnswerCorrect(tenths, { type: 'numeric', value: 0.2 })).toBe(true);
    expect(isAnswerCorrect(tenths, { type: 'numeric', value: 0.4 })).toBe(true);
  });

  it('does not let the float guard swallow a genuinely wrong answer', () => {
    expect(isAnswerCorrect(numeric, { type: 'numeric', value: 42.000001 })).toBe(false);
    const withTolerance: NumericQuestion = { ...numeric, correctAnswer: 3.14, tolerance: 0.01 };
    expect(isAnswerCorrect(withTolerance, { type: 'numeric', value: 3.1601 })).toBe(false);
  });

  it('rejects an answer of the wrong shape', () => {
    expect(isAnswerCorrect(numeric, { type: 'multiple-choice', choiceIndex: 0 })).toBe(false);
  });
});

describe('isAnswerCorrect — ordering', () => {
  it('accepts only the exact sequence', () => {
    expect(isAnswerCorrect(order, { type: 'drag-drop-order', order: ['-3', '0', '2'] })).toBe(true);
    expect(isAnswerCorrect(order, { type: 'drag-drop-order', order: ['0', '-3', '2'] })).toBe(false);
  });

  it('rejects an incomplete ordering', () => {
    expect(isAnswerCorrect(order, { type: 'drag-drop-order', order: ['-3', '0'] })).toBe(false);
  });
});

describe('isAnswerCorrect — matching', () => {
  it('accepts all correct pairs regardless of the order they were made in', () => {
    expect(
      isAnswerCorrect(match, {
        type: 'drag-drop-match',
        pairs: [
          { left: 'circumference', right: '2πr' },
          { left: 'area', right: 'πr²' },
        ],
      }),
    ).toBe(true);
  });

  it('rejects a swapped pairing', () => {
    expect(
      isAnswerCorrect(match, {
        type: 'drag-drop-match',
        pairs: [
          { left: 'area', right: '2πr' },
          { left: 'circumference', right: 'πr²' },
        ],
      }),
    ).toBe(false);
  });

  it('rejects a partially completed match', () => {
    expect(
      isAnswerCorrect(match, {
        type: 'drag-drop-match',
        pairs: [{ left: 'area', right: 'πr²' }],
      }),
    ).toBe(false);
  });
});

const bounds = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };

const plotPoints: GraphPlotQuestion = {
  id: 'test-plot',
  strand: 'expressions-equations',
  type: 'graph-plot',
  prompt: 'test',
  explanation: 'test',
  mode: { kind: 'points', count: 2 },
  bounds,
  correctPoints: [
    { x: 1, y: 2 },
    { x: -3, y: 4 },
  ],
};

const plotLine: GraphPlotQuestion = {
  ...plotPoints,
  id: 'test-line',
  mode: { kind: 'line' },
  // y = 2x + 1
  correctPoints: [
    { x: 0, y: 1 },
    { x: 1, y: 3 },
  ],
};

const expression: ExpressionQuestion = {
  id: 'test-expr',
  strand: 'expressions-equations',
  type: 'expression',
  prompt: 'test',
  explanation: 'test',
  correctExpression: '2x+6',
};

describe('isAnswerCorrect — graph plot (points)', () => {
  it('accepts the right points in any order', () => {
    expect(
      isAnswerCorrect(plotPoints, {
        type: 'graph-plot',
        points: [
          { x: -3, y: 4 },
          { x: 1, y: 2 },
        ],
      }),
    ).toBe(true);
  });

  it('rejects a wrong point, a missing point, or a swapped coordinate', () => {
    expect(
      isAnswerCorrect(plotPoints, {
        type: 'graph-plot',
        points: [
          { x: 1, y: 2 },
          { x: -3, y: 5 },
        ],
      }),
    ).toBe(false);
    expect(isAnswerCorrect(plotPoints, { type: 'graph-plot', points: [{ x: 1, y: 2 }] })).toBe(false);
    // (2,1) instead of (1,2) — the classic x/y mix-up must be marked wrong.
    expect(
      isAnswerCorrect(plotPoints, {
        type: 'graph-plot',
        points: [
          { x: 2, y: 1 },
          { x: -3, y: 4 },
        ],
      }),
    ).toBe(false);
  });
});

describe('isAnswerCorrect — graph plot (line)', () => {
  it('accepts any two distinct points on the same line', () => {
    // y = 2x + 1 also passes through (-2,-3) and (3,7).
    expect(
      isAnswerCorrect(plotLine, {
        type: 'graph-plot',
        points: [
          { x: -2, y: -3 },
          { x: 3, y: 7 },
        ],
      }),
    ).toBe(true);
  });

  it('rejects a parallel line and a line of the wrong slope', () => {
    // y = 2x + 2 (parallel, shifted).
    expect(
      isAnswerCorrect(plotLine, {
        type: 'graph-plot',
        points: [
          { x: 0, y: 2 },
          { x: 1, y: 4 },
        ],
      }),
    ).toBe(false);
    // y = 3x + 1 (right intercept, wrong slope).
    expect(
      isAnswerCorrect(plotLine, {
        type: 'graph-plot',
        points: [
          { x: 0, y: 1 },
          { x: 1, y: 4 },
        ],
      }),
    ).toBe(false);
  });

  it('rejects two identical points, which define no line', () => {
    expect(
      isAnswerCorrect(plotLine, {
        type: 'graph-plot',
        points: [
          { x: 0, y: 1 },
          { x: 0, y: 1 },
        ],
      }),
    ).toBe(false);
  });

  it('handles vertical lines, where slope is undefined', () => {
    const vertical: GraphPlotQuestion = {
      ...plotLine,
      correctPoints: [
        { x: 4, y: 0 },
        { x: 4, y: 5 },
      ],
    };
    expect(
      isAnswerCorrect(vertical, {
        type: 'graph-plot',
        points: [
          { x: 4, y: -2 },
          { x: 4, y: 9 },
        ],
      }),
    ).toBe(true);
    expect(
      isAnswerCorrect(vertical, {
        type: 'graph-plot',
        points: [
          { x: 5, y: -2 },
          { x: 5, y: 9 },
        ],
      }),
    ).toBe(false);
  });
});

describe('isAnswerCorrect — expression', () => {
  it('accepts equivalent forms', () => {
    expect(isAnswerCorrect(expression, { type: 'expression', text: '2x+6' })).toBe(true);
    expect(isAnswerCorrect(expression, { type: 'expression', text: '2(x+3)' })).toBe(true);
    expect(isAnswerCorrect(expression, { type: 'expression', text: '6 + 2x' })).toBe(true);
  });

  it('rejects wrong or unparseable answers', () => {
    expect(isAnswerCorrect(expression, { type: 'expression', text: '2x+3' })).toBe(false);
    expect(isAnswerCorrect(expression, { type: 'expression', text: '' })).toBe(false);
    expect(isAnswerCorrect(expression, { type: 'expression', text: '2x+' })).toBe(false);
  });

  it('rejects an answer of the wrong shape', () => {
    expect(isAnswerCorrect(expression, { type: 'numeric', value: 6 })).toBe(false);
  });

  it('rejects copying the unexpanded prompt back, which shows no work', () => {
    const expand: ExpressionQuestion = {
      ...expression,
      prompt: 'Expand 2(x + 3)',
      correctExpression: '2x + 6',
      rejectSameAs: '2(x + 3)',
    };
    expect(isAnswerCorrect(expand, { type: 'expression', text: '2(x + 3)' })).toBe(false);
    // Spacing and notation shouldn't be a way around it.
    expect(isAnswerCorrect(expand, { type: 'expression', text: '2(x+3)' })).toBe(false);
    expect(isAnswerCorrect(expand, { type: 'expression', text: '2 ( X + 3 )' })).toBe(false);
    // The actual expanded answer still passes.
    expect(isAnswerCorrect(expand, { type: 'expression', text: '2x+6' })).toBe(true);
    expect(isAnswerCorrect(expand, { type: 'expression', text: '6+2x' })).toBe(true);
  });
});

describe('starsForAccuracy', () => {
  const threshold = 0.6;

  it('awards 3 stars at 90% and above', () => {
    expect(starsForAccuracy(1, threshold)).toBe(3);
    expect(starsForAccuracy(0.9, threshold)).toBe(3);
  });

  it('awards 2 stars from 70% up to 90%', () => {
    expect(starsForAccuracy(0.89, threshold)).toBe(2);
    expect(starsForAccuracy(0.7, threshold)).toBe(2);
  });

  it('awards 1 star from the pass threshold up to 70%', () => {
    expect(starsForAccuracy(0.69, threshold)).toBe(1);
    expect(starsForAccuracy(0.6, threshold)).toBe(1);
  });

  it('awards no stars below the pass threshold', () => {
    expect(starsForAccuracy(0.59, threshold)).toBe(0);
    expect(starsForAccuracy(0, threshold)).toBe(0);
  });

  it('uses the pass threshold only as the floor for the first star', () => {
    // The 3- and 2-star bands are fixed at 90% and 70%; passThreshold moves
    // only the 1-star/0-star boundary. So at a stricter 0.8 threshold, 0.8
    // accuracy still earns 2 stars because it clears the fixed 70% band.
    expect(starsForAccuracy(0.65, 0.8)).toBe(0);
    expect(starsForAccuracy(0.8, 0.8)).toBe(2);
  });
});
