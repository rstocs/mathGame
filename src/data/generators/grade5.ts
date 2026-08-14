import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b);
}

/** Renders n/d, reducing it and dropping a denominator of 1. */
function fraction(n: number, d: number): string {
  const g = gcd(n, d) || 1;
  const num = n / g;
  const den = d / g;
  return den === 1 ? `${num}` : `${num}/${den}`;
}

/** 5.OA.A.1 — order of operations with parentheses. */
export const orderOfOperations: QuestionGenerator = {
  id: 'g5-order-of-operations',
  strand: 'expressions-equations',
  describes: 'Evaluate an expression using the order of operations.',
  build: (rng, difficulty) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const c = rng.int(2, 9);
    const withParens = difficulty > 1 && rng.chance(0.5);

    // a + b × c   vs   (a + b) × c — the same numbers, different answers, which
    // is exactly the point of the standard.
    const expression = withParens ? `(${a} + ${b}) × ${c}` : `${a} + ${b} × ${c}`;
    const answer = withParens ? (a + b) * c : a + b * c;
    const wrongWay = withParens ? a + b * c : (a + b) * c;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `What is ${expression}?`,
      correctAnswer: answer,
      explanation: withParens
        ? `Parentheses come first: ${a} + ${b} = ${a + b}. Then multiply: ${a + b} × ${c} = ${answer}. ` +
          `Without the parentheses you would multiply first and get ${wrongWay} instead — the brackets change the answer.`
        : `Multiplication comes before addition, so do ${b} × ${c} = ${b * c} first, then add: ${a} + ${b * c} = ${answer}. ` +
          `Working strictly left to right would give ${wrongWay}, which is the usual mistake.`,
    };
  },
};

/** 5.NBT.A.2 — multiplying and dividing by powers of 10. */
export const powersOfTen: QuestionGenerator = {
  id: 'g5-powers-of-ten',
  strand: 'number-system',
  describes: 'Multiply or divide a decimal by a power of 10.',
  build: (rng, difficulty) => {
    const base = round(rng.int(105, 999) / 100, 2);
    const power = difficulty === 1 ? rng.int(1, 2) : rng.int(1, 3);
    const multiply = rng.chance(0.5);
    const answer = round(multiply ? base * 10 ** power : base / 10 ** power, 6);

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt: `What is ${base} ${multiply ? '×' : '÷'} ${(10 ** power).toLocaleString('en-US')}?`,
      correctAnswer: answer,
      tolerance: 1e-6,
      explanation:
        `Multiplying or dividing by a power of 10 just slides the decimal point. ` +
        `${(10 ** power).toLocaleString('en-US')} is 10 to the power ${power}, so the point moves ${power} ` +
        `place${power === 1 ? '' : 's'} to the ${multiply ? 'right' : 'left'}: ${base} becomes ${answer}. ` +
        `The digits never change, only where the point sits.`,
    };
  },
};

/** 5.NBT.B.7 — add and subtract decimals. */
export const decimalAddSub: QuestionGenerator = {
  id: 'g5-decimal-add-sub',
  strand: 'number-system',
  describes: 'Add or subtract decimals to hundredths.',
  build: (rng, difficulty) => {
    const places = difficulty === 1 ? 10 : 100;
    const a = round(rng.int(150, 990) / places, 2);
    const b = round(rng.int(20, 140) / places, 2);
    const add = rng.chance(0.5);
    const answer = round(add ? a + b : a - b, 2);

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt: `What is ${a} ${add ? '+' : '−'} ${b}?`,
      correctAnswer: answer,
      tolerance: 1e-6,
      explanation:
        `Line the decimal points up under each other, then ${add ? 'add' : 'subtract'} as usual and bring the ` +
        `point straight down: ${a} ${add ? '+' : '−'} ${b} = ${answer}. ` +
        `Lining up the last digits instead of the points is what goes wrong most often.`,
    };
  },
};

/** 5.NF.B.4 — multiply fractions. */
export const multiplyFractions: QuestionGenerator = {
  id: 'g5-multiply-fractions',
  strand: 'ratios-proportions',
  describes: 'Multiply two fractions.',
  build: (rng, difficulty) => {
    const d1 = rng.pick(difficulty === 1 ? [2, 3, 4] : [3, 4, 5, 6, 8]);
    const n1 = rng.int(1, d1 - 1);
    const d2 = rng.pick(difficulty === 1 ? [2, 3, 4] : [3, 4, 5, 6, 8]);
    const n2 = rng.int(1, d2 - 1);

    const rawN = n1 * n2;
    const rawD = d1 * d2;
    const correct = fraction(rawN, rawD);

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // Cross-multiplying, and adding instead of multiplying.
        fraction(n1 * d2, d1 * n2),
        fraction(n1 + n2, d1 + d2),
        fraction(rawN + 1, rawD),
      ],
      (i) => fraction(rawN + i + 2, rawD),
    );

    return {
      strand: 'ratios-proportions',
      type: 'multiple-choice',
      prompt: `What is ${n1}/${d1} × ${n2}/${d2}?  Give your answer in simplest form.`,
      choices,
      correctIndex,
      explanation:
        `To multiply fractions, multiply straight across: tops together and bottoms together. ` +
        `${n1} × ${n2} = ${rawN} and ${d1} × ${d2} = ${rawD}, giving ${rawN}/${rawD}` +
        (gcd(rawN, rawD) > 1 ? `, which simplifies to ${correct}.` : `.`) +
        ` Unlike adding, you do NOT need a common denominator here.`,
    };
  },
};

/** 5.NF.B.7 — divide a whole number by a unit fraction. */
export const divideUnitFraction: QuestionGenerator = {
  id: 'g5-divide-unit-fraction',
  strand: 'ratios-proportions',
  describes: 'Divide a whole number by a unit fraction.',
  build: (rng, difficulty) => {
    const whole = rng.int(2, difficulty === 1 ? 6 : 12);
    const denominator = rng.pick([2, 3, 4, 5, 6, 8]);
    const answer = whole * denominator;

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt: `What is ${whole} ÷ 1/${denominator}?`,
      correctAnswer: answer,
      explanation:
        `Dividing asks "how many of these fit inside?". Each whole contains ${denominator} pieces of size ` +
        `1/${denominator}, so ${whole} wholes contain ${whole} × ${denominator} = ${answer} of them. ` +
        `That is why dividing by a fraction less than 1 makes the answer BIGGER, not smaller.`,
    };
  },
};

/** 5.MD.C.5 — volume of a rectangular prism. */
export const prismVolume: QuestionGenerator = {
  id: 'g5-prism-volume',
  strand: 'geometry',
  describes: 'Find the volume of a rectangular prism.',
  build: (rng, difficulty) => {
    const max = difficulty === 1 ? 6 : 12;
    const l = rng.int(2, max);
    const w = rng.int(2, max);
    const h = rng.int(2, max);

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: `A box is ${l} cm long, ${w} cm wide, and ${h} cm tall. What is its volume?`,
      correctAnswer: l * w * h,
      unit: 'cubic cm',
      explanation:
        `Volume of a box = length × width × height = ${l} × ${w} × ${h} = ${l * w * h} cubic cm. ` +
        `You can picture it as ${l * w} cubes covering the bottom layer, stacked ${h} layers high. ` +
        `Volume is in CUBIC units because it fills space.`,
    };
  },
};

/** 5.MD.A.1 — convert within the metric system. */
export const metricConversion: QuestionGenerator = {
  id: 'g5-metric-conversion',
  strand: 'geometry',
  describes: 'Convert between metric units.',
  build: (rng, difficulty) => {
    const conversions = [
      { from: 'metres', to: 'centimetres', factor: 100 },
      { from: 'kilometres', to: 'metres', factor: 1000 },
      { from: 'kilograms', to: 'grams', factor: 1000 },
      { from: 'litres', to: 'millilitres', factor: 1000 },
    ] as const;
    const c = rng.pick(conversions);
    const amount = difficulty === 1 ? rng.int(2, 9) : round(rng.int(15, 95) / 10, 1);
    const answer = round(amount * c.factor, 4);

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: `How many ${c.to} are in ${amount} ${c.from}?`,
      correctAnswer: answer,
      unit: c.to,
      explanation:
        `There are ${c.factor.toLocaleString('en-US')} ${c.to} in 1 ${c.from.replace(/s$/, '')}, so multiply: ` +
        `${amount} × ${c.factor.toLocaleString('en-US')} = ${answer.toLocaleString('en-US')} ${c.to}. ` +
        `Going to a SMALLER unit means more of them, so the number gets bigger — that is the check to run.`,
    };
  },
};

/** 5.G.A.1–2 — plot points in the first quadrant. */
export const plotFirstQuadrant: QuestionGenerator = {
  id: 'g5-plot-points',
  strand: 'statistics-probability',
  describes: 'Plot ordered pairs on a first-quadrant coordinate grid.',
  build: (rng, difficulty) => {
    const count = difficulty === 1 ? 1 : 2;
    const points: { x: number; y: number }[] = [];
    while (points.length < count) {
      const p = { x: rng.int(0, 10), y: rng.int(0, 10) };
      if (!points.some((q) => q.x === p.x && q.y === p.y)) points.push(p);
    }
    const listed = points.map((p) => `(${p.x}, ${p.y})`).join(' and ');

    return {
      strand: 'statistics-probability',
      type: 'graph-plot',
      prompt: `Plot ${listed} on the grid.`,
      mode: { kind: 'points', count },
      bounds: { xMin: 0, xMax: 10, yMin: 0, yMax: 10 },
      correctPoints: points,
      explanation:
        `In an ordered pair the FIRST number is x — how far across from the corner — and the second is y, how far up. ` +
        `For ${listed.split(' and ')[0]}, go ${points[0].x} across and then ${points[0].y} up. ` +
        `Swapping the two is the classic mistake: (${points[0].x}, ${points[0].y}) and (${points[0].y}, ${points[0].x}) ` +
        `are different places unless the numbers happen to match.`,
    };
  },
};

export const grade5Generators: QuestionGenerator[] = [
  orderOfOperations,
  powersOfTen,
  decimalAddSub,
  multiplyFractions,
  divideUnitFraction,
  prismVolume,
  metricConversion,
  plotFirstQuadrant,
];
