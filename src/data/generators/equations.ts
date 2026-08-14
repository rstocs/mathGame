import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/** Renders `a x + b` with the signs read naturally: 3x − 4, not 3x + -4. */
function linear(a: number, b: number): string {
  const term = a === 1 ? 'x' : a === -1 ? '−x' : `${a}x`;
  if (b === 0) return term;
  return `${term} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
}

/** 7.EE.B.4 — solve px + q = r. */
export const solveTwoStep: QuestionGenerator = {
  id: 'ee-solve-two-step',
  strand: 'expressions-equations',
  describes: 'Solve a two-step linear equation px + q = r.',
  build: (rng, difficulty) => {
    const a = rng.int(2, difficulty === 1 ? 6 : 12);
    const x = difficulty === 3 ? rng.int(-12, 12) : rng.int(1, 10);
    const b = rng.int(-15, 15);
    const r = a * x + b;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `Solve for x:  ${linear(a, b)} = ${r}`,
      correctAnswer: x,
      explanation:
        `Undo the operations in reverse order. First remove the ${b < 0 ? `− ${Math.abs(b)}` : `+ ${b}`} by ` +
        `${b < 0 ? 'adding' : 'subtracting'} ${Math.abs(b)} on both sides: ${a}x = ${r} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${a * x}. ` +
        `Then undo the × ${a} by dividing both sides by ${a}: x = ${a * x} ÷ ${a} = ${x}.`,
    };
  },
};

/** 7.EE.A.1 — expand a(bx + c), answered by typing the expression. */
export const expandDistributive: QuestionGenerator = {
  id: 'ee-expand',
  strand: 'expressions-equations',
  describes: 'Expand a(bx + c) using the distributive property.',
  build: (rng, difficulty) => {
    const a = rng.int(2, difficulty === 1 ? 5 : 9);
    const b = difficulty === 1 ? 1 : rng.int(2, 6);
    const c = rng.int(-9, 9) || 3;
    const inner = linear(b, c);
    const prompt = `${a}(${inner})`;

    return {
      strand: 'expressions-equations',
      type: 'expression',
      prompt: `Expand ${prompt} and write it without parentheses.`,
      correctExpression: `${a * b}x + ${a * c}`,
      // Without this a kid can retype the prompt: it is equivalent by definition.
      rejectSameAs: `${a}(${b === 1 ? 'x' : `${b}x`}${c < 0 ? `-${Math.abs(c)}` : `+${c}`})`,
      variableLabel: 'x',
      explanation:
        `Multiply the ${a} by EACH term inside the parentheses: ${a} × ${b === 1 ? 'x' : `${b}x`} = ${a * b}x, ` +
        `and ${a} × ${c < 0 ? `(−${Math.abs(c)})` : c} = ${a * c}. ` +
        `So ${prompt} = ${linear(a * b, a * c)}. The common slip is multiplying only the first term.`,
    };
  },
};

/** 7.EE.A.1 — combine like terms. */
export const combineLikeTerms: QuestionGenerator = {
  id: 'ee-combine-like-terms',
  strand: 'expressions-equations',
  describes: 'Simplify an expression by combining like terms.',
  build: (rng, difficulty) => {
    const a1 = rng.int(2, 9);
    const a2 = difficulty === 1 ? rng.int(1, 6) : rng.int(-9, 9) || 2;
    const b1 = rng.int(-9, 9);
    const b2 = rng.int(-9, 9);
    const xSum = a1 + a2;
    const constSum = b1 + b2;

    const parts = `${a1}x ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} ${a2 < 0 ? '−' : '+'} ${Math.abs(a2)}x ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)}`;

    return {
      strand: 'expressions-equations',
      type: 'expression',
      prompt: `Simplify by combining like terms:  ${parts}`,
      correctExpression: `${xSum}x + ${constSum}`,
      variableLabel: 'x',
      explanation:
        `Only like terms combine. The x-terms: ${a1}x ${a2 < 0 ? '−' : '+'} ${Math.abs(a2)}x = ${xSum}x. ` +
        `The plain numbers: ${b1} ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)} = ${constSum}. ` +
        `Together that is ${linear(xSum, constSum)}. You cannot add an x-term to a plain number — they are different kinds of thing.`,
    };
  },
};

/** 7.EE.B.4b — solve and interpret a one-step inequality. */
export const solveInequality: QuestionGenerator = {
  id: 'ee-solve-inequality',
  strand: 'expressions-equations',
  describes: 'Solve a one-step inequality, including the negative-coefficient flip.',
  build: (rng, difficulty) => {
    // At difficulty 3 the coefficient may be negative, which flips the sign —
    // the single most-missed idea in this standard.
    const negative = difficulty === 3 && rng.chance(0.6);
    const a = (negative ? -1 : 1) * rng.int(2, 8);
    // x must not be 0: then x, −x and the untouched right-hand side are all the
    // same text, and the four options collapse into two.
    const x = rng.chance(0.5) ? rng.int(1, 12) : rng.int(-8, -1);
    const r = a * x;
    const symbol = rng.pick(['>', '<'] as const);
    const flipped = negative ? (symbol === '>' ? '<' : '>') : symbol;
    const opposite = symbol === '>' ? '<' : '>';
    const correct = `x ${flipped} ${x}`;

    // choicesFrom drops any distractor that collides with the answer and
    // back-fills, so a question can never show the same option twice.
    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [`x ${flipped === '>' ? '<' : '>'} ${x}`, `x ${flipped} ${-x}`, `x ${symbol} ${r}`],
      (i) => `x ${i % 2 === 0 ? flipped : opposite} ${x + i + 1}`,
    );

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      prompt: `Solve for x:  ${a === 1 ? 'x' : a === -1 ? '−x' : `${a}x`} ${symbol} ${r}`,
      choices,
      correctIndex,
      explanation: negative
        ? `Divide both sides by ${a}. Because ${a} is NEGATIVE, the inequality sign flips: ${symbol} becomes ${flipped}. ` +
          `So x ${flipped} ${x}. Check with a number: dividing (or multiplying) an inequality by a negative always reverses it.`
        : `Divide both sides by ${a}: x ${symbol} ${r} ÷ ${a} = ${x}. Since ${a} is positive the inequality sign stays the same.`,
    };
  },
};

/** 7.EE.B.3 — a multi-step word problem ending in a single value. */
export const wordEquation: QuestionGenerator = {
  id: 'ee-word-equation',
  strand: 'expressions-equations',
  describes: 'Translate a word problem into an equation and solve it.',
  build: (rng, difficulty) => {
    const perItem = rng.int(3, difficulty === 1 ? 9 : 25);
    const fee = rng.int(2, 20);
    const count = rng.int(2, 12);
    const total = perItem * count + fee;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `A club charges a ${fee} dollar joining fee plus ${perItem} dollars per class. ` +
        `Nia paid ${total} dollars in total. How many classes did she attend?`,
      correctAnswer: count,
      unit: 'classes',
      explanation:
        `Let x be the number of classes. The cost is ${perItem}x + ${fee} = ${total}. ` +
        `Subtract the one-off fee from both sides: ${perItem}x = ${total} − ${fee} = ${perItem * count}. ` +
        `Then divide by the cost per class: x = ${perItem * count} ÷ ${perItem} = ${count} classes. ` +
        `The joining fee is paid once, so it is added, not multiplied.`,
    };
  },
};

/** 7.RP/7.EE bridge — read a unit rate off a graph the kid plots. */
export const plotProportional: QuestionGenerator = {
  id: 'ee-plot-proportional',
  strand: 'expressions-equations',
  describes: 'Graph a proportional relationship y = kx.',
  build: (rng, difficulty) => {
    // Negative slopes from difficulty 2 up: y = −2x is still proportional, and
    // a kid who has only ever seen upward lines does not really have the idea.
    const magnitude = rng.int(1, 3);
    const k = difficulty === 1 || rng.chance(0.5) ? magnitude : -magnitude;
    const x = rng.int(1, Math.floor(6 / magnitude));
    const coefficient = k === 1 ? '' : k === -1 ? '−' : `${k}`.replace('-', '−');

    // A word context on some seeds, the bare equation on others, so the same
    // skill is practised in both the abstract and the concrete.
    const contexts = [
      { label: 'metres every second', noun: 'A robot travels' },
      { label: 'dollars per hour', noun: 'A job pays' },
    ] as const;
    const useContext = k > 0 && rng.chance(0.4);
    const context = rng.pick(contexts);

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt: useContext
        ? `${context.noun} ${k} ${context.label}. Graph this proportional relationship by placing two points the line passes through.`
        : `Graph the line y = ${coefficient}x by placing two points it passes through.`,
      mode: { kind: 'line' },
      bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
      correctPoints: [
        { x: 0, y: 0 },
        { x, y: k * x },
      ],
      explanation:
        `y = ${coefficient}x has no added constant, so it passes through the origin (0, 0): when x is 0, y is 0. ` +
        `From there it ${k < 0 ? 'falls' : 'rises'} ${Math.abs(k)} for every 1 across, so (1, ${k}) and ` +
        `(${x}, ${k * x}) are both on it. Any two different points on that line are correct.`,
    };
  },
};

export const equationGenerators: QuestionGenerator[] = [
  solveTwoStep,
  expandDistributive,
  combineLikeTerms,
  solveInequality,
  wordEquation,
  plotProportional,
];

export const _round = round;
