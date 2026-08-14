import { describe, it, expect } from 'vitest';
import { isAnswerCorrect, starsForAccuracy } from './scoring';
import type {
  MultipleChoiceQuestion,
  NumericQuestion,
  DragDropOrderQuestion,
  DragDropMatchQuestion,
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
