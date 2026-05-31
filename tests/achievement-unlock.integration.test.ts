import { describe, expect, it } from 'vitest';
import { checkAchievement, type AchievementContext } from '../src/domain/achievement';
import { achievements } from '../src/data/achievements';

/**
 * achievement-unlock.integration.test.ts
 *
 * P1 integration tests for WS-103 (G-3A)
 * Only covers the 4 approved scenarios in first round.
 *
 * Uses only public domain APIs (checkAchievement + AchievementContext).
 * Does not modify any source files.
 */

function getAchievementById(id: string) {
  const ach = achievements.find(a => a.id === id);
  if (!ach) throw new Error(`Achievement not found: ${id}`);
  return ach;
}

describe('WS-103 P1: Achievement unlock integration (4 priority scenarios)', () => {

  // ============================================
  // Scenario 1: 完整 Sprint 后解锁新 v9 成就
  // ============================================
  describe('Scenario 1: Full sprint flow unlocks v9 achievements', () => {
    it('long_run_survivor unlocks after 20+ sprints', () => {
      const ach = getAchievementById('long-run-survivor');

      const context: AchievementContext = {
        completedProjectIds: [],
        fundsRemaining: 1000,
        totalFundsSpent: 0,
        agents: [],
        sprintCount: 20,
        projectsInOneGame: 0,
        history: [],
      };

      expect(checkAchievement(ach, context)).toBe(true);
    });

    it('long_run_survivor does not unlock before 20 sprints', () => {
      const ach = getAchievementById('long-run-survivor');

      const context: AchievementContext = {
        completedProjectIds: [],
        fundsRemaining: 1000,
        totalFundsSpent: 0,
        agents: [],
        sprintCount: 19,
        projectsInOneGame: 0,
        history: [],
      };

      expect(checkAchievement(ach, context)).toBe(false);
    });
  });

  // ============================================
  // Scenario 4: efficient_project 高成本不误解锁
  // ============================================
  describe('Scenario 4: efficient_project does not unlock on high-cost high-progress', () => {
    it('returns false when progress >=65 but cost > 350', () => {
      const ach = getAchievementById('efficient-project');

      const context: AchievementContext = {
        completedProjectIds: ['p1'],
        fundsRemaining: 500,
        totalFundsSpent: 0,
        agents: [],
        sprintCount: 5,
        projectsInOneGame: 1,
        history: [
          { progressDelta: 72, cost: 420 }, // high progress, high cost
          { progressDelta: 30, cost: 100 },
        ],
      };

      expect(checkAchievement(ach, context)).toBe(false);
    });

    it('returns true only when both high progress and low cost (<=350)', () => {
      const ach = getAchievementById('efficient-project');

      const context: AchievementContext = {
        completedProjectIds: ['p1'],
        fundsRemaining: 500,
        totalFundsSpent: 0,
        agents: [],
        sprintCount: 5,
        projectsInOneGame: 1,
        history: [
          { progressDelta: 68, cost: 280 }, // qualifies
        ],
      };

      expect(checkAchievement(ach, context)).toBe(true);
    });

    it('returns false when no history entry meets the dual condition', () => {
      const ach = getAchievementById('efficient-project');

      const context: AchievementContext = {
        completedProjectIds: [],
        fundsRemaining: 1000,
        totalFundsSpent: 0,
        agents: [],
        sprintCount: 3,
        projectsInOneGame: 0,
        history: [
          { progressDelta: 80, cost: 500 },
          { progressDelta: 20, cost: 100 },
        ],
      };

      expect(checkAchievement(ach, context)).toBe(false);
    });
  });

  // ============================================
  // Additional coverage for v9 achievements in realistic contexts
  // ============================================
  describe('v9 achievement boundary in realistic post-sprint context', () => {
    it('bug_survivor_streak true when a sprint had >=10 bugs + positive progress', () => {
      const ach = getAchievementById('bug-survivor-streak');

      const context: AchievementContext = {
        completedProjectIds: ['p1'],
        fundsRemaining: 800,
        totalFundsSpent: 1200,
        agents: [],
        sprintCount: 8,
        projectsInOneGame: 1,
        history: [
          { progressDelta: 45, bugsDelta: 12, cost: 300 },
        ],
      };

      expect(checkAchievement(ach, context)).toBe(true);
    });
  });
});
