import type { QuestionGenerator } from './types';
import { choicesFrom, round } from './types';

/** 7.G.B.4 — circumference and area of a circle. */
export const circleMeasures: QuestionGenerator = {
  id: 'g-circle',
  strand: 'geometry',
  describes: 'Find the area or circumference of a circle from its radius or diameter.',
  build: (rng, difficulty) => {
    const radius = rng.int(2, difficulty === 1 ? 9 : 15);
    const wantArea = rng.chance(0.5);
    // At higher difficulty the measurement given is the diameter, which is the
    // step most often skipped.
    const giveDiameter = difficulty === 3 && rng.chance(0.5);
    const answer = round(wantArea ? Math.PI * radius * radius : 2 * Math.PI * radius, 2);

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt:
        `A circle has a ${giveDiameter ? 'diameter' : 'radius'} of ${giveDiameter ? radius * 2 : radius} cm. ` +
        `What is its ${wantArea ? 'area' : 'circumference'}? Use π ≈ 3.14 and round to 2 decimal places.`,
      correctAnswer: answer,
      // Generous enough to accept 3.14 vs the exact π, tight enough to reject
      // using the diameter where the radius belongs.
      tolerance: Math.max(0.5, answer * 0.01),
      unit: wantArea ? 'square cm' : 'cm',
      imageHint: { kind: 'circle', radiusLabel: `${giveDiameter ? `d = ${radius * 2}` : `r = ${radius}`} cm` },
      explanation:
        (giveDiameter
          ? `First halve the diameter to get the radius: ${radius * 2} ÷ 2 = ${radius} cm. `
          : '') +
        (wantArea
          ? `Area = πr² = 3.14 × ${radius}² = 3.14 × ${radius * radius} ≈ ${answer} square cm. ` +
            `Square the radius first, then multiply by π — squaring after multiplying gives the wrong answer.`
          : `Circumference = 2πr = 2 × 3.14 × ${radius} ≈ ${answer} cm. ` +
            `Circumference is a length around the edge, so the units are cm, not square cm.`),
    };
  },
};

/** 7.G.B.6 — area of a composite or basic figure. */
export const rectangleArea: QuestionGenerator = {
  id: 'g-rectangle-area',
  strand: 'geometry',
  describes: 'Find the area of a rectangle or triangle.',
  build: (rng, difficulty) => {
    const width = rng.int(3, difficulty === 1 ? 10 : 20);
    const height = rng.int(3, difficulty === 1 ? 10 : 20);
    const triangle = difficulty > 1 && rng.chance(0.5);
    const answer = triangle ? round((width * height) / 2, 2) : width * height;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: triangle
        ? `A triangle has a base of ${width} cm and a height of ${height} cm. What is its area?`
        : `A rectangle is ${width} cm wide and ${height} cm tall. What is its area?`,
      correctAnswer: answer,
      unit: 'square cm',
      imageHint: triangle ? undefined : { kind: 'rectangle', widthLabel: `${width} cm`, heightLabel: `${height} cm` },
      explanation: triangle
        ? `A triangle is half of the rectangle that boxes it in, so area = ½ × base × height = ` +
          `½ × ${width} × ${height} = ${answer} square cm. Forgetting the ½ is the usual mistake.`
        : `Area of a rectangle = width × height = ${width} × ${height} = ${answer} square cm. ` +
          `Area is measured in SQUARE units because it covers a surface.`,
    };
  },
};

/** 7.G.B.5 — angle relationships. */
export const angleRelationships: QuestionGenerator = {
  id: 'g-angles',
  strand: 'geometry',
  describes: 'Find a missing angle using complementary or supplementary pairs.',
  build: (rng, difficulty) => {
    const supplementary = difficulty === 1 ? false : rng.chance(0.5);
    const total = supplementary ? 180 : 90;
    const known = rng.int(15, total - 15);
    const answer = total - known;

    return {
      strand: 'geometry',
      type: 'numeric',
      prompt: `Two angles are ${supplementary ? 'supplementary' : 'complementary'}. One measures ${known}°. What is the other?`,
      correctAnswer: answer,
      unit: 'degrees',
      explanation:
        `${supplementary ? 'Supplementary' : 'Complementary'} angles add to ${total}° ` +
        `(${supplementary ? 'they form a straight line' : 'they form a right angle'}). ` +
        `So the missing angle is ${total} − ${known} = ${answer}°.`,
    };
  },
};

/** 7.SP.C.5–7 — probability of a simple event. */
export const simpleProbability: QuestionGenerator = {
  id: 'sp-simple-probability',
  strand: 'statistics-probability',
  describes: 'Find the probability of a simple event from counts.',
  build: (rng, difficulty) => {
    const red = rng.int(2, 9);
    const blue = rng.int(2, 9);
    const green = difficulty === 1 ? 0 : rng.int(2, 9);
    const total = red + blue + green;
    const target = rng.pick(green > 0 ? (['red', 'blue', 'green'] as const) : (['red', 'blue'] as const));
    const count = target === 'red' ? red : target === 'blue' ? blue : green;
    const correct = `${count}/${total}`;

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // Part-to-part instead of part-to-whole is the classic error.
        `${count}/${total - count}`,
        `${total - count}/${total}`,
        `${count}/${total + 1}`,
      ],
      (i) => `${count}/${total + i + 2}`,
    );

    return {
      strand: 'statistics-probability',
      type: 'multiple-choice',
      prompt:
        `A bag holds ${red} red, ${blue} blue${green > 0 ? `, and ${green} green` : ''} marbles. ` +
        `You draw one without looking. What is the probability it is ${target}?`,
      choices,
      correctIndex,
      explanation:
        `Probability = (favourable outcomes) ÷ (TOTAL outcomes). There are ${count} ${target} marbles and ` +
        `${red} + ${blue}${green > 0 ? ` + ${green}` : ''} = ${total} marbles altogether, so the probability is ${correct}. ` +
        `Compare against the whole bag, not against the other colours.`,
    };
  },
};

/** 7.SP.B.4 — compute a mean from a small data set. */
export const meanOfData: QuestionGenerator = {
  id: 'sp-mean',
  strand: 'statistics-probability',
  describes: 'Find the mean of a small data set.',
  build: (rng, difficulty) => {
    const count = difficulty === 1 ? 4 : 5;
    const mean = rng.int(4, 20);
    // Build values around a chosen mean so the answer stays whole.
    const offsets: number[] = [];
    let running = 0;
    for (let i = 0; i < count - 1; i += 1) {
      const o = rng.int(-3, 3);
      offsets.push(o);
      running += o;
    }
    offsets.push(-running);
    const values = rng.shuffle(offsets.map((o) => mean + o));
    const total = values.reduce((a, b) => a + b, 0);

    return {
      strand: 'statistics-probability',
      type: 'numeric',
      prompt: `Find the mean of this data set:  ${values.join(', ')}`,
      correctAnswer: mean,
      imageHint: { kind: 'bar-chart', data: values.map((v, i) => ({ label: `#${i + 1}`, value: v })) },
      explanation:
        `The mean is the total shared out evenly. Add the values: ${values.join(' + ')} = ${total}. ` +
        `Then divide by how many there are: ${total} ÷ ${count} = ${mean}. ` +
        `Remember to divide by the COUNT of values, not by the largest one.`,
    };
  },
};

export const geometryStatsGenerators: QuestionGenerator[] = [
  circleMeasures,
  rectangleArea,
  angleRelationships,
  simpleProbability,
  meanOfData,
];
