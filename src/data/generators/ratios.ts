import type { QuestionGenerator, Difficulty } from './types';
import { choicesFrom, money, round } from './types';

const ITEMS = [
  { name: 'apples', unit: 'pound' },
  { name: 'rice', unit: 'pound' },
  { name: 'ribbon', unit: 'yard' },
  { name: 'juice', unit: 'litre' },
  { name: 'sand', unit: 'kilogram' },
] as const;

/** 7.RP.A.1 — unit rates from a total and a quantity. */
export const unitRate: QuestionGenerator = {
  id: 'rp-unit-rate',
  strand: 'ratios-proportions',
  describes: 'Find a unit rate from a total cost and a quantity.',
  build: (rng, difficulty) => {
    const item = rng.pick(ITEMS);
    // Keep the rate exact so the answer isn't a rounding artefact.
    const rate = difficulty === 1 ? rng.int(2, 9) : round(rng.int(4, 60) / 4, 2);
    const quantity = difficulty === 3 ? rng.int(6, 14) : rng.int(2, 8);
    const total = round(rate * quantity, 2);

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt: `${quantity} ${item.unit}s of ${item.name} cost ${money(total)}. What is the cost per ${item.unit}?`,
      correctAnswer: rate,
      tolerance: 0.005,
      unit: `dollars per ${item.unit}`,
      explanation:
        `A unit rate is the cost for exactly 1 ${item.unit}, so divide the total by the quantity: ` +
        `${money(total)} ÷ ${quantity} = ${money(rate)} per ${item.unit}.`,
    };
  },
};

/** 7.RP.A.2 — solve a proportion for the missing value. */
export const solveProportion: QuestionGenerator = {
  id: 'rp-solve-proportion',
  strand: 'ratios-proportions',
  describes: 'Solve a proportion a/b = x/d for the missing value.',
  build: (rng, difficulty) => {
    const k = difficulty === 1 ? rng.int(2, 5) : rng.int(2, 9);
    const a = rng.int(2, 9);
    // b must differ from a: 4/4 = x/8 is a ratio of 1, which a kid can answer
    // by pattern-matching without doing any proportional reasoning.
    const b = rng.pick([2, 3, 4, 5, 6, 7, 8, 9].filter((n) => n !== a));
    // Scale both sides by k so x lands on a whole number.
    const c = a * k;
    const d = b * k;

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt: `Solve the proportion for x:  ${a}/${b} = x/${d}`,
      correctAnswer: c,
      explanation:
        `${b} was multiplied by ${k} to get ${d}, so the top must be multiplied by ${k} too: ` +
        `${a} × ${k} = ${c}. You can check it by cross-multiplying: ${a} × ${d} = ${b} × ${c}.`,
    };
  },
};

/** 7.RP.A.3 — percent of a number in a shopping context. */
export const percentOf: QuestionGenerator = {
  id: 'rp-percent-of',
  strand: 'ratios-proportions',
  describes: 'Find a percent of an amount (discount, tip, or tax).',
  build: (rng, difficulty) => {
    const percent = difficulty === 1 ? rng.pick([10, 20, 25, 50]) : rng.pick([15, 30, 40, 60, 75]);
    const base = difficulty === 3 ? rng.int(5, 40) * 4 : rng.int(2, 20) * 10;
    const answer = round((percent / 100) * base, 2);

    return {
      strand: 'ratios-proportions',
      type: 'numeric',
      prompt: `A jacket costs ${money(base)}. It is on sale for ${percent}% off. How many dollars do you save?`,
      correctAnswer: answer,
      tolerance: 0.005,
      unit: 'dollars',
      explanation:
        `"${percent}% of" means multiply by ${percent}/100 = ${round(percent / 100, 2)}. ` +
        `So ${round(percent / 100, 2)} × ${money(base)} = ${money(answer)}. ` +
        `That is the amount saved — the price you actually pay is ${money(round(base - answer, 2))}.`,
    };
  },
};

/** 7.RP.A.3 — percent change, where the base is the *original* amount. */
export const percentChange: QuestionGenerator = {
  id: 'rp-percent-change',
  strand: 'ratios-proportions',
  describes: 'Find a percent increase or decrease from two amounts.',
  build: (rng, difficulty) => {
    const original = rng.int(2, 20) * 10;
    const percent = rng.pick(difficulty === 1 ? [10, 20, 50] : [15, 25, 30, 40, 60]);
    const increase = rng.chance(0.5);
    const delta = round((percent / 100) * original, 2);
    const updated = round(increase ? original + delta : original - delta, 2);
    const correct = `${percent}%`;

    const { choices, correctIndex } = choicesFrom(
      rng,
      correct,
      [
        // The classic error: dividing by the new amount instead of the original.
        `${Math.round((delta / updated) * 100)}%`,
        `${percent + 10}%`,
        `${Math.max(5, percent - 10)}%`,
      ],
      (i) => `${percent + (i + 2) * 5}%`,
    );

    return {
      strand: 'ratios-proportions',
      type: 'multiple-choice',
      prompt:
        `A book's price changed from ${money(original)} to ${money(updated)}. ` +
        `What was the percent ${increase ? 'increase' : 'decrease'}?`,
      choices,
      correctIndex,
      explanation:
        `Percent change is (change ÷ ORIGINAL) × 100. The change is ${money(delta)}, and the original ` +
        `price is ${money(original)}, so ${money(delta)} ÷ ${money(original)} = ${round(delta / original, 4)}, ` +
        `which is ${percent}%. The usual mistake is dividing by the new price ${money(updated)} instead of the original.`,
    };
  },
};

export const ratioGenerators: QuestionGenerator[] = [unitRate, solveProportion, percentOf, percentChange];

export const _difficulties: Difficulty[] = [1, 2, 3];
