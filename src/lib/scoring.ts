import type { Question } from '../types/game';

export type UserAnswer =
  | { type: 'multiple-choice'; choiceIndex: number }
  | { type: 'numeric'; value: number }
  | { type: 'drag-drop-order'; order: string[] }
  | { type: 'drag-drop-match'; pairs: { left: string; right: string }[] };

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
  }
}

export function starsForAccuracy(accuracy: number, passThreshold: number): 0 | 1 | 2 | 3 {
  if (accuracy >= 0.9) return 3;
  if (accuracy >= 0.7) return 2;
  if (accuracy >= passThreshold) return 1;
  return 0;
}
