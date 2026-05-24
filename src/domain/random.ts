export type RNG = () => number;

/** 基于种子的伪随机数生成器（线性同余法），确保可重现性 */
export function createRNG(seed: number): RNG {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** 在 [min, max] 范围内生成随机整数 */
export function randomInt(rng: RNG, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** 从数组中随机选取一个元素 */
export function pickRandom<T>(rng: RNG, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** 以指定概率判定是否触发 */
export function rollChance(rng: RNG, probability: number): boolean {
  return rng() < probability;
}
