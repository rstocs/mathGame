import type { QuestionGenerator } from './types';
import { choicesFrom } from './types';

/** Renders ax + b with natural signs, omitting a 1 coefficient. */
function term(a: number, variable = 'x'): string {
  if (a === 1) return variable;
  if (a === -1) return `−${variable}`;
  return `${a}${variable}`.replace('-', '−');
}

/**
 * Renders "x² + bx + c" the way it would be written by hand: a coefficient of
 * 1 is implied ("− x", not "− 1x") and a zero term is dropped entirely.
 */
function quadraticText(b: number, c: number): string {
  const middle = b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
  const constant = c === 0 ? '' : ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
  return `x²${middle}${constant}`;
}

/** A-REI.B.3 — solve a linear equation with the variable on both sides. */
export const variableBothSides: QuestionGenerator = {
  id: 'g9-variable-both-sides',
  strand: 'expressions-equations',
  describes: 'Solve a linear equation with the variable on both sides.',
  build: (rng, difficulty) => {
    const x = rng.int(-9, 12);
    const a = rng.int(2, difficulty === 1 ? 6 : 10);
    // Coefficients must differ, or the x-terms cancel and there is no solution.
    const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== a));
    const c = rng.int(-12, 12);
    // a·x + c = b·x + d, solved so both sides agree at this x.
    const d = (a - b) * x + c;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `Solve for x:  ${term(a)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${term(b)} ${d < 0 ? '−' : '+'} ${Math.abs(d)}`,
      correctAnswer: x,
      explanation:
        `Collect the x-terms on one side and the numbers on the other. Subtracting ${term(b)} from both sides ` +
        `leaves ${term(a - b)} ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${d}. ` +
        `Then ${c < 0 ? 'add' : 'subtract'} ${Math.abs(c)}: ${term(a - b)} = ${d - c}. ` +
        `Dividing by ${a - b} gives x = ${x}. Whatever you do to one side you must do to the other.`,
    };
  },
};

/** A-SSE.B.3 / A-REI.B.4 — factor a quadratic. */
export const factorQuadratic: QuestionGenerator = {
  id: 'g9-factor-quadratic',
  strand: 'expressions-equations',
  describes: 'Factor a monic quadratic into two binomials.',
  build: (rng, difficulty) => {
    const range = difficulty === 1 ? 6 : 9;
    let p = rng.int(-range, range);
    let q = rng.int(-range, range);
    if (p === 0) p = 2;
    if (q === 0) q = -3;
    // x² + (p+q)x + pq  factors as (x + p)(x + q)
    const b = p + q;
    const c = p * q;

    const quadratic = quadraticText(b, c);
    const factored = `(x ${p < 0 ? '−' : '+'} ${Math.abs(p)})(x ${q < 0 ? '−' : '+'} ${Math.abs(q)})`;

    const { choices, correctIndex } = choicesFrom(
      rng,
      factored,
      [
        // Sign-flipped, and the classic swap of sum and product.
        `(x ${p < 0 ? '+' : '−'} ${Math.abs(p)})(x ${q < 0 ? '+' : '−'} ${Math.abs(q)})`,
        `(x ${p < 0 ? '−' : '+'} ${Math.abs(p)})(x ${q < 0 ? '+' : '−'} ${Math.abs(q)})`,
        `(x ${b < 0 ? '−' : '+'} ${Math.abs(b)})(x ${c < 0 ? '−' : '+'} ${Math.abs(c)})`,
      ],
      (i) => `(x + ${Math.abs(p) + i + 1})(x + ${Math.abs(q) + i + 1})`,
    );

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      prompt: `Factor:  ${quadratic}`,
      choices,
      correctIndex,
      explanation:
        `Look for two numbers that MULTIPLY to ${c} and ADD to ${b}. Those are ${p} and ${q}: ` +
        `${p} × ${q} = ${c} and ${p} + ${q} = ${b}. So ${quadratic} = ${factored}. ` +
        `You can check by expanding it back out. Mixing up which pair multiplies and which adds is the usual error.`,
    };
  },
};

/** A-REI.B.4 — solve a quadratic by factoring. */
export const solveQuadratic: QuestionGenerator = {
  id: 'g9-solve-quadratic',
  strand: 'expressions-equations',
  describes: 'Solve a quadratic equation by factoring.',
  build: (rng, difficulty) => {
    const range = difficulty === 1 ? 5 : 8;
    let r1 = rng.int(-range, range);
    let r2 = rng.int(-range, range);
    if (r1 === 0) r1 = 3;
    if (r2 === 0) r2 = -4;
    // Roots r1, r2 come from (x − r1)(x − r2) = x² − (r1+r2)x + r1·r2
    const b = -(r1 + r2);
    const c = r1 * r2;
    const roots = [r1, r2].sort((a, z) => a - z);
    const correct = roots[0] === roots[1] ? `x = ${roots[0]}` : `x = ${roots[0]} or x = ${roots[1]}`;

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // Forgetting to negate the roots when reading them off the factors.
        `x = ${-roots[0]} or x = ${-roots[1]}`,
        `x = ${roots[0]} or x = ${-roots[1]}`,
        `x = ${b} or x = ${c}`,
      ],
      (i) => `x = ${roots[0] + i + 1} or x = ${roots[1] + i + 2}`,
    );

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      prompt: `Solve:  ${quadraticText(b, c)} = 0`,
      choices,
      correctIndex,
      explanation:
        `Factor the left side into (x ${-r1 < 0 ? '−' : '+'} ${Math.abs(r1)})(x ${-r2 < 0 ? '−' : '+'} ${Math.abs(r2)}) = 0. ` +
        `If a product is 0 then one of the factors must be 0, so x ${-r1 < 0 ? '−' : '+'} ${Math.abs(r1)} = 0 or ` +
        `x ${-r2 < 0 ? '−' : '+'} ${Math.abs(r2)} = 0, giving ${correct}. ` +
        `Note the roots are the OPPOSITE sign of the numbers inside the brackets.`,
    };
  },
};

/** A-REI.C.6 — solve a system of two linear equations. */
export const linearSystem: QuestionGenerator = {
  id: 'g9-linear-system',
  strand: 'expressions-equations',
  describes: 'Solve a system of two linear equations.',
  build: (rng, difficulty) => {
    const x = rng.int(-6, 8);
    const y = rng.int(-6, 8);
    const a1 = rng.int(1, difficulty === 1 ? 3 : 5);
    const b1 = rng.int(1, 4);
    let a2 = rng.int(1, 5);
    let b2 = rng.int(-4, 4) || 2;
    // The determinant must be non-zero or the lines are parallel/identical.
    if (a1 * b2 - a2 * b1 === 0) {
      a2 += 1;
      if (a1 * b2 - a2 * b1 === 0) b2 -= 1;
    }
    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `Solve the system and give the value of x:\n` +
        `${term(a1)} + ${term(b1, 'y')} = ${c1}\n` +
        `${term(a2)} ${b2 < 0 ? '−' : '+'} ${term(Math.abs(b2), 'y')} = ${c2}`,
      correctAnswer: x,
      explanation:
        `Eliminate y. Multiply the first equation by ${Math.abs(b2)} and the second by ${b1}, so the y-terms match in size, ` +
        `then ${b2 < 0 ? 'add' : 'subtract'} the equations. That leaves a single equation in x, which solves to x = ${x}. ` +
        `(Substituting back gives y = ${y}, and you can check both original equations hold.)`,
    };
  },
};

/** F-BF.A.2 / F-LE.A.2 — the rule for an arithmetic sequence. */
export const arithmeticSequence: QuestionGenerator = {
  id: 'g9-arithmetic-sequence',
  strand: 'expressions-equations',
  describes: 'Find the next term or rule of an arithmetic sequence.',
  build: (rng, difficulty) => {
    const first = rng.int(-8, 12);
    const step = rng.int(2, 9) * (difficulty > 1 && rng.chance(0.4) ? -1 : 1);
    const shown = Array.from({ length: 4 }, (_, i) => first + step * i);
    const next = first + step * 4;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `What is the next term in this sequence?  ${shown.join(', ')}, …`,
      correctAnswer: next,
      explanation:
        `Each term changes by the same amount: ${shown[1]} − ${shown[0]} = ${step}, and the same gap holds all the way along. ` +
        `That constant difference makes it an arithmetic sequence, so the next term is ${shown[3]} ${step < 0 ? '−' : '+'} ${Math.abs(step)} = ${next}.`,
    };
  },
};

/** F-LE.A.1 — exponential growth. */
export const exponentialGrowth: QuestionGenerator = {
  id: 'g9-exponential-growth',
  strand: 'expressions-equations',
  describes: 'Evaluate exponential growth or decay.',
  build: (rng, difficulty) => {
    const start = rng.int(2, 10) * 10;
    const factor = rng.pick([2, 3]);
    const periods = difficulty === 1 ? rng.int(2, 3) : rng.int(3, 5);
    const answer = start * factor ** periods;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `A colony starts with ${start} bacteria and ${factor === 2 ? 'doubles' : 'triples'} every hour. ` +
        `How many are there after ${periods} hours?`,
      correctAnswer: answer,
      explanation:
        `Growth by a constant FACTOR each period is exponential, not linear: multiply by ${factor} each hour rather than ` +
        `adding. After ${periods} hours that is ${start} × ${factor}^${periods} = ${start} × ${factor ** periods} = ${answer}. ` +
        `Adding ${factor} each hour instead would give a far smaller, and wrong, answer.`,
    };
  },
};

/** A-SSE.A.1 / F-IF.A.2 — evaluate a function at a value. */
export const evaluateFunction: QuestionGenerator = {
  id: 'g9-evaluate-function',
  strand: 'expressions-equations',
  describes: 'Evaluate a function in function notation.',
  build: (rng, difficulty) => {
    const a = rng.int(2, 6);
    const b = rng.int(-9, 9);
    const input = rng.int(-6, 8);
    const quadratic = difficulty > 1 && rng.chance(0.5);
    const answer = quadratic ? a * input * input + b : a * input + b;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: quadratic
        ? `If f(x) = ${a}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}, what is f(${input})?`
        : `If f(x) = ${term(a)} ${b < 0 ? '−' : '+'} ${Math.abs(b)}, what is f(${input})?`,
      correctAnswer: answer,
      explanation: quadratic
        ? `f(${input}) means substitute ${input} for x: ${a} × (${input})² ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ` +
          `${a} × ${input * input} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${answer}. ` +
          `Square first, then multiply — and note (${input})² = ${input * input} is positive even when ${input} is negative.`
        : `f(${input}) means substitute ${input} for x: ${a} × ${input} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ` +
          `${a * input} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${answer}. ` +
          `f(${input}) is not f times ${input} — the brackets mean "the value of f at ${input}".`,
    };
  },
};

/** A-REI.D.10 — write the equation of a graphed line, as an expression. */
export const slopeInterceptForm: QuestionGenerator = {
  id: 'g9-slope-intercept',
  strand: 'expressions-equations',
  describes: 'Write the rule for a line from its slope and intercept.',
  build: (rng, difficulty) => {
    const slope = difficulty === 1 ? rng.int(1, 4) : rng.int(-5, 5) || 3;
    const intercept = rng.int(-8, 8);

    return {
      strand: 'expressions-equations',
      type: 'expression',
      prompt:
        `A line has slope ${slope} and crosses the y-axis at ${intercept}. ` +
        `Write the right-hand side of its equation y = …`,
      correctExpression: `${slope}x + ${intercept}`,
      variableLabel: 'x',
      explanation:
        `Slope-intercept form is y = mx + b, where m is the slope and b is the y-intercept. ` +
        `Here m = ${slope} and b = ${intercept}, so y = ${term(slope)} ${intercept < 0 ? '−' : '+'} ${Math.abs(intercept)}. ` +
        `The intercept is the value of y when x = 0.`,
    };
  },
};

/** A-REI.B.3 — solve a multi-step equation with parentheses. */
export const equationWithParentheses: QuestionGenerator = {
  id: 'g9-equation-parentheses',
  strand: 'expressions-equations',
  describes: 'Solve a linear equation that needs distributing first.',
  build: (rng, difficulty) => {
    const a = rng.int(2, difficulty === 1 ? 5 : 8);
    const b = rng.int(-8, 8) || 3;
    const x = rng.int(-8, 10);
    const c = rng.int(-10, 10);
    // a(x + b) + c = result
    const result = a * (x + b) + c;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `Solve for x:  ${a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) ${c < 0 ? '−' : '+'} ${Math.abs(c)} = ${result}`,
      correctAnswer: x,
      explanation:
        `Distribute first: ${a}(x ${b < 0 ? '−' : '+'} ${Math.abs(b)}) = ${a}x ${a * b < 0 ? '−' : '+'} ${Math.abs(a * b)}. ` +
        `The equation becomes ${a}x ${a * b + c < 0 ? '−' : '+'} ${Math.abs(a * b + c)} = ${result}. ` +
        `Then ${a}x = ${result - a * b - c}, so x = ${x}. ` +
        `The ${a} multiplies EVERYTHING inside the brackets, not just the x.`,
    };
  },
};

/** A-REI.D.12 — read the solution of an inequality on a number line. */
export const inequalityOnNumberLine: QuestionGenerator = {
  id: 'g9-inequality-number-line',
  strand: 'expressions-equations',
  describes: 'Match an inequality to its number-line description.',
  build: (rng, difficulty) => {
    const a = rng.int(2, 6) * (difficulty === 3 && rng.chance(0.5) ? -1 : 1);
    const x = rng.int(-6, 8);
    const r = a * x;
    const symbol = rng.pick(['>', '≥', '<', '≤'] as const);
    const flip: Record<string, string> = { '>': '<', '<': '>', '≥': '≤', '≤': '≥' };
    const solved = a < 0 ? flip[symbol] : symbol;
    const open = solved === '>' || solved === '<';
    const rightwards = solved === '>' || solved === '≥';

    const correct = `${open ? 'Open' : 'Closed'} circle at ${x}, shaded ${rightwards ? 'right' : 'left'}`;
    const choices = rng.shuffle([
      correct,
      `${open ? 'Closed' : 'Open'} circle at ${x}, shaded ${rightwards ? 'right' : 'left'}`,
      `${open ? 'Open' : 'Closed'} circle at ${x}, shaded ${rightwards ? 'left' : 'right'}`,
      `${open ? 'Closed' : 'Open'} circle at ${x}, shaded ${rightwards ? 'left' : 'right'}`,
    ]);

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      prompt: `Solve ${a === 1 ? 'x' : a === -1 ? '−x' : `${a}`.replace('-', '−') + 'x'} ${symbol} ${r} and describe its graph on a number line.`,
      choices,
      correctIndex: choices.indexOf(correct),
      explanation:
        `Divide both sides by ${a}` +
        (a < 0
          ? `, and because ${a} is NEGATIVE the sign flips: ${symbol} becomes ${solved}. `
          : `; since ${a} is positive the sign stays as ${solved}. `) +
        `That gives x ${solved} ${x}. ` +
        `A strict ${solved === '>' || solved === '<' ? 'inequality (> or <) uses an OPEN circle, because ' + x + ' itself is not included' : 'inequality (≥ or ≤) uses a CLOSED circle, because ' + x + ' itself IS included'}. ` +
        `Shade ${rightwards ? 'right, toward the larger numbers' : 'left, toward the smaller numbers'}.`,
    };
  },
};

/** F-IF.B.4 — read the vertex of a parabola in vertex form. */
export const parabolaVertex: QuestionGenerator = {
  id: 'g9-parabola-vertex',
  strand: 'expressions-equations',
  describes: 'Plot the vertex of a parabola given in vertex form.',
  build: (rng, difficulty) => {
    const h = rng.int(-6, 6);
    const k = rng.int(-6, 6);
    const a = difficulty === 1 ? 1 : rng.pick([-2, -1, 1, 2]);

    const lead = a === 1 ? '' : a === -1 ? '−' : `${a}`.replace('-', '−');

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt: `Plot the vertex of  y = ${lead}(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})² ${k < 0 ? '−' : '+'} ${Math.abs(k)}`,
      mode: { kind: 'points', count: 1 },
      bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      correctPoints: [{ x: h, y: k }],
      explanation:
        `In vertex form y = a(x − h)² + k the vertex is (h, k) — and the sign inside the bracket is FLIPPED. ` +
        `"(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})" means h = ${h}, and the ${k < 0 ? '− ' : '+ '}${Math.abs(k)} on the end means k = ${k}, ` +
        `so the vertex is (${h}, ${k}). ` +
        `The a = ${a} only decides how wide the parabola is and whether it opens ${a < 0 ? 'downward' : 'upward'} — it never moves the vertex.`,
    };
  },
};

/** A-CED.A.2 — build a linear model from a word problem. */
export const linearModel: QuestionGenerator = {
  id: 'g9-linear-model',
  strand: 'expressions-equations',
  describes: 'Model a real situation with a linear rule and evaluate it.',
  build: (rng, difficulty) => {
    const startFee = rng.int(10, 60);
    const perUnit = rng.int(2, 15);
    const units = rng.int(3, difficulty === 1 ? 10 : 25);
    const total = startFee + perUnit * units;

    const contexts = [
      { noun: 'A gym', fee: 'joining fee', unit: 'month', verb: 'membership' },
      { noun: 'A phone plan', fee: 'monthly charge', unit: 'gigabyte', verb: 'plan' },
      { noun: 'A taxi', fee: 'flag-drop charge', unit: 'kilometre', verb: 'ride' },
    ] as const;
    const c = rng.pick(contexts);

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `${c.noun} charges a ${startFee} dollar ${c.fee} plus ${perUnit} dollars per ${c.unit}. ` +
        `A ${c.verb} cost ${total} dollars in total. How many ${c.unit}s was it?`,
      correctAnswer: units,
      unit: `${c.unit}s`,
      explanation:
        `Write the rule first: cost = ${perUnit} × (number of ${c.unit}s) + ${startFee}, or y = ${perUnit}x + ${startFee}. ` +
        `The ${startFee} is the y-intercept — what you pay before any ${c.unit}s — and ${perUnit} is the slope. ` +
        `Setting ${perUnit}x + ${startFee} = ${total} gives ${perUnit}x = ${total - startFee}, so x = ${units}. ` +
        `The one-off fee is ADDED once, never multiplied by the number of ${c.unit}s.`,
    };
  },
};

/** A-APR.A.1 — add and subtract polynomials. */
export const polynomialAddSub: QuestionGenerator = {
  id: 'g9-polynomial-add-sub',
  strand: 'expressions-equations',
  describes: 'Add or subtract two polynomials.',
  build: (rng, difficulty) => {
    const a1 = rng.int(1, 8);
    const b1 = rng.int(-8, 8);
    const c1 = rng.int(-8, 8);
    const a2 = rng.int(1, 8);
    const b2 = rng.int(-8, 8);
    const c2 = rng.int(-8, 8);
    const subtract = difficulty > 1 && rng.chance(0.5);
    const sign = subtract ? -1 : 1;

    const term = (n: number) => (Math.abs(n) === 1 ? '' : `${Math.abs(n)}`);
    const poly = (a: number, b: number, c: number) =>
      `${term(a)}x² ${b < 0 ? '−' : '+'} ${term(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;

    return {
      strand: 'expressions-equations',
      type: 'expression',
      prompt: `Simplify:  (${poly(a1, b1, c1)}) ${subtract ? '−' : '+'} (${poly(a2, b2, c2)})`,
      correctExpression: `${a1 + sign * a2}x^2 + ${b1 + sign * b2}x + ${c1 + sign * c2}`,
      variableLabel: 'x',
      explanation:
        (subtract
          ? `Subtracting a bracket flips the sign of EVERY term inside it, not just the first. ` +
            `The second polynomial becomes ${-a2}x² ${-b2 < 0 ? '−' : '+'} ${Math.abs(b2)}x ${-c2 < 0 ? '−' : '+'} ${Math.abs(c2)}. `
          : '') +
        `Now combine like terms only: x² terms give ${a1} ${sign * a2 < 0 ? '−' : '+'} ${Math.abs(a2)} = ${a1 + sign * a2}, ` +
        `x terms give ${b1 + sign * b2}, and the plain numbers give ${c1 + sign * c2}. ` +
        `An x² term never combines with an x term — they count different things.`,
    };
  },
};

export const grade9Generators: QuestionGenerator[] = [
  equationWithParentheses,
  inequalityOnNumberLine,
  parabolaVertex,
  linearModel,
  polynomialAddSub,
  variableBothSides,
  factorQuadratic,
  solveQuadratic,
  linearSystem,
  arithmeticSequence,
  exponentialGrowth,
  evaluateFunction,
  slopeInterceptForm,
];
