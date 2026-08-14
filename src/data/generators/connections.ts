import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/**
 * Cross-topic questions.
 *
 * Every generator here deliberately spans two ideas a curriculum usually keeps
 * in separate chapters, and its explanation names the link out loud: solving a
 * system IS finding where two lines cross; factoring IS finding where a
 * parabola meets the x-axis; a unit rate IS a slope. The point is not extra
 * drill, it is the sentence "these are the same thing".
 */

/** A-REI.C.6 ↔ A-REI.D.11 — a system's solution is the intersection point. */
export const systemAsIntersection: QuestionGenerator = {
  id: 'cx-system-intersection',
  strand: 'expressions-equations',
  describes: 'See a system of equations as the point where two lines cross.',
  build: (rng, difficulty) => {
    // Build both lines through a chosen lattice point so the solution is exact.
    const x = rng.int(-5, 5);
    const y = rng.int(-5, 5);
    const m1 = rng.int(-3, 3) || 1;
    let m2 = rng.int(-3, 3) || -2;
    // Different slopes, or the lines are parallel and never meet.
    if (m2 === m1) m2 = m1 + 1;
    const b1 = y - m1 * x;
    const b2 = y - m2 * x;

    const line = (m: number, b: number) =>
      `y = ${m === 1 ? '' : m === -1 ? '−' : `${m}`.replace('-', '−')}x` +
      (b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b)}`);

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt:
        `Solve this system by graphing — plot the point where the two lines meet.\n` +
        `${line(m1, b1)}\n${line(m2, b2)}`,
      mode: { kind: 'points', count: 1 },
      bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      correctPoints: [{ x, y }],
      explanation:
        `Solving a system and finding where two lines CROSS are the same job. ` +
        `A solution has to satisfy both equations at once, and a point on both lines is exactly that. ` +
        `Substituting x = ${x} into the first line gives ${m1} × ${x} ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${y}, ` +
        `and into the second gives ${m2} × ${x} ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)} = ${y} — the same y, which is why they meet there. ` +
        `So x = ${x}, y = ${y} is the algebraic answer AND the intersection point on the graph — one fact, two languages.` +
        (difficulty > 1
          ? ` If the slopes were equal the lines would be parallel, and the system would have no solution at all.`
          : ''),
    };
  },
};

/** A-SSE.B.3 ↔ F-IF.C.7 — factors give the x-intercepts of a parabola. */
export const factorsAsIntercepts: QuestionGenerator = {
  id: 'cx-factors-intercepts',
  strand: 'expressions-equations',
  describes: 'Connect the factors of a quadratic to where its graph crosses the x-axis.',
  build: (rng) => {
    let r1 = rng.int(-6, 6);
    let r2 = rng.int(-6, 6);
    if (r1 === 0) r1 = 2;
    if (r2 === 0) r2 = -3;
    if (r1 === r2) r2 = r1 === 6 ? r1 - 1 : r1 + 1;
    const b = -(r1 + r2);
    const c = r1 * r2;
    const roots = [r1, r2].sort((a, z) => a - z);

    const middle = b === 0 ? '' : ` ${b < 0 ? '−' : '+'} ${Math.abs(b) === 1 ? '' : Math.abs(b)}x`;
    const constant = c === 0 ? '' : ` ${c < 0 ? '−' : '+'} ${Math.abs(c)}`;
    const quadratic = `y = x²${middle}${constant}`;

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt: `The parabola ${quadratic} crosses the x-axis at two points. Plot both of them.`,
      mode: { kind: 'points', count: 2 },
      bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      correctPoints: [
        { x: roots[0], y: 0 },
        { x: roots[1], y: 0 },
      ],
      explanation:
        `Crossing the x-axis means y = 0, so this asks you to solve x²${middle}${constant} = 0 — and that is exactly factoring. ` +
        `It factors as (x ${-r1 < 0 ? '−' : '+'} ${Math.abs(r1)})(x ${-r2 < 0 ? '−' : '+'} ${Math.abs(r2)}), giving roots ${roots[0]} and ${roots[1]}. ` +
        `So the ROOTS of the equation, the ZEROS of the function, and the X-INTERCEPTS of the graph are three names for one thing. ` +
        `Note both points have y = 0, because every point on the x-axis does.`,
    };
  },
};

/** 7.RP.A.2 ↔ 8.EE.B.5 — a unit rate is the slope of its graph. */
export const rateAsSlope: QuestionGenerator = {
  id: 'cx-rate-as-slope',
  strand: 'ratios-proportions',
  describes: 'Recognise a unit rate as the slope of a proportional graph.',
  build: (rng, difficulty) => {
    const rate = rng.int(2, difficulty === 1 ? 6 : 12);
    const contexts = [
      { noun: 'A cyclist rides', unit: 'kilometres', per: 'hour', x: 'hours', y: 'kilometres' },
      { noun: 'A printer prints', unit: 'pages', per: 'minute', x: 'minutes', y: 'pages' },
      { noun: 'A tap fills', unit: 'litres', per: 'second', x: 'seconds', y: 'litres' },
    ] as const;
    const c = rng.pick(contexts);

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt:
        `${c.noun} ${rate} ${c.unit} every ${c.per}. If you graph ${c.y} against ${c.x}, ` +
        `what is the SLOPE of the line?`,
      correctAnswer: rate,
      explanation:
        `A unit rate and a slope are the same number wearing different clothes. ` +
        `The rate is ${rate} ${c.unit} per ${c.per}. Slope is rise over run — here the rise is ${c.y} and the run is ${c.x} — ` +
        `so moving 1 ${c.per} across raises the line ${rate}, and the slope is ${rate}. ` +
        `Because 0 ${c.x} gives 0 ${c.y}, the line also passes through the origin, which is what makes the relationship proportional.`,
    };
  },
};

/** 8.G.B.7 ↔ G-GPE.B.7 — the distance formula is the Pythagorean theorem. */
export const distanceIsPythagoras: QuestionGenerator = {
  id: 'cx-distance-pythagoras',
  strand: 'geometry',
  describes: 'See the distance formula as the Pythagorean theorem in disguise.',
  build: (rng) => {
    const triples = [
      [3, 4, 5],
      [6, 8, 10],
      [5, 12, 13],
      [8, 15, 17],
    ] as const;
    const [dx, dy, d] = rng.pick(triples);
    const x1 = rng.int(-6, 2);
    const y1 = rng.int(-6, 2);
    const x2 = x1 + dx;
    const y2 = y1 + dy;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt:
        `Draw a right triangle with the segment from (${x1}, ${y1}) to (${x2}, ${y2}) as its hypotenuse, ` +
        `and its legs along the grid lines. How long is the hypotenuse?`,
      correctAnswer: d,
      explanation:
        `The horizontal leg is ${dx} long and the vertical leg is ${dy}, so Pythagoras gives ` +
        `${dx}² + ${dy}² = ${dx * dx} + ${dy * dy} = ${d * d}, and the hypotenuse is √${d * d} = ${d}. ` +
        `That IS the distance formula: √((x₂−x₁)² + (y₂−y₁)²) is just a² + b² = c² rewritten with coordinates. ` +
        `There is nothing new to memorise — the two gaps between the points are the two legs.`,
    };
  },
};

/** 7.RP.A.3 ↔ F-LE.A.1 — repeated percent change is exponential. */
export const percentAsExponential: QuestionGenerator = {
  id: 'cx-percent-exponential',
  strand: 'ratios-proportions',
  describes: 'Connect repeated percent increase to exponential growth.',
  build: (rng, difficulty) => {
    const percent = rng.pick([10, 20, 25, 50, 100]);
    const start = rng.int(2, 20) * 100;
    const years = difficulty === 1 ? 2 : rng.int(2, 4);
    const multiplier = 1 + percent / 100;
    const answer = round(start * multiplier ** years, 2);
    const linearWrong = round(start + (percent / 100) * start * years, 2);

    const { choices, correctIndex } = choicesFrom(
      rng,
      `${answer}`,
      [
        // Treating repeated percent growth as if it were linear.
        `${linearWrong}`,
        `${round(start * multiplier, 2)}`,
        `${round(start * (1 + (percent * years) / 100), 2)}`,
      ],
      (i) => `${round(answer + (i + 1) * start * 0.1, 2)}`,
    );

    return {
      strand: 'ratios-proportions',
      type: 'multiple-choice',
      prompt:
        `A town of ${start.toLocaleString('en-US')} people grows by ${percent}% every year. ` +
        `What is the population after ${years} years?`,
      choices,
      correctIndex,
      explanation:
        `Growing by ${percent}% means multiplying by ${multiplier} — the original 100% plus another ${percent}%. ` +
        `Doing that ${years} times is ${start.toLocaleString('en-US')} × ${multiplier}^${years} = ${answer.toLocaleString('en-US')}. ` +
        `This is why repeated percent change is EXPONENTIAL, not linear: each year's growth is calculated on the new, larger number. ` +
        `Adding ${percent}% of the ORIGINAL every year would give ${linearWrong.toLocaleString('en-US')}, which is the classic mistake.`,
    };
  },
};

/** 7.G.A.1 ↔ G-SRT — scaling lengths squares the area. */
export const scaleFactorArea: QuestionGenerator = {
  id: 'cx-scale-area',
  strand: 'geometry',
  describes: 'Connect a length scale factor to how area and volume change.',
  build: (rng, difficulty) => {
    const scale = rng.int(2, 5);
    const area = rng.int(2, 20) * 3;
    const askVolume = difficulty === 3 && rng.chance(0.5);
    const answer = askVolume ? area * scale ** 3 : area * scale * scale;

    const { choices, correctIndex } = choicesFrom(
      rng,
      `${answer}`,
      [
        // Scaling area by the length factor, the single most common error.
        `${area * scale}`,
        `${area * scale * (askVolume ? 2 : 1) || area * 2}`,
        `${askVolume ? area * scale * scale : area * scale * scale * scale}`,
      ],
      (i) => `${answer + (i + 1) * area}`,
    );

    return {
      strand: 'geometry',
      type: 'multiple-choice',
      prompt:
        `A shape has ${askVolume ? 'a volume' : 'an area'} of ${area} ${askVolume ? 'cubic' : 'square'} cm. ` +
        `Every length is multiplied by ${scale}. What is the new ${askVolume ? 'volume' : 'area'}?`,
      choices,
      correctIndex,
      explanation:
        `Area is a length times a length, so scaling every length by ${scale} scales area by ${scale} × ${scale} = ${scale * scale}. ` +
        (askVolume
          ? `Volume is length times length times length, so it scales by ${scale}³ = ${scale ** 3}: ${area} × ${scale ** 3} = ${answer}. `
          : `So the new area is ${area} × ${scale * scale} = ${answer}. `) +
        `The trap is multiplying by just ${scale} — but that is what happens to a LENGTH, not to ${askVolume ? 'a volume' : 'an area'}. ` +
        `Doubling a photo's width and height gives four times the paper, not twice.`,
    };
  },
};

/** 6.NS.C.7 ↔ 8.G — absolute value is distance. */
export const absoluteValueAsDistance: QuestionGenerator = {
  id: 'cx-absolute-distance',
  strand: 'number-system',
  describes: 'See |a − b| as the distance between two numbers.',
  build: (rng, difficulty) => {
    const a = rng.int(-20, 20);
    let b = rng.int(-20, 20);
    if (b === a) b = a + 5;
    const answer = Math.abs(a - b);
    const context = difficulty > 1 && rng.chance(0.5);

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt: context
        ? `A submarine is at ${Math.min(a, b)} m and a drone is at ${Math.max(a, b)} m, measuring from sea level. ` +
          `How far apart are they?`
        : `What is |${a} − (${b})|?`,
      correctAnswer: answer,
      explanation:
        `Subtracting gives ${a} − (${b}) = ${a - b}, and the bars take the absolute value: ${answer}. ` +
        `The reason |a − b| is the DISTANCE between two numbers is that distance has no direction — ` +
        `going from ${a} to ${b} and from ${b} to ${a} covers the same ground, and the absolute value throws away the sign that ` +
        `told you which way. It is the one-dimensional version of the distance formula.`,
    };
  },
};

/** 6.SP.B.5 ↔ 6.EE — running the mean backwards to find a total. */
export const meanBackwards: QuestionGenerator = {
  id: 'cx-mean-backwards',
  strand: 'statistics-probability',
  describes: 'Work backwards from a mean to a total or a missing value.',
  build: (rng, difficulty) => {
    const count = rng.int(4, 8);
    const mean = rng.int(5, 25);
    const total = mean * count;
    const findMissing = difficulty > 1;

    if (!findMissing) {
      return {
        strand: 'statistics-probability',
        type: 'numeric',
        prompt: `The mean of ${count} numbers is ${mean}. What do all ${count} numbers add up to?`,
        correctAnswer: total,
        explanation:
          `Mean = total ÷ count, so total = mean × count = ${mean} × ${count} = ${total}. ` +
          `This is just the mean formula rearranged, the same way you rearrange any equation — ` +
          `it is algebra applied to statistics, not a separate rule to learn.`,
      };
    }

    // Known values plus one unknown that makes the mean come out right.
    const known = Array.from({ length: count - 1 }, () => rng.int(1, mean * 2));
    const knownTotal = known.reduce((s, v) => s + v, 0);
    const missing = total - knownTotal;

    return {
      strand: 'statistics-probability',
      type: 'numeric',
      prompt:
        `${count - 1} of ${count} test scores are ${known.join(', ')}. ` +
        `The mean of all ${count} is ${mean}. What is the missing score?`,
      correctAnswer: missing,
      explanation:
        `If the mean of ${count} scores is ${mean}, they must total ${mean} × ${count} = ${total}. ` +
        `The ${count - 1} known scores add to ${knownTotal}, so the missing one is ${total} − ${knownTotal} = ${missing}. ` +
        `Setting it up as an equation — (${knownTotal} + x) ÷ ${count} = ${mean} — gives the same answer, ` +
        `which is the point: a statistics question solved with algebra.`,
    };
  },
};

/** F-IF.A.2 ↔ A-REI.B.3 — solving f(x) = k is reading a graph backwards. */
export const solveAsFunctionInput: QuestionGenerator = {
  id: 'cx-solve-as-function',
  strand: 'expressions-equations',
  describes: 'Connect solving an equation to finding an input from an output.',
  build: (rng, difficulty) => {
    const m = rng.int(2, difficulty === 1 ? 5 : 9);
    const b = rng.int(-10, 10);
    const x = rng.int(-5, 9);
    const output = m * x + b;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `f(x) = ${m}x ${b < 0 ? '−' : '+'} ${Math.abs(b)}. ` +
        `For what value of x does f(x) = ${output}?`,
      correctAnswer: x,
      explanation:
        `Set the rule equal to the output and solve: ${m}x ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${output}, ` +
        `so ${m}x = ${output - b}, and x = ${x}. ` +
        `Evaluating a function goes input → output; solving goes OUTPUT → INPUT. They are the same machine run backwards. ` +
        `On a graph you would find ${output} on the y-axis, slide across to the line, and read down to x = ${x}.`,
    };
  },
};

export const connectionGenerators: QuestionGenerator[] = [
  systemAsIntersection,
  factorsAsIntercepts,
  rateAsSlope,
  distanceIsPythagoras,
  percentAsExponential,
  scaleFactorArea,
  absoluteValueAsDistance,
  meanBackwards,
  solveAsFunctionInput,
];
