import type { QuestionGenerator } from './types';

/**
 * Classic problems from other traditions, used as connections.
 *
 * Each of these is a famous problem type that a Chinese or Singaporean student
 * meets years before the algebra that formalises it — and that is exactly why
 * they belong here. The explanation always gives BOTH routes: the concrete
 * method the problem was invented for, and the algebra it turns out to be.
 * Seeing "assume they are all chickens" and "solve the system" produce the same
 * number is the point.
 */

/** 鸡兔同笼 — Chickens and Rabbits, from the Sunzi Suanjing (c. 5th century). */
export const chickensAndRabbits: QuestionGenerator = {
  id: 'cx-chickens-rabbits',
  strand: 'expressions-equations',
  describes: 'The classic heads-and-legs problem, solved two ways.',
  build: (rng, difficulty) => {
    const chickens = rng.int(2, difficulty === 1 ? 8 : 20);
    const rabbits = rng.int(2, difficulty === 1 ? 8 : 20);
    const heads = chickens + rabbits;
    const legs = 2 * chickens + 4 * rabbits;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `Chickens and rabbits are in the same cage. There are ${heads} heads and ${legs} legs in total. ` +
        `How many rabbits are there?`,
      correctAnswer: rabbits,
      unit: 'rabbits',
      explanation:
        `This is 鸡兔同笼 ("chickens and rabbits in the same cage"), from the Chinese classic Sunzi Suanjing, ` +
        `and there are two ways in.\n\n` +
        `The old method: suppose every animal were a chicken. Then there would be 2 × ${heads} = ${2 * heads} legs, ` +
        `but there are ${legs} — a shortfall of ${legs - 2 * heads}. Every rabbit you swap in for a chicken adds 2 legs, ` +
        `so there must be ${legs - 2 * heads} ÷ 2 = ${rabbits} rabbits.\n\n` +
        `The algebra: let c + r = ${heads} and 2c + 4r = ${legs}. Doubling the first gives 2c + 2r = ${2 * heads}; ` +
        `subtracting leaves 2r = ${legs - 2 * heads}, so r = ${rabbits} and c = ${chickens}. ` +
        `The "shortfall ÷ 2" in the old method IS the elimination step — the same arithmetic, told as a story.`,
    };
  },
};

/** 盈亏问题 — the Excess and Deficit method, from the Jiuzhang Suanshu. */
export const excessAndDeficit: QuestionGenerator = {
  id: 'cx-excess-deficit',
  strand: 'expressions-equations',
  describes: 'The classic surplus-and-shortage problem as a linear equation.',
  build: (rng, difficulty) => {
    const people = rng.int(3, difficulty === 1 ? 8 : 15);
    const perPersonLow = rng.int(2, 6);
    const step = rng.int(1, 3);
    const perPersonHigh = perPersonLow + step;
    const surplus = rng.int(1, people * step - 1);
    const deficit = people * step - surplus;
    const total = people * perPersonLow + surplus;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `Some children share a bag of sweets. If each child takes ${perPersonLow}, there are ${surplus} left over. ` +
        `If each child takes ${perPersonHigh}, they are ${deficit} short. How many children are there?`,
      correctAnswer: people,
      unit: 'children',
      explanation:
        `This is 盈亏问题 ("excess and deficit"), a named method in the Nine Chapters on the Mathematical Art.\n\n` +
        `The classical rule: add the surplus and the shortage, then divide by the difference in shares. ` +
        `(${surplus} + ${deficit}) ÷ (${perPersonHigh} − ${perPersonLow}) = ${surplus + deficit} ÷ ${step} = ${people} children.\n\n` +
        `Why it works, in algebra: the number of sweets is the same both times, so ` +
        `${perPersonLow}n + ${surplus} = ${perPersonHigh}n − ${deficit}. ` +
        `Collecting n gives ${step}n = ${surplus + deficit}, so n = ${people} — and the bag holds ${total} sweets. ` +
        `The rule you memorise and the equation you solve are the same line of working.`,
    };
  },
};

/** 工程问题 — work-rate problems, where rates add but times do not. */
export const workRate: QuestionGenerator = {
  id: 'cx-work-rate',
  strand: 'ratios-proportions',
  describes: 'Combine two work rates, seeing why times cannot simply be added.',
  build: (rng, difficulty) => {
    // Derive the pair from the answer instead of listing pairs by hand.
    // If 1/a + 1/b = 1/t then a = t + d and b = t + t²/d for any divisor d of
    // t², which yields a whole-number combined time every time.
    const together = rng.int(2, difficulty === 1 ? 6 : 12);
    const square = together * together;
    // d === together would give a === b, where "together they are faster than
    // the quicker one" is a vacuous thing to say. Two different rates make the
    // point better.
    const divisors = [];
    for (let d = 1; d < together; d += 1) if (square % d === 0) divisors.push(d);
    const d = rng.pick(divisors);
    const a = together + d;
    const b = together + square / d;

    const pair = rng.pick([
      { one: 'Mei', two: 'Jun', task: 'paint a wall' },
      { one: 'Ana', two: 'Bo', task: 'weed the garden' },
      { one: 'Kofi', two: 'Lena', task: 'sort the recycling' },
      { one: 'Priya', two: 'Tom', task: 'tile the floor' },
    ] as const);

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt:
        `Working alone, ${pair.one} can ${pair.task} in ${a} hours and ${pair.two} can do it in ${b} hours. ` +
        `Working together at the same rates, how many hours do they take?`,
      correctAnswer: together,
      unit: 'hours',
      explanation:
        `The trap is averaging or adding the times — but you cannot add hours here, because they are not the ` +
        `quantity that combines. RATES combine.\n\n` +
        `${pair.one} does 1/${a} of the job per hour and ${pair.two} does 1/${b}, so together they do ` +
        `1/${a} + 1/${b} = ${b}/${a * b} + ${a}/${a * b} = ${a + b}/${a * b} of it each hour. ` +
        `Time is one whole job divided by that rate: 1 ÷ ${a + b}/${a * b} = ${a * b}/${a + b} = ${together} hours. ` +
        `(Keeping it as fractions rather than decimals is what makes it come out exact.)\n\n` +
        `Sanity check: together they must be FASTER than the quicker of them alone (${Math.min(a, b)} hours), and ` +
        `${together} is. This "add the reciprocals" move is the same one behind resistors in parallel and lenses in optics.`,
    };
  },
};

/** 相遇问题 — meeting problems, where relative speed is the sum. */
export const meetingProblem: QuestionGenerator = {
  id: 'cx-meeting-problem',
  strand: 'ratios-proportions',
  describes: 'Use combined speed to find when two travellers meet.',
  build: (rng, difficulty) => {
    const speed1 = rng.int(30, 80);
    const speed2 = rng.int(30, 80);
    const hours = rng.int(2, difficulty === 1 ? 4 : 7);
    const distance = (speed1 + speed2) * hours;

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt:
        `Two trains start ${distance} km apart and drive toward each other, one at ${speed1} km/h and the other at ` +
        `${speed2} km/h. After how many hours do they meet?`,
      correctAnswer: hours,
      unit: 'hours',
      explanation:
        `Do not track the trains separately — track the GAP between them. ` +
        `Each hour, one train closes ${speed1} km of it and the other closes ${speed2}, so the gap shrinks by ` +
        `${speed1} + ${speed2} = ${speed1 + speed2} km every hour. ` +
        `Starting from ${distance} km, it closes in ${distance} ÷ ${speed1 + speed2} = ${hours} hours.\n\n` +
        `In algebra this is ${speed1}t + ${speed2}t = ${distance}, and factoring gives (${speed1} + ${speed2})t = ${distance} — ` +
        `the same combined speed, arrived at by collecting like terms. ` +
        `Adding the speeds and factoring out t are the same act.`,
    };
  },
};

/** Gauss's pairing trick — an arithmetic series in closed form. */
export const gaussSum: QuestionGenerator = {
  id: 'cx-gauss-sum',
  strand: 'number-system',
  describes: 'Sum 1 to n by pairing, and see why the formula works.',
  build: (rng, difficulty) => {
    const n = difficulty === 1 ? rng.int(10, 30) : rng.int(30, 100);
    const total = (n * (n + 1)) / 2;

    return {
      strand: 'number-system',
      type: 'numeric',
      prompt: `What is 1 + 2 + 3 + … + ${n}?`,
      correctAnswer: total,
      explanation:
        `Adding ${n} numbers one at a time is slow. Pair them from the outside in instead: ` +
        `1 + ${n} = ${n + 1}, 2 + ${n - 1} = ${n + 1}, 3 + ${n - 2} = ${n + 1} — every pair makes ${n + 1}. ` +
        `There are ${n} numbers, so ${n / 2} pairs${n % 2 === 1 ? ' (counting the middle number as half a pair)' : ''}, ` +
        `giving ${n} × ${n + 1} ÷ 2 = ${total}.\n\n` +
        `The story says Gauss found this at about eight years old. It generalises to n(n+1)/2 for any n, and it is ` +
        `also a picture: stack 1, 2, 3, … ${n} blocks into a staircase, put two staircases together, and they form a ` +
        `${n} by ${n + 1} rectangle — so one staircase is half of it. Counting, algebra, and area, all agreeing.`,
    };
  },
};

/** Singapore bar model — part-whole and comparison, which IS a linear system. */
export const barModelSumDifference: QuestionGenerator = {
  id: 'cx-bar-model',
  strand: 'expressions-equations',
  describes: 'Solve a sum-and-difference problem by bar model and by algebra.',
  build: (rng, difficulty) => {
    const smaller = rng.int(3, difficulty === 1 ? 20 : 60);
    const difference = rng.int(2, difficulty === 1 ? 10 : 30);
    const larger = smaller + difference;
    const sum = smaller + larger;

    return {
      strand: 'expressions-equations',
      type: 'numeric',
      prompt:
        `Ravi and Siti have ${sum} stickers between them. Ravi has ${difference} more than Siti. ` +
        `How many does Ravi have?`,
      correctAnswer: larger,
      unit: 'stickers',
      explanation:
        `Draw it as two bars, the Singapore way. Siti's bar is one unit; Ravi's is the same unit plus an extra ` +
        `${difference}. Together the bars are ${sum}.\n\n` +
        `Chop off Ravi's extra ${difference} and the two bars become equal: ${sum} − ${difference} = ${sum - difference} ` +
        `split into two equal parts is ${smaller} each. That is Siti. Give Ravi his extra back: ${smaller} + ${difference} = ${larger}.\n\n` +
        `The algebra is the same three steps with letters: r + s = ${sum} and r − s = ${difference}; ` +
        `adding the equations gives 2r = ${sum + difference}, so r = ${larger}. ` +
        `"Chop off the difference and halve" IS elimination — the bar model is a picture of the system, which is why ` +
        `it keeps working once the numbers turn into letters.`,
    };
  },
};

export const classicConnectionGenerators: QuestionGenerator[] = [
  chickensAndRabbits,
  excessAndDeficit,
  workRate,
  meetingProblem,
  gaussSum,
  barModelSumDifference,
];
