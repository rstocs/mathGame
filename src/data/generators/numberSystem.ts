import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/** Writes a signed number the way it should read inside an expression. */
function signed(value: number): string {
  return value < 0 ? `(${value})` : `${value}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** 7.NS.A.1 — add and subtract signed integers. */
export const signedAddSub: QuestionGenerator = {
  id: 'ns-signed-add-sub',
  strand: 'number-system',
  describes: 'Add or subtract positive and negative integers.',
  build: (rng, difficulty) => {
    const range = difficulty === 1 ? 12 : difficulty === 2 ? 25 : 60;
    const a = rng.int(-range, range);
    let b = rng.int(-range, range);
    // At least one operand must be negative. "1 + 12" is arithmetic a fifth
    // grader can do, and drills nothing in a signed-numbers level.
    if (a >= 0 && b >= 0) b = -(b || 1);
    const subtract = rng.chance(0.5);
    const answer = subtract ? a - b : a + b;

    const { choices, correctIndex } = choicesFrom(
      rng,
      `${answer}`,
      [
        // Sign slips are the errors worth surfacing here.
        `${subtract ? a + b : a - b}`,
        `${-answer}`,
        `${answer + rng.pick([-2, -1, 1, 2])}`,
      ],
      (i) => `${answer + (i + 3)}`,
    );

    return {
      strand: 'number-system',
      type: 'multiple-choice',
      prompt: `What is ${a} ${subtract ? '−' : '+'} ${signed(b)}?`,
      choices,
      correctIndex,
      explanation: subtract
        ? `Subtracting is adding the opposite: ${a} − ${signed(b)} becomes ${a} + ${signed(-b)}, which is ${answer}. ` +
          `On a number line you start at ${a} and move ${Math.abs(b)} to the ${-b < 0 ? 'left' : 'right'}.`
        : `Start at ${a} on the number line and move ${Math.abs(b)} to the ${b < 0 ? 'left' : 'right'}, landing on ${answer}. ` +
          `When the signs differ you subtract the sizes and keep the sign of the number that is further from zero.`,
    };
  },
};

/** 7.NS.A.2 — multiply and divide signed integers. */
export const signedMulDiv: QuestionGenerator = {
  id: 'ns-signed-mul-div',
  strand: 'number-system',
  describes: 'Multiply or divide positive and negative integers.',
  build: (rng, difficulty) => {
    const max = difficulty === 1 ? 8 : difficulty === 2 ? 12 : 15;
    const a = rng.int(2, max) * (rng.chance(0.5) ? 1 : -1);
    const b = rng.int(2, max) * (rng.chance(0.5) ? 1 : -1);
    const divide = rng.chance(0.5);
    // For division, build the dividend from the factors so it stays exact.
    const product = a * b;
    const answer = divide ? a : product;
    const prompt = divide
      ? `What is ${signed(product)} ÷ ${signed(b)}?`
      : `What is ${signed(a)} × ${signed(b)}?`;

    const sameSign = a < 0 === b < 0;

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt,
      correctAnswer: answer,
      explanation:
        `Work out the size first: ${Math.abs(divide ? product : a)} ${divide ? '÷' : '×'} ${Math.abs(b)} = ${Math.abs(answer)}. ` +
        `Then the sign: the two numbers have ${sameSign ? 'the SAME sign, so the result is positive' : 'DIFFERENT signs, so the result is negative'}. ` +
        `That gives ${answer}.`,
    };
  },
};

/** 7.NS.A.1 — add fractions with unlike denominators. */
export const fractionAdd: QuestionGenerator = {
  id: 'ns-fraction-add',
  strand: 'number-system',
  describes: 'Add fractions with unlike denominators.',
  build: (rng, difficulty) => {
    const denominators = difficulty === 1 ? [2, 3, 4, 6] : [3, 4, 5, 6, 8, 10, 12];
    let d1 = rng.pick(denominators);
    let d2 = rng.pick(denominators.filter((d) => d !== d1));
    if (d1 > d2) [d1, d2] = [d2, d1];

    const n1 = rng.int(1, d1 - 1);
    const n2 = rng.int(1, d2 - 1);

    const common = (d1 * d2) / gcd(d1, d2);
    const sumNumerator = n1 * (common / d1) + n2 * (common / d2);
    const g = gcd(sumNumerator, common);
    const finalN = sumNumerator / g;
    const finalD = common / g;
    const correct = finalD === 1 ? `${finalN}` : `${finalN}/${finalD}`;

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // The everlasting mistake: adding tops and bottoms straight across.
        `${n1 + n2}/${d1 + d2}`,
        `${sumNumerator}/${common}`,
        `${finalN + 1}/${finalD}`,
      ],
      (i) => `${finalN + i + 2}/${finalD}`,
    );

    return {
      strand: 'number-system',
      type: 'multiple-choice',
      prompt: `What is ${n1}/${d1} + ${n2}/${d2}?  Give your answer in simplest form.`,
      choices,
      correctIndex,
      explanation:
        `You can only add fractions once the denominators match. The least common denominator of ${d1} and ${d2} is ${common}, ` +
        `so ${n1}/${d1} = ${n1 * (common / d1)}/${common} and ${n2}/${d2} = ${n2 * (common / d2)}/${common}. ` +
        `Adding the numerators gives ${sumNumerator}/${common}` +
        (g > 1 ? `, which simplifies by ${g} to ${correct}.` : `, which is already in simplest form.`) +
        ` Note you never add the denominators together.`,
    };
  },
};

/** 7.NS.A.3 — order signed rationals on the number line. */
export const orderRationals: QuestionGenerator = {
  id: 'ns-order-rationals',
  strand: 'number-system',
  describes: 'Order signed decimals and integers from least to greatest.',
  build: (rng, difficulty) => {
    const count = difficulty === 1 ? 3 : 4;
    const values = new Set<number>();
    while (values.size < count) {
      const v = rng.chance(0.5) ? rng.int(-9, 9) : round(rng.int(-90, 90) / 10, 1);
      values.add(v);
    }
    const sorted = [...values].sort((a, b) => a - b);
    const labels = sorted.map((v) => `${v}`);

    return {
      strand: 'number-system',
      type: 'drag-drop-order',
      prompt: 'Put these numbers in order from least to greatest.',
      items: rng.shuffle(labels),
      correctOrder: labels,
      explanation:
        `In order: ${labels.join(' < ')}. On a number line, values further left are smaller, so every negative ` +
        `number is less than every positive one. Careful with negatives: −${Math.abs(sorted[0])} is SMALLER than ` +
        `−${Math.abs(sorted[0]) / 2}, even though ${Math.abs(sorted[0])} looks like the bigger number.`,
    };
  },
};

export const numberSystemGenerators: QuestionGenerator[] = [
  signedAddSub,
  signedMulDiv,
  fractionAdd,
  orderRationals,
];
