import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/** Renders y = mx + b with natural signs. */
function lineEquation(m: number, b: number): string {
  const slope = m === 1 ? 'x' : m === -1 ? '−x' : `${m}x`.replace('-', '−');
  if (b === 0) return `y = ${slope}`;
  return `y = ${slope} ${b < 0 ? '−' : '+'} ${Math.abs(b)}`;
}

/** 8.EE.A.1 — integer exponent rules. */
export const exponentRules: QuestionGenerator = {
  id: 'g8-exponent-rules',
  strand: 'expressions-equations',
  describes: 'Apply the product, quotient, and power rules for exponents.',
  build: (rng, difficulty) => {
    const base = rng.int(2, difficulty === 1 ? 5 : 9);
    const p = rng.int(2, 6);
    const q = rng.int(2, 6);
    const kind = difficulty === 1 ? 'product' : rng.pick(['product', 'quotient', 'power'] as const);

    const exponent = kind === 'product' ? p + q : kind === 'quotient' ? p + q - q : p * q;
    const shown =
      kind === 'product'
        ? `${base}^${p} × ${base}^${q}`
        : kind === 'quotient'
          ? `${base}^${p + q} ÷ ${base}^${q}`
          : `(${base}^${p})^${q}`;
    const correct = `${base}^${kind === 'quotient' ? p : exponent}`;
    const finalExponent = kind === 'quotient' ? p : exponent;

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // The reliable error for each rule: multiplying the exponents when you
        // should add them, and vice versa.
        `${base}^${kind === 'product' ? p * q : kind === 'quotient' ? p + q : p + q}`,
        `${base * base}^${finalExponent}`,
        `${base}^${finalExponent + 1}`,
      ],
      (i) => `${base}^${finalExponent + i + 2}`,
    );

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      prompt: `Write ${shown} as a single power of ${base}.`,
      choices,
      correctIndex,
      explanation:
        kind === 'product'
          ? `Multiplying powers of the same base ADDS the exponents: ${base}^${p} × ${base}^${q} = ${base}^(${p}+${q}) = ${correct}. ` +
            `The base stays ${base} — you never multiply the bases together.`
          : kind === 'quotient'
            ? `Dividing powers of the same base SUBTRACTS the exponents: ${base}^${p + q} ÷ ${base}^${q} = ${base}^(${p + q}−${q}) = ${correct}.`
            : `A power raised to a power MULTIPLIES the exponents: (${base}^${p})^${q} = ${base}^(${p}×${q}) = ${correct}. ` +
              `Adding them here is the usual slip.`,
    };
  },
};

/** 8.EE.A.4 — scientific notation. */
export const scientificNotation: QuestionGenerator = {
  id: 'g8-scientific-notation',
  strand: 'expressions-equations',
  describes: 'Convert between standard form and scientific notation.',
  build: (rng, difficulty) => {
    const mantissa = round(rng.int(11, 99) / 10, 1);
    const exponent = difficulty === 1 ? rng.int(2, 4) : rng.int(-5, 7) || 3;
    const value = mantissa * 10 ** exponent;
    // toFixed avoids JS printing 1.2e+21 style output back at the kid.
    const standard = exponent >= 0 ? value.toLocaleString('en-US') : value.toFixed(Math.abs(exponent) + 1);
    const correct = `${mantissa} × 10^${exponent}`;

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        `${mantissa} × 10^${-exponent}`,
        `${mantissa * 10} × 10^${exponent - 1}`,
        `${mantissa} × 10^${exponent + 1}`,
      ],
      (i) => `${mantissa} × 10^${exponent - i - 2}`,
    );

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      prompt: `Write ${standard} in scientific notation.`,
      choices,
      correctIndex,
      explanation:
        `Scientific notation is one non-zero digit before the decimal point, times a power of 10. ` +
        `Moving the point to get ${mantissa} takes ${Math.abs(exponent)} place${Math.abs(exponent) === 1 ? '' : 's'} ` +
        `to the ${exponent >= 0 ? 'left' : 'right'}, so the exponent is ${exponent}. That gives ${correct}. ` +
        `A ${exponent >= 0 ? 'large' : 'small'} number takes a ${exponent >= 0 ? 'positive' : 'negative'} exponent.`,
    };
  },
};

/** 8.EE.B.6 / 8.F.B.4 — slope from two points. */
export const slopeFromPoints: QuestionGenerator = {
  id: 'g8-slope-from-points',
  strand: 'expressions-equations',
  describes: 'Find the slope of the line through two points.',
  build: (rng, difficulty) => {
    const x1 = rng.int(-6, 6);
    // Keep the run non-zero (no undefined slope) and exact (whole-number slope).
    const run = rng.pick([1, 2, 3, 4].filter((r) => Math.abs(x1 + r) <= 9));
    const x2 = x1 + run;
    const slope = difficulty === 1 ? rng.int(1, 4) : rng.int(-5, 5) || 2;
    const y1 = rng.int(-8, 8);
    const y2 = y1 + slope * run;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `What is the slope of the line through (${x1}, ${y1}) and (${x2}, ${y2})?`,
      correctAnswer: slope,
      explanation:
        `Slope is rise over run: (y₂ − y₁) ÷ (x₂ − x₁) = (${y2} − ${y1}) ÷ (${x2} − ${x1}) = ` +
        `${y2 - y1} ÷ ${run} = ${slope}. Keep the points in the same order top and bottom — swapping one but ` +
        `not the other flips the sign.`,
    };
  },
};

/** 8.F.A.3 / 8.EE.B.6 — graph a line from its equation. */
export const graphLine: QuestionGenerator = {
  id: 'g8-graph-line',
  strand: 'expressions-equations',
  describes: 'Graph a line given in slope-intercept form.',
  build: (rng, difficulty) => {
    const slope = difficulty === 1 ? rng.int(1, 2) : rng.pick([-3, -2, -1, 1, 2, 3]);
    const intercept = rng.int(-3, 3);
    // Second point must stay on the visible grid.
    const run = Math.abs(slope) <= 1 ? 2 : 1;
    const x2 = run;
    const y2 = slope * x2 + intercept;

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt: `Graph ${lineEquation(slope, intercept)} by placing two points the line passes through.`,
      mode: { kind: 'line' },
      bounds: { xMin: -6, xMax: 6, yMin: -6, yMax: 6 },
      correctPoints: [
        { x: 0, y: intercept },
        { x: x2, y: y2 },
      ],
      explanation:
        `In y = mx + b, b is where the line crosses the y-axis, so start at (0, ${intercept}). ` +
        `The slope ${slope} means ${slope < 0 ? 'down' : 'up'} ${Math.abs(slope)} for every 1 across, ` +
        `which lands on (${x2}, ${y2}). Any two points on that line are correct.`,
    };
  },
};

/** 8.G.B.7 — Pythagorean theorem. */
export const pythagorean: QuestionGenerator = {
  id: 'g8-pythagorean',
  strand: 'geometry',
  describes: 'Find a missing side of a right triangle.',
  build: (rng, difficulty) => {
    // Primitive triples keep the answer whole; scaling them multiplies the
    // question space so a kid replaying does not meet the same triangle twice.
    const primitives = [
      [3, 4, 5],
      [5, 12, 13],
      [8, 15, 17],
      [7, 24, 25],
      [20, 21, 29],
      [9, 40, 41],
    ] as const;
    const primitive = rng.pick(difficulty === 1 ? primitives.slice(0, 2) : primitives);
    const scale = difficulty === 1 ? 1 : rng.int(1, 4);
    const [a0, b0, c0] = primitive;
    // Randomise which leg is named first, so the shape of the question varies too.
    const swapLegs = rng.chance(0.5);
    const a = (swapLegs ? b0 : a0) * scale;
    const b = (swapLegs ? a0 : b0) * scale;
    const c = c0 * scale;
    const findHypotenuse = difficulty === 1 || rng.chance(0.6);

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: findHypotenuse
        ? `A right triangle has legs of ${a} and ${b}. How long is the hypotenuse?`
        : `A right triangle has a hypotenuse of ${c} and one leg of ${a}. How long is the other leg?`,
      correctAnswer: findHypotenuse ? c : b,
      explanation: findHypotenuse
        ? `a² + b² = c², so ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. The hypotenuse is √${c * c} = ${c}. ` +
          `The hypotenuse is always the longest side, opposite the right angle.`
        : `Rearrange a² + b² = c² to b² = c² − a²: ${c}² − ${a}² = ${c * c} − ${a * a} = ${b * b}, so the leg is √${b * b} = ${b}. ` +
          `Subtract here rather than add — the hypotenuse ${c} is already the longest side.`,
    };
  },
};

/** 8.G.C.9 — volume of cylinders, cones, and spheres. */
export const volumeOfSolids: QuestionGenerator = {
  id: 'g8-volume-solids',
  strand: 'geometry',
  describes: 'Find the volume of a cylinder, cone, or sphere.',
  build: (rng, difficulty) => {
    const radius = rng.int(2, difficulty === 1 ? 6 : 10);
    const height = rng.int(3, 12);
    const shape = difficulty === 1 ? 'cylinder' : rng.pick(['cylinder', 'cone', 'sphere'] as const);

    const volume =
      shape === 'cylinder'
        ? Math.PI * radius * radius * height
        : shape === 'cone'
          ? (Math.PI * radius * radius * height) / 3
          : (4 / 3) * Math.PI * radius ** 3;
    const answer = round(volume, 2);

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt:
        shape === 'sphere'
          ? `A sphere has a radius of ${radius} cm. What is its volume? Use π ≈ 3.14, rounded to 2 decimal places.`
          : `A ${shape} has a radius of ${radius} cm and a height of ${height} cm. What is its volume? Use π ≈ 3.14, rounded to 2 decimal places.`,
      correctAnswer: answer,
      tolerance: Math.max(1, answer * 0.01),
      unit: 'cubic cm',
      explanation:
        shape === 'cylinder'
          ? `Volume of a cylinder = πr²h = 3.14 × ${radius}² × ${height} = 3.14 × ${radius * radius} × ${height} ≈ ${answer} cubic cm.`
          : shape === 'cone'
            ? `A cone is exactly one third of the cylinder with the same base and height: V = ⅓πr²h = ` +
              `(3.14 × ${radius * radius} × ${height}) ÷ 3 ≈ ${answer} cubic cm. Forgetting the ⅓ gives triple the right answer.`
            : `Volume of a sphere = 4/3 πr³ = (4 ÷ 3) × 3.14 × ${radius}³ = (4 ÷ 3) × 3.14 × ${radius ** 3} ≈ ${answer} cubic cm. ` +
              `Cube the radius, not square it — a sphere is three-dimensional.`,
    };
  },
};

/** 8.NS.A.1 — rational vs irrational. */
export const rationalOrIrrational: QuestionGenerator = {
  id: 'g8-rational-irrational',
  strand: 'number-system',
  describes: 'Tell rational numbers from irrational ones.',
  build: (rng) => {
    const perfectSquares = [4, 9, 16, 25, 36, 49, 64, 81, 100];
    const nonSquares = [2, 3, 5, 6, 7, 8, 10, 11, 12, 15];
    const irrational = rng.chance(0.5);
    const n = irrational ? rng.pick(nonSquares) : rng.pick(perfectSquares);
    const value = `√${n}`;
    const correct = irrational ? 'Irrational' : 'Rational';
    const choices = ['Rational', 'Irrational'];

    return {
      strand: 'number-system',
      type: 'multiple-choice',
      prompt: `Is ${value} rational or irrational?`,
      choices,
      correctIndex: choices.indexOf(correct),
      explanation: irrational
        ? `${n} is not a perfect square, so ${value} cannot be written as a fraction of two integers — its decimal ` +
          `never ends and never repeats. That makes it irrational. (${value} ≈ ${round(Math.sqrt(n), 4)}…)`
        : `${n} is a perfect square: ${Math.sqrt(n)} × ${Math.sqrt(n)} = ${n}, so ${value} = ${Math.sqrt(n)} exactly. ` +
          `A whole number is a fraction over 1, so it is rational. A square root is only irrational when the number under it is not a perfect square.`,
    };
  },
};

/** 8.SP.A.1 — read association off a scatter plot description. */
export const scatterAssociation: QuestionGenerator = {
  id: 'g8-scatter-association',
  strand: 'statistics-probability',
  describes: 'Identify the association shown by a scatter plot.',
  build: (rng) => {
    const kind = rng.pick(['positive', 'negative', 'none'] as const);
    const contexts = {
      positive: { x: 'hours spent studying', y: 'test score', verb: 'rises' },
      negative: { x: 'hours of TV watched', y: 'test score', verb: 'falls' },
      none: { x: 'shoe size', y: 'test score', verb: 'shows no pattern' },
    } as const;
    const c = contexts[kind];
    const labels = { positive: 'Positive association', negative: 'Negative association', none: 'No association' };
    const correct = labels[kind];
    const choices = rng.shuffle([labels.positive, labels.negative, labels.none]);

    return {
      strand: 'statistics-probability',
      type: 'multiple-choice',
      prompt: `A scatter plot compares ${c.x} against ${c.y}. As ${c.x} increases, ${c.y} ${c.verb}. What association is this?`,
      choices,
      correctIndex: choices.indexOf(correct),
      explanation:
        kind === 'none'
          ? `The points are scattered with no upward or downward trend, so there is no association. ` +
            `${c.x} tells you nothing useful about ${c.y}.`
          : `As one goes up the other goes ${kind === 'positive' ? 'up' : 'down'} too, so this is a ${kind} association. ` +
            `A ${kind} association means the points trend ${kind === 'positive' ? 'upward' : 'downward'} from left to right. ` +
            `Remember association is not proof of cause.`,
    };
  },
};

export const grade8Generators: QuestionGenerator[] = [
  exponentRules,
  scientificNotation,
  slopeFromPoints,
  graphLine,
  pythagorean,
  volumeOfSolids,
  rationalOrIrrational,
  scatterAssociation,
];
