import { describe, it, expect } from 'vitest';
import { createRng, hashSeed } from './rng';

describe('createRng', () => {
  it('is deterministic for a given seed', () => {
    const a = createRng(12345);
    const b = createRng(12345);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different streams for different seeds', () => {
    const a = Array.from({ length: 10 }, (_, i) => createRng(i).next());
    expect(new Set(a).size).toBe(a.length);
  });

  it('does not collapse when seeded with zero', () => {
    const rng = createRng(0);
    const values = Array.from({ length: 10 }, () => rng.next());
    expect(new Set(values).size).toBeGreaterThan(1);
  });

  it('stays within [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 5000; i += 1) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('covers the full inclusive range of int(), endpoints included', () => {
    const rng = createRng(99);
    const seen = new Set<number>();
    for (let i = 0; i < 3000; i += 1) seen.add(rng.int(1, 6));
    expect([...seen].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('handles a single-value int range and negative bounds', () => {
    const rng = createRng(3);
    expect(rng.int(5, 5)).toBe(5);
    for (let i = 0; i < 500; i += 1) {
      const v = rng.int(-8, -2);
      expect(v).toBeGreaterThanOrEqual(-8);
      expect(v).toBeLessThanOrEqual(-2);
    }
  });

  it('picks only real elements, and can reach every one', () => {
    const rng = createRng(21);
    const items = ['a', 'b', 'c', 'd'] as const;
    const seen = new Set<string>();
    for (let i = 0; i < 500; i += 1) seen.add(rng.pick(items));
    expect([...seen].sort()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('throws rather than returning undefined for an empty pick', () => {
    expect(() => createRng(1).pick([])).toThrow();
  });

  it('shuffles without losing, duplicating, or mutating items', () => {
    const rng = createRng(42);
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = rng.shuffle(source);
    expect(shuffled.sort((a, b) => a - b)).toEqual(source);
    expect(source).toEqual([1, 2, 3, 4, 5, 6, 7, 8]); // original untouched
  });

  it('actually reorders most of the time', () => {
    const rng = createRng(5);
    const source = [1, 2, 3, 4, 5, 6, 7, 8];
    let reordered = 0;
    for (let i = 0; i < 50; i += 1) {
      if (rng.shuffle(source).join() !== source.join()) reordered += 1;
    }
    expect(reordered).toBeGreaterThan(40);
  });

  it('honours chance() probabilities', () => {
    const rng = createRng(11);
    let hits = 0;
    for (let i = 0; i < 10000; i += 1) if (rng.chance(0.25)) hits += 1;
    expect(hits / 10000).toBeGreaterThan(0.22);
    expect(hits / 10000).toBeLessThan(0.28);
    expect(createRng(1).chance(0)).toBe(false);
    expect(createRng(1).chance(1)).toBe(true);
  });
});

describe('hashSeed', () => {
  it('is stable and distinct per string', () => {
    expect(hashSeed('rp-l1')).toBe(hashSeed('rp-l1'));
    expect(hashSeed('rp-l1')).not.toBe(hashSeed('rp-l2'));
  });

  it('returns an unsigned 32-bit integer', () => {
    for (const s of ['', 'a', 'ee-l4-q9', 'a much longer level identifier']) {
      const h = hashSeed(s);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
    }
  });

  it('spreads similar strings apart', () => {
    const seeds = ['rp-l1', 'rp-l2', 'rp-l3', 'ns-l1', 'ee-l1', 'g-l1', 'sp-l1'].map(hashSeed);
    expect(new Set(seeds).size).toBe(seeds.length);
  });
});
