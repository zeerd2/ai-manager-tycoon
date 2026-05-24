import { describe, it, expect } from 'vitest';
import { calculateRating } from '../src/domain/rating';
import type { RatingInput } from '../src/domain/rating';

describe('calculateRating', () => {
  it('returns S rating for a very successful company (high completed projects, low bugs, high remaining funds)', () => {
    const input: RatingInput = {
      completedProjects: 5,
      totalBugs: 0,
      totalTechDebt: 0,
      totalSprintsCost: 1000,
      fundsRemaining: 5000,
      sprintCount: 5,
    };
    const result = calculateRating(input);
    expect(result.rating).toBe('S');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.title).toBe('传奇 AI 公司');
    expect(result.description).toContain('硅谷 VC');
  });

  it('returns F rating for a disastrous company (0 projects, high bugs, high tech debt, low funds)', () => {
    const input: RatingInput = {
      completedProjects: 0,
      totalBugs: 80,
      totalTechDebt: 80,
      totalSprintsCost: 5000,
      fundsRemaining: 0,
      sprintCount: 50,
    };
    const result = calculateRating(input);
    expect(result.rating).toBe('F');
    expect(result.score).toBeLessThan(20);
    expect(result.title).toBe('灾难');
    expect(result.description).toContain('辞职');
  });

  it('correctly maps scores to ratings on the boundaries', () => {
    // S boundary: score >= 80
    const sInput: RatingInput = {
      completedProjects: 4, // 80
      totalBugs: 0,
      totalTechDebt: 0,
      fundsRemaining: 0,
      totalSprintsCost: 0,
      sprintCount: 0,
    };
    expect(calculateRating(sInput).rating).toBe('S');

    // A boundary: score 65 - 79
    const aInput: RatingInput = {
      completedProjects: 3, // 60
      totalBugs: 0,
      totalTechDebt: 0,
      fundsRemaining: 500, // +5
      totalSprintsCost: 0,
      sprintCount: 0,
    };
    expect(calculateRating(aInput).rating).toBe('A');

    // B boundary: score 50 - 64
    const bInput: RatingInput = {
      completedProjects: 2, // 40
      totalBugs: 0,
      totalTechDebt: 0,
      fundsRemaining: 1000, // +10
      totalSprintsCost: 0,
      sprintCount: 0,
    };
    expect(calculateRating(bInput).rating).toBe('B');

    // C boundary: score 35 - 49
    const cInput: RatingInput = {
      completedProjects: 2, // 40
      totalBugs: 10, // -5
      totalTechDebt: 0,
      fundsRemaining: 0,
      totalSprintsCost: 0,
      sprintCount: 0,
    };
    expect(calculateRating(cInput).rating).toBe('C');

    // D boundary: score 20 - 34
    const dInput: RatingInput = {
      completedProjects: 1, // 20
      totalBugs: 0,
      totalTechDebt: 0,
      fundsRemaining: 0,
      totalSprintsCost: 0,
      sprintCount: 0,
    };
    expect(calculateRating(dInput).rating).toBe('D');

    // F boundary: score < 20
    const fInput: RatingInput = {
      completedProjects: 0,
      totalBugs: 10, // -5
      totalTechDebt: 0,
      fundsRemaining: 1000, // +10
      totalSprintsCost: 0,
      sprintCount: 0,
    };
    expect(calculateRating(fInput).rating).toBe('F');
  });

  it('guarantees score is clamped between 0 and 100', () => {
    const hugeInput: RatingInput = {
      completedProjects: 100, // 2000
      totalBugs: 0,
      totalTechDebt: 0,
      totalSprintsCost: 0,
      fundsRemaining: 100000, // 1000
      sprintCount: 0,
    };
    const resultHuge = calculateRating(hugeInput);
    expect(resultHuge.score).toBe(100);

    const negativeInput: RatingInput = {
      completedProjects: 0,
      totalBugs: 1000,
      totalTechDebt: 1000,
      totalSprintsCost: 10000,
      fundsRemaining: 0,
      sprintCount: 100,
    };
    const resultNegative = calculateRating(negativeInput);
    expect(resultNegative.score).toBe(0);
  });

  it('verifies all ratings have non-empty title and description', () => {
    const inputs: RatingInput[] = [
      { completedProjects: 5, totalBugs: 0, totalTechDebt: 0, totalSprintsCost: 0, fundsRemaining: 5000, sprintCount: 0 },
      { completedProjects: 3, totalBugs: 0, totalTechDebt: 0, totalSprintsCost: 0, fundsRemaining: 500, sprintCount: 0 },
      { completedProjects: 2.5, totalBugs: 0, totalTechDebt: 0, totalSprintsCost: 0, fundsRemaining: 500, sprintCount: 0 },
      { completedProjects: 2, totalBugs: 10, totalTechDebt: 0, totalSprintsCost: 0, fundsRemaining: 0, sprintCount: 0 },
      { completedProjects: 1, totalBugs: 0, totalTechDebt: 0, totalSprintsCost: 0, fundsRemaining: 0, sprintCount: 0 },
      { completedProjects: 0, totalBugs: 20, totalTechDebt: 20, totalSprintsCost: 0, fundsRemaining: 0, sprintCount: 0 },
    ];

    inputs.forEach(input => {
      const res = calculateRating(input);
      expect(res.title).toBeTruthy();
      expect(res.description).toBeTruthy();
      expect(res.title.length).toBeGreaterThan(0);
      expect(res.description.length).toBeGreaterThan(0);
    });
  });
});
