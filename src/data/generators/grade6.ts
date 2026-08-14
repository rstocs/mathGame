import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

function gcdOf(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcdOf(b, a % b);
}

function fraction(n: number, d: number): string {
  const g = gcdOf(n, d) || 1;
  const den = d / g;
  return den === 1 ? `${n / g}` : `${n / g}/${den}`;
}

/** 6.NS.A.1 — divide a fraction by a fraction. */
export const divideFractions: QuestionGenerator = {
  id: 'g6-divide-fractions',
  strand: 'number-system',
  describes: 'Divide a fraction by a fraction.',
  build: (rng, difficulty) => {
    const pool = difficulty === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6, 8];
    const d1 = rng.pick(pool);
    const n1 = rng.int(1, d1 - 1);
    const d2 = rng.pick(pool);
    const n2 = rng.int(1, d2 - 1);

    // a/b ÷ c/d = a/b × d/c
    const rawN = n1 * d2;
    const rawD = d1 * n2;
    const correct = fraction(rawN, rawD);

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // Multiplying straight across instead of flipping the second fraction.
        fraction(n1 * n2, d1 * d2),
        // Flipping the first fraction rather than the second.
        fraction(d1 * n2, n1 * d2),
        fraction(rawN + 1, rawD),
      ],
      (i) => fraction(rawN + i + 2, rawD),
    );

    return {
      strand: 'number-system',
      type: 'multiple-choice',
      prompt: `What is ${n1}/${d1} ÷ ${n2}/${d2}?  Give your answer in simplest form.`,
      choices,
      correctIndex,
      explanation:
        `Dividing by a fraction is multiplying by its reciprocal — flip the SECOND fraction and multiply. ` +
        `So ${n1}/${d1} ÷ ${n2}/${d2} becomes ${n1}/${d1} × ${d2}/${n2} = ${rawN}/${rawD}` +
        (gcdOf(rawN, rawD) > 1 ? `, which simplifies to ${correct}.` : `.`) +
        ` Flipping the first fraction instead is the usual slip.`,
    };
  },
};

/** 6.NS.B.4 — greatest common factor and least common multiple. */
export const gcfLcm: QuestionGenerator = {
  id: 'g6-gcf-lcm',
  strand: 'number-system',
  describes: 'Find the greatest common factor or least common multiple.',
  build: (rng, difficulty) => {
    // Build both numbers from a shared factor. Two random numbers are coprime
    // more often than not, and "the GCF of 5 and 12 is 1" drills nothing.
    const shared = rng.pick(difficulty === 1 ? [2, 3, 4] : [2, 3, 4, 5, 6]);
    const limit = difficulty === 1 ? 6 : 9;
    let m = rng.int(2, limit);
    let n = rng.int(2, limit);
    // Equal multipliers would make one number a duplicate of the other.
    if (m === n) n = n === limit ? n - 1 : n + 1;
    const a = shared * m;
    const b = shared * n;
    const wantGcf = rng.chance(0.5);
    const g = gcdOf(a, b);
    const lcm = (a * b) / g;
    const answer = wantGcf ? g : lcm;

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt: wantGcf
        ? `What is the greatest common factor of ${a} and ${b}?`
        : `What is the least common multiple of ${a} and ${b}?`,
      correctAnswer: answer,
      explanation: wantGcf
        ? `The GCF is the largest number that divides BOTH ${a} and ${b} exactly. That is ${g} ` +
          `(${a} ÷ ${g} = ${a / g} and ${b} ÷ ${g} = ${b / g}). The GCF is never bigger than the smaller number.`
        : `The LCM is the smallest number that BOTH ${a} and ${b} divide into. That is ${lcm} ` +
          `(${lcm} ÷ ${a} = ${lcm / a} and ${lcm} ÷ ${b} = ${lcm / b}). The LCM is never smaller than the larger number.`,
    };
  },
};

/** 6.NS.C.7 — absolute value and ordering signed numbers. */
export const absoluteValue: QuestionGenerator = {
  id: 'g6-absolute-value',
  strand: 'number-system',
  describes: 'Interpret absolute value as distance from zero.',
  build: (rng, difficulty) => {
    const value = rng.int(-30, 30) || -7;
    const asDecimal = difficulty > 1 && rng.chance(0.4);
    const shown = asDecimal ? round(value / 10, 1) : value;
    const answer = Math.abs(shown);

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt: `What is |${shown}|?`,
      correctAnswer: answer,
      tolerance: 1e-6,
      explanation:
        `The bars mean absolute value: the DISTANCE from zero on the number line, ignoring direction. ` +
        `${shown} sits ${answer} away from zero, so |${shown}| = ${answer}. ` +
        `Distance is never negative, which is why the answer is positive even when the number inside is not.`,
    };
  },
};

/** 6.NS.C.6 — plot points across all four quadrants. */
export const plotFourQuadrants: QuestionGenerator = {
  id: 'g6-plot-quadrants',
  strand: 'statistics-probability',
  describes: 'Plot ordered pairs including negative coordinates.',
  build: (rng, difficulty) => {
    const count = difficulty === 1 ? 1 : 2;
    const points: { x: number; y: number }[] = [];
    while (points.length < count) {
      const p = { x: rng.int(-8, 8), y: rng.int(-8, 8) };
      if (!points.some((q) => q.x === p.x && q.y === p.y)) points.push(p);
    }
    const first = points[0];
    const listed = points.map((p) => `(${p.x}, ${p.y})`).join(' and ');
    const quadrant =
      first.x === 0 || first.y === 0
        ? null
        : first.x > 0
          ? first.y > 0
            ? 'I'
            : 'IV'
          : first.y > 0
            ? 'II'
            : 'III';

    return {
      strand: 'statistics-probability',
      type: 'graph-plot',
      prompt: `Plot ${listed} on the grid.`,
      mode: { kind: 'points', count },
      bounds: { xMin: -8, xMax: 8, yMin: -8, yMax: 8 },
      correctPoints: points,
      explanation:
        `Start at the origin (0, 0). The first number moves you ${Math.abs(first.x)} to the ` +
        `${first.x < 0 ? 'LEFT (negative)' : 'right'}, and the second moves you ${Math.abs(first.y)} ` +
        `${first.y < 0 ? 'DOWN (negative)' : 'up'}. ` +
        (quadrant ? `That puts (${first.x}, ${first.y}) in quadrant ${quadrant}. ` : '') +
        `A negative sign flips the direction, not the order of the pair.`,
    };
  },
};

/** 6.EE.A.1–2 — evaluate an expression with an exponent. */
export const evaluateExpression: QuestionGenerator = {
  id: 'g6-evaluate-expression',
  strand: 'expressions-equations',
  describes: 'Evaluate an expression at a given value, including exponents.',
  build: (rng, difficulty) => {
    const coefficient = rng.int(2, 6);
    const constant = rng.int(1, 12);
    const x = rng.int(2, difficulty === 1 ? 5 : 9);
    const squared = difficulty > 1 && rng.chance(0.6);
    const answer = squared ? coefficient * x * x + constant : coefficient * x + constant;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: squared
        ? `Evaluate ${coefficient}x² + ${constant} when x = ${x}.`
        : `Evaluate ${coefficient}x + ${constant} when x = ${x}.`,
      correctAnswer: answer,
      explanation: squared
        ? `Substitute ${x} for x, then follow the order of operations — the exponent comes before the ` +
          `multiplication. So x² = ${x}² = ${x * x}, then ${coefficient} × ${x * x} = ${coefficient * x * x}, ` +
          `then add ${constant}: ${answer}. Note ${coefficient}x² squares only the x, not the ${coefficient}.`
        : `Substitute ${x} for x: ${coefficient} × ${x} = ${coefficient * x}, then add ${constant} to get ${answer}. ` +
          `${coefficient}x means ${coefficient} TIMES x, even though nothing is written between them.`,
    };
  },
};

/** 6.EE.B.7 — solve a one-step equation. */
export const oneStepEquation: QuestionGenerator = {
  id: 'g6-one-step-equation',
  strand: 'expressions-equations',
  describes: 'Solve a one-step equation by inverse operations.',
  build: (rng, difficulty) => {
    const x = rng.int(2, difficulty === 1 ? 12 : 25);
    const n = rng.int(2, difficulty === 1 ? 9 : 15);
    const kind = rng.pick(['add', 'subtract', 'multiply'] as const);

    const prompt =
      kind === 'add'
        ? `x + ${n} = ${x + n}`
        : kind === 'subtract'
          ? `x − ${n} = ${x - n}`
          : `${n}x = ${n * x}`;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `Solve for x:  ${prompt}`,
      correctAnswer: x,
      explanation:
        kind === 'add'
          ? `Undo the "+ ${n}" by subtracting ${n} from BOTH sides: x = ${x + n} − ${n} = ${x}.`
          : kind === 'subtract'
            ? `Undo the "− ${n}" by adding ${n} to BOTH sides: x = ${x - n} + ${n} = ${x}.`
            : `${n}x means ${n} times x, so undo it by dividing BOTH sides by ${n}: x = ${n * x} ÷ ${n} = ${x}.` +
              ` Subtracting ${n} would not work — it is multiplying, not adding.`,
    };
  },
};

/** 6.G.A.1 — area of triangles and parallelograms. */
export const areaOfFigures: QuestionGenerator = {
  id: 'g6-area-figures',
  strand: 'geometry',
  describes: 'Find the area of a triangle or parallelogram.',
  build: (rng, difficulty) => {
    const base = rng.int(3, difficulty === 1 ? 12 : 20);
    // Even heights keep a triangle's area whole.
    const height = rng.int(2, difficulty === 1 ? 6 : 10) * 2;
    const triangle = rng.chance(0.5);
    const answer = triangle ? (base * height) / 2 : base * height;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: triangle
        ? `A triangle has a base of ${base} cm and a height of ${height} cm. What is its area?`
        : `A parallelogram has a base of ${base} cm and a height of ${height} cm. What is its area?`,
      correctAnswer: answer,
      unit: 'square cm',
      explanation: triangle
        ? `A triangle is half the parallelogram that surrounds it, so area = ½ × base × height = ` +
          `½ × ${base} × ${height} = ${answer} square cm. Dropping the ½ doubles the answer.`
        : `A parallelogram can be cut and rearranged into a rectangle, so area = base × height = ` +
          `${base} × ${height} = ${answer} square cm. Use the perpendicular height, not the slanted side.`,
    };
  },
};

/** 6.SP.B.5 — mean, median, and mode of a data set. */
export const centerOfData: QuestionGenerator = {
  id: 'g6-center-of-data',
  strand: 'statistics-probability',
  describes: 'Find the median or mode of a data set.',
  build: (rng, difficulty) => {
    const count = difficulty === 1 ? 5 : 7;
    const values: number[] = [];
    while (values.length < count) values.push(rng.int(1, 20));
    // Guarantee a unique mode so the question has one answer.
    const repeated = values[0];
    values[1] = repeated;
    values[2] = repeated;

    const shuffled = rng.shuffle(values);
    const sorted = [...shuffled].sort((a, b) => a - b);
    const wantMedian = rng.chance(0.5);
    const median = sorted[(count - 1) / 2];
    const answer = wantMedian ? median : repeated;

    return {
      strand: 'statistics-probability',
      type: 'numeric',
      prompt: `Find the ${wantMedian ? 'median' : 'mode'} of:  ${shuffled.join(', ')}`,
      correctAnswer: answer,
      explanation: wantMedian
        ? `The median is the MIDDLE value once the data is in order. Sorted, the data is ` +
          `${sorted.join(', ')}, and with ${count} values the middle one is the ${(count + 1) / 2}th: ${median}. ` +
          `Sorting first is essential — the middle of the unsorted list is not the median.`
        : `The mode is the value that appears MOST often. Here ${repeated} appears ` +
          `${shuffled.filter((v) => v === repeated).length} times, more than any other, so the mode is ${repeated}. ` +
          `Mode is about frequency, not size.`,
    };
  },
};

export const grade6Generators: QuestionGenerator[] = [
  divideFractions,
  gcfLcm,
  absoluteValue,
  plotFourQuadrants,
  evaluateExpression,
  oneStepEquation,
  areaOfFigures,
  centerOfData,
];
