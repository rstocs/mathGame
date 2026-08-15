import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/**
 * Connections that reach *above* the grade they sit in.
 *
 * These deliberately show a kid the next floor of the building: that slope is
 * a tangent, that an average rate approaches a derivative, that area under a
 * speed graph is distance. Each is answerable with the arithmetic they already
 * have — the new idea lives in the explanation, not in the computation.
 */

/** 8.EE.B.6 ↔ G-SRT.C.8 — slope is the tangent of the angle of inclination. */
export const slopeAsTangent: QuestionGenerator = {
  id: 'cx-slope-tangent',
  strand: 'ratios-proportions',
  describes: 'Connect the slope of a line to the tangent of its angle.',
  build: (rng, difficulty) => {
    if (difficulty === 3 && rng.chance(0.5)) {
      // The one angle a kid can name without a calculator.
      return {
        strand: 'ratios-proportions',
        type: 'numeric',
        prompt: 'A line has slope 1. What angle does it make with the x-axis, in degrees?',
        correctAnswer: 45,
        unit: 'degrees',
        explanation:
          `Slope 1 means the line rises exactly as fast as it runs, so the "slope triangle" has two equal legs — ` +
          `an isosceles right triangle, whose acute angles are both 45°. ` +
          `In symbols, slope = tan(θ), and tan(45°) = 1. ` +
          `This is the bridge between algebra and trigonometry: the slope you compute as rise ÷ run IS the tangent of ` +
          `the angle the line makes with the horizontal. Steeper line, bigger angle, bigger tangent.`,
      };
    }

    // A free rise/run rather than a short list of triples: tan is just the
    // quotient, so nothing needs to be a Pythagorean triple, and a fixed list
    // would give a kid the same eight ramps forever.
    const rise = rng.int(1, 12);
    const run = rng.int(1, 12);
    const scene = rng.pick([
      { thing: 'A ramp', ground: 'the ground' },
      { thing: 'A roof', ground: 'the horizontal' },
      { thing: 'A hillside path', ground: 'the flat' },
      { thing: 'A staircase', ground: 'the floor' },
    ] as const);
    const value = round(rise / run, 4);

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt:
        `${scene.thing} rises ${rise} m for every ${run} m it travels horizontally. ` +
        `If θ is the angle it makes with ${scene.ground}, what is tan(θ)? Round to 4 decimal places.`,
      correctAnswer: value,
      tolerance: 0.0005,
      explanation:
        `Draw the ramp as a right triangle: the rise ${rise} is the side OPPOSITE θ, and the run ${run} is ADJACENT. ` +
        `Tangent is opposite ÷ adjacent, so tan(θ) = ${rise} ÷ ${run} = ${value}. ` +
        `But rise ÷ run is also the definition of SLOPE — so slope and tan(θ) are the same number. ` +
        `That is why a line's steepness and its angle carry exactly the same information, and why ` +
        `θ = arctan(${value}) recovers the angle itself.`,
    };
  },
};

/** F-IF.B.6 ↔ calculus — average rate of change heading toward a derivative. */
export const averageRateToDerivative: QuestionGenerator = {
  id: 'cx-average-rate-derivative',
  strand: 'expressions-equations',
  describes: 'Watch an average rate of change approach the instantaneous rate.',
  build: (rng, difficulty) => {
    const a = rng.int(1, 10);
    const k = difficulty === 1 ? 1 : rng.int(1, 3);
    const h = rng.pick(difficulty === 1 ? [1, 2] : difficulty === 2 ? [0.5, 0.2] : [0.1, 0.01]);
    // For f(x) = kx², the average rate over [a, a+h] is exactly k(2a + h).
    const answer = round(k * (2 * a + h), 4);
    const end = round(a + h, 4);
    const fx = k === 1 ? 'x²' : `${k}x²`;
    const limit = 2 * k * a;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `For f(x) = ${fx}, what is the average rate of change from x = ${a} to x = ${end}? ` +
        `(That is, the slope of the line joining the two points.)`,
      correctAnswer: answer,
      tolerance: 0.0005,
      explanation:
        `Average rate of change is just slope between two points: (f(${end}) − f(${a})) ÷ (${end} − ${a}) = ` +
        `(${round(k * end * end, 4)} − ${k * a * a}) ÷ ${h} = ${answer}. ` +
        `Now watch what happens as the gap shrinks: the answer always works out to ${k === 1 ? '' : `${k} × `}(2 × ${a} + the gap), ` +
        `so gaps of 1, 0.5, 0.1, 0.01 give ${round(k * (2 * a + 1), 4)}, ${round(k * (2 * a + 0.5), 4)}, ` +
        `${round(k * (2 * a + 0.1), 4)}, ${round(k * (2 * a + 0.01), 4)} — closing in on ${limit}. ` +
        `That limit, ${limit}, is the INSTANTANEOUS rate of change at x = ${a}: the slope of the tangent line, ` +
        `what calculus calls the derivative. For f(x) = ${fx} it is always ${2 * k === 1 ? '' : 2 * k}x.`,
    };
  },
};

/** 6.RP ↔ calculus — the area under a rate graph is the total. */
export const areaUnderRate: QuestionGenerator = {
  id: 'cx-area-under-rate',
  strand: 'geometry',
  describes: 'See the area under a speed–time graph as distance travelled.',
  build: (rng, difficulty) => {
    const v1 = rng.int(20, 80);
    const t1 = rng.int(1, 4);
    const twoStage = difficulty > 1;
    const v2 = rng.int(20, 80);
    const t2 = rng.int(1, 4);
    const answer = twoStage ? v1 * t1 + v2 * t2 : v1 * t1;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: twoStage
        ? `A car drives at ${v1} km/h for ${t1} hour${t1 === 1 ? '' : 's'}, then at ${v2} km/h for ${t2} hour${t2 === 1 ? '' : 's'}. ` +
          `On a speed–time graph, what is the total AREA under the graph?`
        : `A car drives at a steady ${v1} km/h for ${t1} hour${t1 === 1 ? '' : 's'}. ` +
          `On a speed–time graph, what is the AREA under the graph?`,
      correctAnswer: answer,
      unit: 'km',
      explanation:
        `The graph is ${twoStage ? 'two rectangles' : 'a rectangle'}: height is speed, width is time. ` +
        `Area = ${v1} × ${t1}${twoStage ? ` + ${v2} × ${t2}` : ''} = ${answer}. ` +
        `Notice the units: (km/h) × (h) = km. The area is a DISTANCE. ` +
        `That is the whole idea behind integration — the area under a rate-of-something graph gives you the total ` +
        `amount of that something. Speed against time gives distance; flow rate against time gives volume.`,
    };
  },
};

/** A-REI.B.4 ↔ F-IF.C.8 — completing the square, the vertex, and −b/2a. */
export const vertexFromStandardForm: QuestionGenerator = {
  id: 'cx-vertex-axis-symmetry',
  strand: 'expressions-equations',
  describes: 'Link completing the square, the axis of symmetry, and −b/2a.',
  build: (rng) => {
    // b even keeps the vertex on a whole number.
    const b = rng.int(-6, 6) * 2 || 4;
    const c = rng.int(-9, 9);
    const vertexX = -b / 2;

    const middle = ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}x`;
    const constant = c === 0 ? '' : ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `What is the x-coordinate of the vertex of  y = x²${middle}${constant}?`,
      correctAnswer: vertexX,
      explanation:
        `Three different-looking methods land on the same number here. ` +
        `Completing the square turns x²${middle} into (x ${b / 2 < 0 ? '−' : '+'} ${Math.abs(b / 2)})² − ${(b / 2) ** 2}, ` +
        `and the vertex of (x − h)² is at h, so x = ${vertexX}. ` +
        `The formula −b ÷ 2a gives ${-b} ÷ 2 = ${vertexX}. ` +
        `And the quadratic formula's two roots sit symmetrically either side of −b ÷ 2a — that ± is exactly the ` +
        `same distance left and right of ${vertexX}. ` +
        `So the vertex, the axis of symmetry, and the midpoint of the roots are one point with three names.`,
    };
  },
};

/** F-BF.A.2 ↔ F-LE.A.2 — sequences are functions on the whole numbers. */
export const sequenceAsFunction: QuestionGenerator = {
  id: 'cx-sequence-as-function',
  strand: 'expressions-equations',
  describes: 'Recognise an arithmetic sequence as a linear function.',
  build: (rng, difficulty) => {
    const first = rng.int(-6, 12);
    const step = rng.int(2, 9) * (difficulty > 1 && rng.chance(0.4) ? -1 : 1);
    const shown = Array.from({ length: 4 }, (_, i) => first + step * i);
    const n = difficulty === 1 ? 10 : rng.int(12, 40);
    const answer = first + step * (n - 1);
    const zeroth = first - step;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `A sequence starts ${shown.join(', ')}, … What is the ${n}th term?`,
      correctAnswer: answer,
      explanation:
        `Counting up ${n} terms one at a time works but is slow. Instead treat the sequence as a LINE. ` +
        `The common difference ${step} is the slope — every step along adds ${step}. ` +
        `The "zeroth term", one step before the first, is ${first} − ${step} = ${zeroth}, and that is the y-intercept. ` +
        `So the rule is aₙ = ${step}n ${zeroth < 0 ? '−' : '+'} ${Math.abs(zeroth)}, giving a₍${n}₎ = ${step} × ${n} ${zeroth < 0 ? '−' : '+'} ${Math.abs(zeroth)} = ${answer}. ` +
        `An arithmetic sequence is simply a linear function whose inputs are 1, 2, 3, … instead of every real number — ` +
        `which is why its graph is a row of dots sitting on a straight line.`,
    };
  },
};

/** F-BF.B.4 — a logarithm is the exponential reflected in y = x. */
export const logAsReflection: QuestionGenerator = {
  id: 'cx-log-reflection',
  strand: 'expressions-equations',
  describes: 'See the log graph as the exponential graph reflected in y = x.',
  build: (rng) => {
    // Every base/exponent whose power still lands on the visible grid.
    const options = [
      [2, 1],
      [2, 2],
      [2, 3],
      [2, 4],
      [3, 1],
      [3, 2],
      [4, 1],
      [4, 2],
      [5, 1],
    ] as const;
    const [base, exponent] = rng.pick(options);
    const value = base ** exponent;
    // Asking it in both directions doubles the question space and makes the
    // point that neither function is the "real" one.
    const fromExponential = rng.chance(0.5);

    const given = fromExponential ? { x: exponent, y: value } : { x: value, y: exponent };
    const answer = fromExponential ? { x: value, y: exponent } : { x: exponent, y: value };

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt:
        `The point (${given.x}, ${given.y}) lies on y = ${fromExponential ? `${base}^x` : `log₍${base}₎(x)`}. ` +
        `Plot the matching point that must lie on y = ${fromExponential ? `log₍${base}₎(x)` : `${base}^x`}.`,
      mode: { kind: 'points', count: 1 },
      bounds: { xMin: 0, xMax: 20, yMin: 0, yMax: 20 },
      correctPoints: [answer],
      explanation:
        `A logarithm undoes an exponential, so their graphs are mirror images in the line y = x — ` +
        `and reflecting in y = x simply SWAPS the coordinates. ` +
        `(${given.x}, ${given.y}) becomes (${answer.x}, ${answer.y}). ` +
        `Check it directly: ${base}^${exponent} = ${value} says the same thing as log₍${base}₎(${value}) = ${exponent}. ` +
        `One sentence, read forwards and backwards. Every pair of inverse functions works this way — ` +
        `neither graph is the original, each is the other seen in a mirror.`,
    };
  },
};

/** S-CP ↔ A-APR.C.5 — Pascal's triangle, combinations, and binomials. */
export const pascalBinomial: QuestionGenerator = {
  id: 'cx-pascal-binomial',
  strand: 'statistics-probability',
  describes: 'Connect Pascal’s triangle, combinations, and binomial expansion.',
  build: (rng, difficulty) => {
    const n = rng.int(3, difficulty === 1 ? 4 : 6);
    const k = rng.int(1, n - 1);

    // C(n, k)
    let choose = 1;
    for (let i = 0; i < k; i += 1) choose = (choose * (n - i)) / (i + 1);
    choose = Math.round(choose);

    const askCoefficient = rng.chance(0.5);

    return {
      strand: 'statistics-probability',
      type: 'numeric',
      prompt: askCoefficient
        ? `In the expansion of (x + 1)^${n}, what is the coefficient of x^${n - k}?`
        : `How many ways can you choose ${k} items from ${n}?`,
      correctAnswer: choose,
      explanation:
        `The answer is ${choose}, and remarkably these are the same question. ` +
        `Expanding (x + 1)^${n} means multiplying ${n} brackets and choosing either x or 1 from each. ` +
        `To end up with x^${n - k} you pick the 1 from exactly ${k} of the ${n} brackets — so the coefficient COUNTS ` +
        `the ways of choosing ${k} things from ${n}, which is C(${n}, ${k}) = ${choose}. ` +
        `Row ${n} of Pascal's triangle lists those same numbers, and each entry is the sum of the two above it. ` +
        `Algebra, counting, and that triangle of numbers are three views of one object.`,
    };
  },
};

/** 7.SP.C ↔ 7.G.B — probability as a ratio of areas. */
export const geometricProbability: QuestionGenerator = {
  id: 'cx-geometric-probability',
  strand: 'statistics-probability',
  describes: 'Compute a probability as a ratio of areas.',
  build: (rng, difficulty) => {
    const inner = rng.int(1, 4);
    const outer = inner * rng.int(2, difficulty === 1 ? 3 : 5);
    const probability = round((inner * inner) / (outer * outer), 4);

    const { choices, correctIndex } = choicesFrom(
      rng,
      `${probability}`,
      [
        // Comparing side lengths instead of areas is the whole trap.
        `${round(inner / outer, 4)}`,
        `${round((inner * inner) / outer, 4)}`,
        `${round((2 * inner) / (2 * outer), 4)}`,
      ],
      (i) => `${round(probability / (i + 2), 4)}`,
    );

    return {
      strand: 'statistics-probability',
      type: 'multiple-choice',
      prompt:
        `A square target of side ${inner} m sits inside a square field of side ${outer} m. ` +
        `A ball lands at a completely random spot in the field. What is the probability it lands on the target?`,
      choices,
      correctIndex,
      explanation:
        `When every spot is equally likely, probability becomes a ratio of AREAS, not of lengths. ` +
        `The target is ${inner}² = ${inner * inner} m² and the field is ${outer}² = ${outer * outer} m², ` +
        `so the probability is ${inner * inner}/${outer * outer} = ${probability}. ` +
        `Comparing the sides — ${inner}/${outer} = ${round(inner / outer, 4)} — is the classic error, and it is the same ` +
        `mistake as forgetting that scaling a length by k scales area by k². ` +
        `This is where probability and geometry meet, and it is how continuous probability works.`,
    };
  },
};

/** 8.EE.B.6 — the similar-triangles argument for why a line has one slope. */
export const similarTrianglesSlope: QuestionGenerator = {
  id: 'cx-similar-triangles-slope',
  strand: 'geometry',
  describes: 'Use similar triangles to show slope is the same all along a line.',
  build: (rng, difficulty) => {
    const run1 = rng.int(2, 5);
    const rise1 = rng.int(2, 8);
    const k = rng.int(2, difficulty === 1 ? 3 : 5);
    const run2 = run1 * k;
    const rise2 = rise1 * k;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt:
        `On a straight line, one slope triangle has a run of ${run1} and a rise of ${rise1}. ` +
        `A second slope triangle on the SAME line has a run of ${run2}. What is its rise?`,
      correctAnswer: rise2,
      explanation:
        `Both triangles sit on the same line and both have a right angle, so they are SIMILAR — same shape, different size. ` +
        `The run grew from ${run1} to ${run2}, a factor of ${k}, so the rise must grow by the same factor: ` +
        `${rise1} × ${k} = ${rise2}. ` +
        `Check the slopes: ${rise1}/${run1} = ${round(rise1 / run1, 4)} and ${rise2}/${run2} = ${round(rise2 / run2, 4)}. Identical. ` +
        `This is the actual REASON a line has a single slope you can measure anywhere along it — similar triangles ` +
        `guarantee the ratio never changes. Geometry is what makes the algebra of slope legitimate.`,
    };
  },
};

export const advancedConnectionGenerators: QuestionGenerator[] = [
  slopeAsTangent,
  averageRateToDerivative,
  areaUnderRate,
  vertexFromStandardForm,
  sequenceAsFunction,
  logAsReflection,
  pascalBinomial,
  geometricProbability,
  similarTrianglesSlope,
];
