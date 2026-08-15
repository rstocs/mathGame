import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/** Pythagorean triples, so distances and side lengths stay whole. */
const TRIPLES = [
  [3, 4, 5],
  [6, 8, 10],
  [5, 12, 13],
  [8, 15, 17],
  [9, 12, 15],
  [7, 24, 25],
] as const;

/** G-GPE.B.7 — distance between two points. */
export const distanceFormula: QuestionGenerator = {
  id: 'g10-distance',
  strand: 'expressions-equations',
  describes: 'Find the distance between two points on the coordinate plane.',
  build: (rng, difficulty) => {
    const [dx, dy, d] = rng.pick(difficulty === 1 ? TRIPLES.slice(0, 2) : TRIPLES);
    const x1 = rng.int(-8, 8);
    const y1 = rng.int(-8, 8);
    const signX = rng.chance(0.5) ? 1 : -1;
    const signY = rng.chance(0.5) ? 1 : -1;
    const x2 = x1 + dx * signX;
    const y2 = y1 + dy * signY;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt: `How far apart are (${x1}, ${y1}) and (${x2}, ${y2})?`,
      correctAnswer: d,
      explanation:
        `The distance formula is just Pythagoras on the coordinate plane: d = √((x₂−x₁)² + (y₂−y₁)²). ` +
        `The horizontal gap is ${Math.abs(x2 - x1)} and the vertical gap is ${Math.abs(y2 - y1)}, so ` +
        `d = √(${dx * dx} + ${dy * dy}) = √${d * d} = ${d}. ` +
        `Squaring makes both gaps positive, so the order you subtract in does not matter.`,
    };
  },
};

/** G-GPE.B.6 — midpoint of a segment, placed on the grid. */
export const midpoint: QuestionGenerator = {
  id: 'g10-midpoint',
  strand: 'expressions-equations',
  describes: 'Find the midpoint of a segment.',
  build: (rng) => {
    // Both coordinates must be an even distance apart so the midpoint lands on
    // a lattice point. The starting point is kept inside ±6 because the
    // midpoint sits up to 4 away from it, and it has to stay on the ±10 grid.
    const x1 = rng.int(-6, 6);
    const y1 = rng.int(-6, 6);
    const x2 = x1 + rng.int(1, 4) * 2 * (rng.chance(0.5) ? 1 : -1);
    const y2 = y1 + rng.int(1, 4) * 2 * (rng.chance(0.5) ? 1 : -1);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    return {
      strand: 'expressions-equations',
      type: 'graph-plot',
      prompt: `Plot the midpoint of the segment from (${x1}, ${y1}) to (${x2}, ${y2}).`,
      mode: { kind: 'points', count: 1 },
      bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      correctPoints: [{ x: mx, y: my }],
      explanation:
        `The midpoint is the AVERAGE of the two endpoints, taken one coordinate at a time: ` +
        `x = (${x1} + ${x2}) ÷ 2 = ${mx} and y = (${y1} + ${y2}) ÷ 2 = ${my}, giving (${mx}, ${my}). ` +
        `Subtracting instead of averaging gives the distance travelled, not the point halfway along.`,
    };
  },
};

/** G-GPE.A.1 — the equation of a circle. */
export const circleEquation: QuestionGenerator = {
  id: 'g10-circle-equation',
  strand: 'expressions-equations',
  describes: 'Read the centre or radius from the equation of a circle.',
  build: (rng, difficulty) => {
    const h = difficulty === 1 ? 0 : rng.int(-6, 6);
    const k = difficulty === 1 ? 0 : rng.int(-6, 6);
    const r = rng.int(2, 9);
    const askRadius = rng.chance(0.5);
    // (x − h)² + (y − k)² = r², with the signs written out as they appear.
    const equation = `(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})² + (y ${k < 0 ? '+' : '−'} ${Math.abs(k)})² = ${r * r}`;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      primer:
        'A circle on a grid is written (x − h)² + (y − k)² = r², where (h, k) is its centre and r its radius. ' +
        'Two traps: the number on the right is r SQUARED, and the signs inside the brackets are the opposite of ' +
        'the centre\'s coordinates.',
      prompt: askRadius
        ? `What is the radius of the circle ${equation}?`
        : `What is the x-coordinate of the centre of the circle ${equation}?`,
      correctAnswer: askRadius ? r : h,
      explanation: askRadius
        ? `In (x − h)² + (y − k)² = r², the right-hand side is r SQUARED, not r. ` +
          `Here r² = ${r * r}, so r = √${r * r} = ${r}. Reading ${r * r} straight off as the radius is the usual trap.`
        : `In (x − h)² + (y − k)² = r², the centre is (h, k) — and the signs are FLIPPED from what is written. ` +
          `"(x ${h < 0 ? '+' : '−'} ${Math.abs(h)})" means h = ${h}, so the x-coordinate of the centre is ${h}.`,
    };
  },
};

/** G-SRT.C.8 — right-triangle trigonometry. */
export const rightTriangleTrig: QuestionGenerator = {
  id: 'g10-right-triangle-trig',
  strand: 'ratios-proportions',
  describes: 'Find a trigonometric ratio in a right triangle.',
  build: (rng, difficulty) => {
    const [opposite, adjacent, hypotenuse] = rng.pick(difficulty === 1 ? TRIPLES.slice(0, 3) : TRIPLES);
    const ratio = rng.pick(['sin', 'cos', 'tan'] as const);
    const value =
      ratio === 'sin' ? opposite / hypotenuse : ratio === 'cos' ? adjacent / hypotenuse : opposite / adjacent;

    const parts = {
      sin: { top: 'opposite', bottom: 'hypotenuse', a: opposite, b: hypotenuse },
      cos: { top: 'adjacent', bottom: 'hypotenuse', a: adjacent, b: hypotenuse },
      tan: { top: 'opposite', bottom: 'adjacent', a: opposite, b: adjacent },
    }[ratio];

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      primer:
        'sin, cos and tan are three ratios of a right triangle\'s sides, remembered as SOH-CAH-TOA: ' +
        'Sin = Opposite/Hypotenuse, Cos = Adjacent/Hypotenuse, Tan = Opposite/Adjacent. ' +
        'Each is just one division — the hypotenuse is the long side opposite the right angle.',
      prompt:
        `In a right triangle, angle A has an opposite side of ${opposite}, an adjacent side of ${adjacent}, ` +
        `and the hypotenuse is ${hypotenuse}. What is ${ratio}(A)? Round to 4 decimal places.`,
      correctAnswer: round(value, 4),
      tolerance: 0.0005,
      explanation:
        `SOH-CAH-TOA: ${ratio} = ${parts.top} ÷ ${parts.bottom}. ` +
        `So ${ratio}(A) = ${parts.a} ÷ ${parts.b} = ${round(value, 4)}. ` +
        `Sine and cosine are always less than 1 in a right triangle because the hypotenuse is the longest side — ` +
        `tangent has no such limit.`,
    };
  },
};

/** G-SRT.B.5 — similar triangles and proportional sides. */
export const similarTriangles: QuestionGenerator = {
  id: 'g10-similar-triangles',
  strand: 'ratios-proportions',
  describes: 'Find a missing side using similar triangles.',
  build: (rng, difficulty) => {
    const a = rng.int(2, 9);
    const b = rng.int(2, 9);
    const scale = difficulty === 1 ? rng.int(2, 3) : rng.int(2, 6);

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt:
        `Two triangles are similar. The first has sides of ${a} and ${b}. ` +
        `The second has a matching side of ${a * scale}. How long is its other matching side?`,
      correctAnswer: b * scale,
      explanation:
        `Similar figures have all matching sides in the SAME ratio. ` +
        `${a} grew to ${a * scale}, a scale factor of ${a * scale} ÷ ${a} = ${scale}. ` +
        `So the other side grows by the same factor: ${b} × ${scale} = ${b * scale}. ` +
        `Adding the difference instead of multiplying is the usual error — similarity scales, it does not shift.`,
    };
  },
};

/** G-C.B.5 — arc length and sector area. */
export const arcAndSector: QuestionGenerator = {
  id: 'g10-arc-sector',
  strand: 'geometry',
  describes: 'Find an arc length or sector area from a central angle.',
  build: (rng, difficulty) => {
    const radius = rng.int(2, difficulty === 1 ? 8 : 14);
    const angle = rng.pick(difficulty === 1 ? [90, 180] : [30, 45, 60, 120, 135, 270]);
    const wantArea = rng.chance(0.5);
    const fractionOfCircle = angle / 360;
    const value = wantArea
      ? fractionOfCircle * Math.PI * radius * radius
      : fractionOfCircle * 2 * Math.PI * radius;
    const answer = round(value, 2);

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt:
        `A circle has a radius of ${radius} cm. A sector has a central angle of ${angle}°. ` +
        `What is its ${wantArea ? 'area' : 'arc length'}? Use π ≈ 3.14, rounded to 2 decimal places.`,
      correctAnswer: answer,
      tolerance: Math.max(0.5, answer * 0.01),
      unit: wantArea ? 'square cm' : 'cm',
      imageHint: { kind: 'circle', radiusLabel: `r = ${radius} cm, ${angle}°` },
      explanation:
        `A sector is a fraction of the whole circle, and that fraction is ${angle}/360 = ${round(fractionOfCircle, 4)}. ` +
        (wantArea
          ? `The whole area is πr² = 3.14 × ${radius * radius} ≈ ${round(Math.PI * radius * radius, 2)}, so the sector is ` +
            `${round(fractionOfCircle, 4)} × ${round(Math.PI * radius * radius, 2)} ≈ ${answer} square cm.`
          : `The whole circumference is 2πr = 2 × 3.14 × ${radius} ≈ ${round(2 * Math.PI * radius, 2)}, so the arc is ` +
            `${round(fractionOfCircle, 4)} × ${round(2 * Math.PI * radius, 2)} ≈ ${answer} cm.`) +
        ` Take the fraction of the circle first — that is the whole idea.`,
    };
  },
};

/** G-CO.C.11 — interior and exterior angles of polygons. */
export const polygonAngles: QuestionGenerator = {
  id: 'g10-polygon-angles',
  strand: 'geometry',
  describes: 'Find the interior angle sum or each angle of a regular polygon.',
  build: (rng, difficulty) => {
    const sides = rng.int(3, difficulty === 1 ? 8 : 12);
    const sum = (sides - 2) * 180;
    const askEach = difficulty > 1 && rng.chance(0.5) && sum % sides === 0;
    const answer = askEach ? sum / sides : sum;
    const names: Record<number, string> = {
      3: 'triangle',
      4: 'quadrilateral',
      5: 'pentagon',
      6: 'hexagon',
      7: 'heptagon',
      8: 'octagon',
      9: 'nonagon',
      10: 'decagon',
    };
    const name = names[sides] ?? `${sides}-sided polygon`;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: askEach
        ? `What is the measure of EACH interior angle of a regular ${name}?`
        : `What is the sum of the interior angles of a ${name}?`,
      correctAnswer: answer,
      unit: 'degrees',
      explanation:
        `Any polygon splits into (n − 2) triangles, each holding 180°, so the interior angles sum to ` +
        `(${sides} − 2) × 180 = ${sum}°. ` +
        (askEach
          ? `A REGULAR polygon has all angles equal, so divide: ${sum} ÷ ${sides} = ${answer}°.`
          : `That is the total for all ${sides} corners together, not the size of one angle.`),
    };
  },
};

/** G-CO.A.2 / A.5 — transform a point on the plane. */
export const transformPoint: QuestionGenerator = {
  id: 'g10-transform-point',
  strand: 'geometry',
  describes: 'Reflect, translate, or rotate a point on the coordinate plane.',
  build: (rng, difficulty) => {
    // Kept inside ±6 so a translation of up to 4 still lands on the ±10 grid.
    const x = rng.int(-6, 6) || 3;
    const y = rng.int(-6, 6) || -2;
    const kind = difficulty === 1 ? rng.pick(['reflect-x', 'translate'] as const) : rng.pick(['reflect-x', 'reflect-y', 'translate', 'rotate-180'] as const);
    const dx = rng.int(-4, 4);
    const dy = rng.int(-4, 4);

    const result =
      kind === 'reflect-x'
        ? { x, y: -y }
        : kind === 'reflect-y'
          ? { x: -x, y }
          : kind === 'rotate-180'
            ? { x: -x, y: -y }
            : { x: x + dx, y: y + dy };

    const instruction =
      kind === 'reflect-x'
        ? 'reflected across the x-axis'
        : kind === 'reflect-y'
          ? 'reflected across the y-axis'
          : kind === 'rotate-180'
            ? 'rotated 180° about the origin'
            : `translated ${dx >= 0 ? `${dx} right` : `${Math.abs(dx)} left`} and ${dy >= 0 ? `${dy} up` : `${Math.abs(dy)} down`}`;

    const rule =
      kind === 'reflect-x'
        ? '(x, y) → (x, −y): reflecting across the x-axis flips the SIGN OF y and leaves x alone'
        : kind === 'reflect-y'
          ? '(x, y) → (−x, y): reflecting across the y-axis flips the SIGN OF x and leaves y alone'
          : kind === 'rotate-180'
            ? '(x, y) → (−x, −y): a half turn about the origin flips both signs'
            : `(x, y) → (x + ${dx}, y + ${dy}): a translation adds to each coordinate`;

    return {
      strand: 'geometry',
      type: 'graph-plot',
      prompt: `Plot where (${x}, ${y}) lands after being ${instruction}.`,
      mode: { kind: 'points', count: 1 },
      bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
      correctPoints: [result],
      explanation:
        `The rule is ${rule}. Applying it to (${x}, ${y}) gives (${result.x}, ${result.y}). ` +
        `Reflecting across the x-axis is the one most often mixed up: the point moves vertically, so it is y that changes.`,
    };
  },
};

/** G-GMD.A.3 — volume of pyramids and prisms. */
export const pyramidVolume: QuestionGenerator = {
  id: 'g10-pyramid-volume',
  strand: 'geometry',
  describes: 'Find the volume of a pyramid or prism.',
  build: (rng, difficulty) => {
    const side = rng.int(3, difficulty === 1 ? 8 : 14);
    const height = rng.int(3, 15);
    const pyramid = difficulty > 1 && rng.chance(0.5);
    const base = side * side;
    const value = pyramid ? (base * height) / 3 : base * height;
    const answer = round(value, 2);

    const { choices, correctIndex } = choicesFrom(
      rng,
      `${answer}`,
      [
        // Forgetting the one-third, or tripling instead.
        `${round(pyramid ? base * height : (base * height) / 3, 2)}`,
        `${round(base * height * (pyramid ? 3 : 1 / 3), 2)}`,
        `${round(value * 2, 2)}`,
      ],
      (i) => `${round(value + (i + 1) * 5, 2)}`,
    );

    return {
      strand: 'geometry',
      type: 'multiple-choice',
      prompt:
        `A ${pyramid ? 'pyramid' : 'prism'} has a square base ${side} cm on each side and a height of ${height} cm. ` +
        `What is its volume in cubic cm?`,
      choices,
      correctIndex,
      explanation:
        `The base area is ${side} × ${side} = ${base} square cm. ` +
        (pyramid
          ? `A pyramid is exactly ONE THIRD of the prism with the same base and height, so ` +
            `V = ⅓ × ${base} × ${height} = ${answer} cubic cm. Dropping the ⅓ triples the answer.`
          : `For a prism the volume is just base × height = ${base} × ${height} = ${answer} cubic cm.`),
    };
  },
};

export const grade10Generators: QuestionGenerator[] = [
  distanceFormula,
  midpoint,
  circleEquation,
  rightTriangleTrig,
  similarTriangles,
  arcAndSector,
  polygonAngles,
  transformPoint,
  pyramidVolume,
];
