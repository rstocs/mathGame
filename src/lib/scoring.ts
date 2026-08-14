import type { GridPoint, Question } from '../types/game';
import { areExpressionsEquivalent, normalizeForComparison } from './expression';

export type UserAnswer =
  | { type: 'multiple-choice'; choiceIndex: number }
  | { type: 'numeric'; value: number }
  | { type: 'drag-drop-order'; order: string[] }
  | { type: 'drag-drop-match'; pairs: { left: string; right: string }[] }
  | { type: 'graph-plot'; points: GridPoint[] }
  | { type: 'expression'; text: string };

/**
 * Do two point-pairs describe the same infinite line? Compared via the
 * cross-product form of collinearity so vertical lines work too (an
 * undefined slope would otherwise divide by zero).
 */
function sameLine(a: GridPoint[], b: GridPoint[]): boolean {
  if (a.length !== 2 || b.length !== 2) return false;

  const degenerate = (p: GridPoint[]) => p[0].x === p[1].x && p[0].y === p[1].y;
  if (degenerate(a) || degenerate(b)) return false;

  // Every point of b must be collinear with the segment of a, and vice versa.
  const onLine = (line: GridPoint[], p: GridPoint) =>
    Math.abs((line[1].x - line[0].x) * (p.y - line[0].y) - (line[1].y - line[0].y) * (p.x - line[0].x)) < 1e-9;

  return b.every((p) => onLine(a, p)) && a.every((p) => onLine(b, p));
}

/** Order-insensitive comparison of plotted points. */
function samePointSet(a: GridPoint[], b: GridPoint[]): boolean {
  if (a.length !== b.length) return false;
  const remaining = [...b];
  for (const p of a) {
    const i = remaining.findIndex((q) => q.x === p.x && q.y === p.y);
    if (i === -1) return false;
    remaining.splice(i, 1);
  }
  return true;
}

export function isAnswerCorrect(question: Question, answer: UserAnswer): boolean {
  switch (question.type) {
    case 'multiple-choice':
      return answer.type === 'multiple-choice' && answer.choiceIndex === question.correctIndex;
    case 'numeric': {
      if (answer.type !== 'numeric') return false;
      const tolerance = question.tolerance ?? 0;
      // Pad the comparison by a few ULPs. Without it the tolerance boundary is
      // lopsided: for 3.14 +/- 0.01, `3.15 - 3.14` lands just under 0.01 and is
      // accepted while `3.13 - 3.14` lands just over and is rejected, so a kid
      // is marked wrong for an answer that is exactly on the stated edge.
      const scale = Math.max(Math.abs(answer.value), Math.abs(question.correctAnswer), 1);
      const epsilon = Number.EPSILON * scale * 4;
      return Math.abs(answer.value - question.correctAnswer) <= tolerance + epsilon;
    }
    case 'drag-drop-order':
      return (
        answer.type === 'drag-drop-order' &&
        answer.order.length === question.correctOrder.length &&
        answer.order.every((item, i) => item === question.correctOrder[i])
      );
    case 'drag-drop-match':
      return (
        answer.type === 'drag-drop-match' &&
        answer.pairs.length === question.pairs.length &&
        answer.pairs.every((pair) =>
          question.pairs.some((correct) => correct.left === pair.left && correct.right === pair.right),
        )
      );
    case 'graph-plot': {
      if (answer.type !== 'graph-plot') return false;
      return question.mode.kind === 'line'
        ? sameLine(question.correctPoints, answer.points)
        : samePointSet(question.correctPoints, answer.points);
    }
    case 'expression': {
      if (answer.type !== 'expression') return false;
      if (
        question.rejectSameAs !== undefined &&
        normalizeForComparison(answer.text) === normalizeForComparison(question.rejectSameAs)
      ) {
        return false;
      }
      return areExpressionsEquivalent(answer.text, question.correctExpression);
    }
  }
}

export function starsForAccuracy(accuracy: number, passThreshold: number): 0 | 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= passThreshold) return 1;
  return 0;
}
