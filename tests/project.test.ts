import { describe, it, expect } from 'vitest';
import {
  isProjectComplete,
  getDifficultyReward,
  isDifficultyUnlocked,
  DIFFICULTY_CONFIGS,
  Project
} from '../src/domain/project';

describe('Project Helpers', () => {
  const createMockProject = (overrides: Partial<Project> = {}): Project => {
    return {
      id: 'p1',
      name: 'Test Project',
      description: 'Test description',
      difficulty: 50,
      urgency: 5,
      risk: 5,
      progress: 0,
      maxProgress: 100,
      bugs: 0,
      techDebt: 0,
      difficultyLevel: 'normal',
      ...overrides,
    };
  };

  describe('isProjectComplete', () => {
    it('returns false when progress is less than maxProgress (normal case)', () => {
      const project = createMockProject({ progress: 50, maxProgress: 100 });
      expect(isProjectComplete(project)).toBe(false);
    });

    it('returns true when progress equals or exceeds maxProgress (boundary cases)', () => {
      const projectEqual = createMockProject({ progress: 100, maxProgress: 100 });
      const projectExceed = createMockProject({ progress: 120, maxProgress: 100 });
      expect(isProjectComplete(projectEqual)).toBe(true);
      expect(isProjectComplete(projectExceed)).toBe(true);
    });

    it('returns true when progress is zero and maxProgress is zero (edge case)', () => {
      const projectZero = createMockProject({ progress: 0, maxProgress: 0 });
      expect(isProjectComplete(projectZero)).toBe(true);
    });
  });

  describe('getDifficultyReward', () => {
    it('calculates the reward correctly for normal difficulty (normal case)', () => {
      const project = createMockProject({ difficulty: 50, difficultyLevel: 'normal' });
      // 50 * 20 * 1.6 = 1600
      expect(getDifficultyReward(project)).toBe(1600);
    });

    it('calculates the reward correctly for legend difficulty (boundary case)', () => {
      const project = createMockProject({ difficulty: 100, difficultyLevel: 'legend' });
      // 100 * 20 * 2.4 = 4800
      expect(getDifficultyReward(project)).toBe(4800);
    });

    it('handles a missing or invalid difficultyLevel gracefully using normal fallback (exception/edge case)', () => {
      // @ts-expect-error testing runtime fallback for invalid difficultyLevel
      const project = createMockProject({ difficulty: 50, difficultyLevel: 'invalid-level' });
      // Fallback is 'normal' (multiplier: 1.6) -> 50 * 20 * 1.6 = 1600
      expect(getDifficultyReward(project)).toBe(1600);
    });
  });

  describe('isDifficultyUnlocked', () => {
    it('checks lock status for normal, hard, and legend levels (normal cases)', () => {
      // normal requires 2
      expect(isDifficultyUnlocked('normal', 1)).toBe(false);
      expect(isDifficultyUnlocked('normal', 2)).toBe(true);
      expect(isDifficultyUnlocked('normal', 3)).toBe(true);

      // hard requires 5
      expect(isDifficultyUnlocked('hard', 4)).toBe(false);
      expect(isDifficultyUnlocked('hard', 5)).toBe(true);
    });

    it('unlocks intern level at zero completed projects (boundary case)', () => {
      // intern requires 0
      expect(isDifficultyUnlocked('intern', 0)).toBe(true);
    });

    it('checks legend level unlock condition (boundary case)', () => {
      // legend requires 10
      expect(isDifficultyUnlocked('legend', 9)).toBe(false);
      expect(isDifficultyUnlocked('legend', 10)).toBe(true);
    });
  });
});
