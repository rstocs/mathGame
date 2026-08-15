import type { QuestionGenerator } from './types';

/**
 * Renders a signed term the way it is written by hand. On a term carrying a
 * variable a coefficient of 1 is implied — "− x", never "− 1x".
 */
function signed(value: number, suffix = ''): string {
  const magnitude = suffix !== '' && Math.abs(value) === 1 ? '' : `${Math.abs(value)}`;
  return `${value < 0 ? '− ' : '+ '}${magnitude}${suffix}`;
}

/** A leading (unsigned-position) term, using the same minus glyph as signed(). */
function lead(value: number): string {
  return value < 0 ? `−${Math.abs(value)}` : `${value}`;
}

/** A-REI.B.4 — solve a quadratic with the quadratic formula. */
export const quadraticFormula: QuestionGenerator = {
  id: 'g11-quadratic-formula',
  strand: 'expressions-equations',
  describes: 'Solve a quadratic using the quadratic formula.',
  build: (rng, difficulty) => {
    // Build from roots so the discriminant is a perfect square and the answers
    // stay exact — the formula is the skill here, not decimal arithmetic.
    const a = difficulty === 1 ? 1 : rng.int(1, 3);
    const r1 = rng.int(-6, 6);
    // The roots must differ, or "give the LARGER root" has no meaning.
    let r2 = rng.int(-6, 6);
    if (r2 === r1) r2 = r1 === 6 ? r1 - 1 : r1 + 1;
    const b = -a * (r1 + r2);
    const c = a * r1 * r2;
    const roots = [r1, r2].sort((x, y) => x - y);
    const larger = roots[1];

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `Solve with the quadratic formula and give the LARGER root:  ` +
        `${a === 1 ? '' : a}x² ${signed(b, 'x')} ${signed(c)} = 0`,
      correctAnswer: larger,
      explanation:
        `x = (−b ± √(b² − 4ac)) ÷ 2a with a = ${a}, b = ${b}, c = ${c}. ` +
        `The discriminant is ${b}² − 4(${a})(${c}) = ${b * b - 4 * a * c}, and √${b * b - 4 * a * c} = ${Math.sqrt(b * b - 4 * a * c)}. ` +
        `So x = (${-b} ± ${Math.sqrt(b * b - 4 * a * c)}) ÷ ${2 * a}, giving x = ${roots[0]} and x = ${roots[1]}. ` +
        `The larger is ${larger}. Note −b means the OPPOSITE of b, so with b = ${b} it is ${-b}.`,
    };
  },
};

/** A-REI.B.4b — what the discriminant tells you. */
export const discriminant: QuestionGenerator = {
  id: 'g11-discriminant',
  strand: 'expressions-equations',
  describes: 'Use the discriminant to count a quadratic’s real roots.',
  build: (rng) => {
    const a = rng.int(1, 4);
    const kind = rng.pick(['two', 'one', 'none'] as const);

    let b: number;
    let c: number;
    if (kind === 'one') {
      // A perfect square trinomial: b² = 4ac exactly.
      const r = rng.int(1, 6);
      b = 2 * a * r;
      c = a * r * r;
    } else if (kind === 'two') {
      // A negative c makes −4ac positive, so the discriminant must be positive.
      b = rng.int(5, 12);
      c = -rng.int(1, 6);
    } else {
      // c must be strictly greater than b²/4a, or the discriminant lands on 0
      // and the question would claim "no real roots" about a repeated root.
      b = rng.int(1, 6);
      c = Math.floor((b * b) / (4 * a)) + rng.int(1, 5);
    }

    const value = b * b - 4 * a * c;
    const labels = { two: 'Two real roots', one: 'One real root', none: 'No real roots' };
    const correct = labels[kind];
    const choices = rng.shuffle([labels.two, labels.one, labels.none]);

    return {
      strand: 'expressions-equations',
      type: 'multiple-choice',
      primer:
        'The "roots" of an equation are the x-values that make it true. The DISCRIMINANT is the quantity b² − 4ac ' +
        'built from the coefficients, and its sign alone tells you how many real roots there are — no solving needed.',
      prompt: `How many real roots does ${a === 1 ? '' : a}x² ${signed(b, 'x')} ${signed(c)} = 0 have?`,
      choices,
      correctIndex: choices.indexOf(correct),
      explanation:
        `The discriminant is b² − 4ac = ${b}² − 4(${a})(${c}) = ${value}. ` +
        (value > 0
          ? `It is POSITIVE, so the square root is a real number and there are two distinct real roots — the parabola crosses the x-axis twice.`
          : value === 0
            ? `It is exactly ZERO, so the ± adds nothing and both roots are the same — the parabola just touches the x-axis.`
            : `It is NEGATIVE, and no real number squares to a negative, so there are no real roots — the parabola misses the x-axis entirely.`),
    };
  },
};

/** A-APR.A.1 — multiply two binomials. */
export const multiplyBinomials: QuestionGenerator = {
  id: 'g11-multiply-binomials',
  strand: 'expressions-equations',
  describes: 'Expand the product of two binomials.',
  build: (rng, difficulty) => {
    const a = difficulty === 1 ? 1 : rng.int(1, 4);
    const b = rng.int(-8, 8) || 3;
    const c = difficulty === 1 ? 1 : rng.int(1, 4);
    const d = rng.int(-8, 8) || -5;

    const first = `(${a === 1 ? '' : a}x ${signed(b)})`;
    const second = `(${c === 1 ? '' : c}x ${signed(d)})`;

    return {
      strand: 'expressions-equations',
      type: 'expression',
      prompt: `Expand ${first}${second}.`,
      correctExpression: `${a * c}x^2 + ${a * d + b * c}x + ${b * d}`,
      // Without this a kid can retype the prompt: it is equivalent by definition.
      rejectSameAs: `(${a === 1 ? '' : a}x${b < 0 ? `-${Math.abs(b)}` : `+${b}`})(${c === 1 ? '' : c}x${d < 0 ? `-${Math.abs(d)}` : `+${d}`})`,
      variableLabel: 'x',
      explanation:
        `Use FOIL — every term in the first bracket times every term in the second. ` +
        `First: ${a === 1 ? '' : a}x × ${c === 1 ? '' : c}x = ${a * c}x². ` +
        `Outer and Inner: ${a * d}x and ${b * c}x, which combine to ${a * d + b * c}x. ` +
        `Last: (${b}) × (${d}) = ${b * d}. ` +
        `Altogether that is ${a * c}x² ${signed(a * d + b * c, 'x')} ${signed(b * d)}. ` +
        `Multiplying only the first and last terms is the classic slip.`,
    };
  },
};

/** N-RN.A.2 — rational exponents. */
export const rationalExponents: QuestionGenerator = {
  id: 'g11-rational-exponents',
  strand: 'number-system',
  describes: 'Evaluate a power with a fractional exponent.',
  build: (rng, difficulty) => {
    const root = rng.pick(difficulty === 1 ? [2, 3] : [2, 3, 4]);
    const base = rng.int(2, root === 2 ? 12 : root === 3 ? 5 : 4);
    const power = difficulty === 1 ? 1 : rng.int(1, 3);
    const value = base ** root; // so value^(1/root) = base exactly
    const answer = base ** power;

    return {
      strand: 'number-system',
      type: 'numeric',
      primer:
        'An exponent can be a fraction. The BOTTOM number is a root: x^(1/2) is the square root of x, and x^(1/3) is ' +
        'the cube root. The TOP number is an ordinary power.',
      prompt: `What is ${value}^(${power}/${root})?`,
      correctAnswer: answer,
      explanation:
        `A fractional exponent is a root and a power together: the BOTTOM is the root, the TOP is the power. ` +
        `So ${value}^(${power}/${root}) means take the ${root}${root === 2 ? 'nd' : root === 3 ? 'rd' : 'th'} root of ${value}, ` +
        `which is ${base}, then raise it to the power ${power}: ${base}^${power} = ${answer}. ` +
        `Taking the root first keeps the numbers small — raising to the power first works too but gets large fast.`,
    };
  },
};

/** F-LE.A.4 — evaluate a logarithm. */
export const logarithms: QuestionGenerator = {
  id: 'g11-logarithm',
  strand: 'expressions-equations',
  describes: 'Evaluate a logarithm as the exponent it asks for.',
  build: (rng, difficulty) => {
    const base = rng.pick(difficulty === 1 ? [2, 10] : [2, 3, 4, 5, 10]);
    const exponent = rng.int(1, base === 2 ? 7 : base === 10 ? 4 : 4);
    const value = base ** exponent;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      primer:
        `A logarithm asks a question about powers. log₍${base}₎(N) means "what power do I raise ${base} to, in order ` +
        `to get N?" For example log₍${base}₎(${base}) = 1, because ${base}¹ = ${base}.`,
      prompt: `What is log₍${base}₎(${value.toLocaleString('en-US')})?`,
      correctAnswer: exponent,
      explanation:
        `A logarithm asks: "what power do I raise the base to, to get this number?" ` +
        `Here that is ${base}^? = ${value.toLocaleString('en-US')}. Since ${base}^${exponent} = ${value.toLocaleString('en-US')}, ` +
        `log₍${base}₎(${value.toLocaleString('en-US')}) = ${exponent}. ` +
        `The answer to a log is always an EXPONENT, which is why it is so much smaller than the number inside.`,
    };
  },
};

/** F-LE.A.4 — solve an exponential equation. */
export const exponentialEquation: QuestionGenerator = {
  id: 'g11-exponential-equation',
  strand: 'expressions-equations',
  describes: 'Solve an exponential equation by matching bases.',
  build: (rng, difficulty) => {
    const base = rng.pick([2, 3, 5]);
    const x = rng.int(2, 5);
    const multiplier = difficulty === 1 ? 1 : rng.int(2, 6);
    const value = multiplier * base ** x;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        multiplier === 1
          ? `Solve for x:  ${base}^x = ${value.toLocaleString('en-US')}`
          : `Solve for x:  ${multiplier} × ${base}^x = ${value.toLocaleString('en-US')}`,
      correctAnswer: x,
      explanation:
        (multiplier === 1
          ? ''
          : `First divide both sides by ${multiplier}: ${base}^x = ${value / multiplier}. `) +
        `Now write ${value / multiplier} as a power of ${base}: ${base}^${x} = ${value / multiplier}. ` +
        `Once the bases match, the exponents must match too, so x = ${x}. ` +
        `Dividing by the ${multiplier === 1 ? 'coefficient' : multiplier} first is essential — you cannot bring it into the exponent.`,
    };
  },
};

/** F-BF.A.1c — compose two functions. */
export const functionComposition: QuestionGenerator = {
  id: 'g11-function-composition',
  strand: 'expressions-equations',
  describes: 'Evaluate a composition of two functions.',
  build: (rng, difficulty) => {
    const a = rng.int(2, 5);
    const b = rng.int(-8, 8);
    const c = rng.int(2, 5);
    const d = rng.int(-8, 8);
    const input = rng.int(-4, difficulty === 1 ? 5 : 8);

    const gValue = c * input + d;
    const answer = a * gValue + b;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      primer:
        'f(x) and g(x) are two different rules. f(g(3)) means: put 3 into g first, then take whatever comes out and ' +
        'put THAT into f. Work from the inside outwards, like nested brackets.',
      prompt:
        `If f(x) = ${a}x ${signed(b)} and g(x) = ${c}x ${signed(d)}, what is f(g(${input}))?`,
      correctAnswer: answer,
      explanation:
        `Work from the INSIDE out. First g(${input}) = ${c} × ${input} ${signed(d)} = ${gValue}. ` +
        `Then feed that into f: f(${gValue}) = ${a} × ${gValue} ${signed(b)} = ${answer}. ` +
        `f(g(x)) is not f(x) × g(x), and the order matters — g(f(${input})) would give a different answer.`,
    };
  },
};

/** A-SSE.B.4 / F-BF.A.2 — geometric sequences. */
export const geometricSequence: QuestionGenerator = {
  id: 'g11-geometric-sequence',
  strand: 'expressions-equations',
  describes: 'Continue a geometric sequence.',
  build: (rng, difficulty) => {
    const first = rng.int(1, 8);
    const ratio = rng.pick(difficulty === 1 ? [2, 3] : [2, 3, 4, 5]);
    const shown = Array.from({ length: 4 }, (_, i) => first * ratio ** i);
    const next = first * ratio ** 4;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `What is the next term in this sequence?  ${shown.join(', ')}, …`,
      correctAnswer: next,
      explanation:
        `Each term is MULTIPLIED by the same number, not added to. ` +
        `${shown[1]} ÷ ${shown[0]} = ${ratio}, and the same ratio holds all the way along, so this is geometric. ` +
        `The next term is ${shown[3]} × ${ratio} = ${next.toLocaleString('en-US')}. ` +
        `Looking for a constant difference instead of a constant ratio is what trips people up here.`,
    };
  },
};

/** N-CN.A.1 — powers of i and arithmetic with complex numbers. */
export const complexNumbers: QuestionGenerator = {
  id: 'g11-complex-numbers',
  strand: 'number-system',
  describes: 'Simplify a power of i, or add complex numbers.',
  build: (rng, difficulty) => {
    const powerQuestion = difficulty === 1 || rng.chance(0.5);

    if (powerQuestion) {
      const n = rng.int(2, 40);
      const cycle = ['1', 'i', '−1', '−i'];
      const correct = cycle[n % 4];
      const choices = rng.shuffle([...cycle]);

      return {
        strand: 'number-system',
        type: 'multiple-choice',
        primer:
          'i is the imaginary unit, defined by i² = −1 — it is the number whose square is negative one. ' +
          'Powers of i cycle: i¹ = i, i² = −1, i³ = −i, i⁴ = 1, and then it repeats.',
        prompt: `Simplify i^${n}.`,
        choices,
        correctIndex: choices.indexOf(correct),
        explanation:
          `Powers of i repeat in a cycle of four: i¹ = i, i² = −1, i³ = −i, i⁴ = 1, then it starts over. ` +
          `So divide the exponent by 4 and keep the remainder: ${n} ÷ 4 leaves ${n % 4}, ` +
          `which gives ${correct}. Only the remainder matters, however large the exponent gets.`,
      };
    }

    const a = rng.int(-9, 9);
    const b = rng.int(-9, 9) || 2;
    const c = rng.int(-9, 9);
    const d = rng.int(-9, 9) || -3;
    const realPart = a + c;

    return {
      strand: 'number-system',
      type: 'numeric',
      // Leading terms use the same unicode minus as the signed() helper, so one
      // expression does not mix "-9" with "− 2i".
      primer:
        'A complex number looks like a + bi, where i is the imaginary unit. The plain number a is called the REAL ' +
        'part and b is the imaginary part. They are kept separate, like apples and oranges.',
      prompt: `What is the REAL part of (${lead(a)} ${signed(b, 'i')}) + (${lead(c)} ${signed(d, 'i')})?`,
      correctAnswer: realPart,
      explanation:
        `Add complex numbers by keeping the real and imaginary parts apart, like combining like terms. ` +
        `The real parts are ${a} and ${c}, giving ${a} ${signed(c)} = ${realPart}. ` +
        `(The imaginary parts give ${b + d}i separately.) You never mix a plain number with an i term.`,
    };
  },
};

export const grade11Generators: QuestionGenerator[] = [
  quadraticFormula,
  discriminant,
  multiplyBinomials,
  rationalExponents,
  logarithms,
  exponentialEquation,
  functionComposition,
  geometricSequence,
  complexNumbers,
];
