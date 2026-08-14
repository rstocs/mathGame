/**
 * A small deterministic PRNG. Generated questions are produced from a seed so
 * a level run is reproducible: the same seed always yields the same questions,
 * which makes a bad generated question findable from a bug report and lets the
 * property tests sweep a wide space of seeds.
 *
 * mulberry32 — 32-bit state, good enough distribution for picking numbers in a
 * maths drill, and short enough to read.
 */
export interface Rng {
  /** Uniform in [0, 1). */
  next: () => number;
  /** Uniform integer in [min, max], inclusive. */
  int: (min: number, max: number) => number;
  /** Uniform element of a non-empty array. */
  pick: <T>(items: readonly T[]) => T;
  /** A new array with the items shuffled. */
  shuffle: <T>(items: readonly T[]) => T[];
  /** True with the given probability. */
  chance: (probability: number) => boolean;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  // A zero state would make mulberry32 return a constant stream.
  if (state === 0) state = 0x9e3779b9;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('pick() needs a non-empty array');
    return items[int(0, items.length - 1)];
  };

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const chance = (probability: number) => next() < probability;

  return { next, int, pick, shuffle, chance };
}

/**
 * Turns a string into a 32-bit seed, so a level id can seed its own run
 * without a separate registry of numbers. FNV-1a.
 */
export function hashSeed(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
