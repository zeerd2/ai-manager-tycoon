import { describe, it, expect } from 'vitest';
import { createRNG, randomInt, pickRandom, rollChance } from '../src/domain/random';

describe('createRNG', () => {
  it('produces deterministic output for a given seed', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    const vals1 = Array.from({ length: 10 }, () => rng1());
    const vals2 = Array.from({ length: 10 }, () => rng2());
    expect(vals1).toEqual(vals2);
  });

  it('produces values between 0 and 1', () => {
    const rng = createRNG(123);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('produces different values for different seeds', () => {
    const rng1 = createRNG(1);
    const rng2 = createRNG(2);
    const v1 = rng1();
    const v2 = rng2();
    expect(v1).not.toEqual(v2);
  });
});

describe('randomInt', () => {
  it('returns values within the specified range', () => {
    const rng = createRNG(99);
    for (let i = 0; i < 50; i++) {
      const v = randomInt(rng, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
    }
  });
});

describe('pickRandom', () => {
  it('picks an element from the array', () => {
    const rng = createRNG(42);
    const arr = ['a', 'b', 'c', 'd'];
    for (let i = 0; i < 20; i++) {
      expect(arr).toContain(pickRandom(rng, arr));
    }
  });
});

describe('rollChance', () => {
  it('returns true with probability 1', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 10; i++) {
      expect(rollChance(rng, 1.1)).toBe(true);
    }
  });

  it('returns false with probability 0', () => {
    const rng = createRNG(42);
    for (let i = 0; i < 10; i++) {
      expect(rollChance(rng, 0)).toBe(false);
    }
  });
});
