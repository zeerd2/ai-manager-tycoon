import { describe, it, expect } from 'vitest';
import { checkAchievement } from '../src/domain/achievement';
import { achievements } from '../src/data/achievements';
import type { AchievementContext } from '../src/domain/achievement';

const makeContext = (overrides: Partial<AchievementContext> = {}): AchievementContext => ({
  completedProjectIds: [],
  currentSprintBugs: 0,
  fundsRemaining: 1000,
  totalFundsSpent: 0,
  agents: [],
  sprintCount: 0,
  projectsInOneGame: 0,
  history: [],
  ...overrides,
});

describe('checkAchievement', () => {
  const getAchievement = (id: string) => achievements.find(a => a.id === id)!;

  describe('first-blood', () => {
    const ach = getAchievement('first-blood');

    it('returns true if at least one project is completed', () => {
      const ctx = makeContext({ completedProjectIds: ['project-1'] });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if no project is completed', () => {
      const ctx = makeContext({ completedProjectIds: [] });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('bug-factory', () => {
    const ach = getAchievement('bug-factory');

    it('returns true if current sprint bugs is 20 or more', () => {
      const ctx1 = makeContext({ currentSprintBugs: 20 });
      expect(checkAchievement(ach, ctx1)).toBe(true);

      const ctx2 = makeContext({ currentSprintBugs: 25 });
      expect(checkAchievement(ach, ctx2)).toBe(true);
    });

    it('returns false if current sprint bugs is less than 20 or undefined', () => {
      const ctx1 = makeContext({ currentSprintBugs: 19 });
      expect(checkAchievement(ach, ctx1)).toBe(false);

      const ctx2 = makeContext({ currentSprintBugs: undefined });
      expect(checkAchievement(ach, ctx2)).toBe(false);
    });
  });

  describe('under-budget', () => {
    const ach = getAchievement('under-budget');

    it('returns true if project completed and remaining funds is > 80% of total funds', () => {
      const ctx = makeContext({
        completedProjectIds: ['proj-1'],
        fundsRemaining: 900,
        totalFundsSpent: 100, // Total = 1000, remaining = 90%
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if project completed but remaining funds is <= 80% of total funds', () => {
      const ctx1 = makeContext({
        completedProjectIds: ['proj-1'],
        fundsRemaining: 800,
        totalFundsSpent: 200, // Total = 1000, remaining = 80%
      });
      expect(checkAchievement(ach, ctx1)).toBe(false);

      const ctx2 = makeContext({
        completedProjectIds: ['proj-1'],
        fundsRemaining: 500,
        totalFundsSpent: 500, // Total = 1000, remaining = 50%
      });
      expect(checkAchievement(ach, ctx2)).toBe(false);
    });

    it('returns false if no projects completed', () => {
      const ctx = makeContext({
        completedProjectIds: [],
        fundsRemaining: 900,
        totalFundsSpent: 100,
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('team-wipe', () => {
    const ach = getAchievement('team-wipe');

    it('returns true if all agents have 0 morale', () => {
      const ctx = makeContext({
        agents: [
          { morale: 0, locked: false },
          { morale: 0, locked: true },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if at least one agent has morale > 0', () => {
      const ctx1 = makeContext({
        agents: [
          { morale: 0, locked: false },
          { morale: 5, locked: false },
        ],
      });
      expect(checkAchievement(ach, ctx1)).toBe(false);

      const ctx2 = makeContext({
        agents: [],
      });
      expect(checkAchievement(ach, ctx2)).toBe(false);
    });
  });

  describe('10x-company', () => {
    const ach = getAchievement('10x-company');

    it('returns true if completed projects count is 3 or more', () => {
      const ctx1 = makeContext({ projectsInOneGame: 3 });
      expect(checkAchievement(ach, ctx1)).toBe(true);

      const ctx2 = makeContext({ projectsInOneGame: 5 });
      expect(checkAchievement(ach, ctx2)).toBe(true);
    });

    it('returns false if completed projects count is less than 3', () => {
      const ctx = makeContext({ projectsInOneGame: 2 });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('speed-run', () => {
    const ach = getAchievement('speed-run');

    it('returns true if project completed in 5 sprints or fewer', () => {
      const ctx1 = makeContext({ completedProjectIds: ['proj-1'], sprintCount: 5 });
      expect(checkAchievement(ach, ctx1)).toBe(true);

      const ctx2 = makeContext({ completedProjectIds: ['proj-1'], sprintCount: 3 });
      expect(checkAchievement(ach, ctx2)).toBe(true);
    });

    it('returns false if project completed in more than 5 sprints', () => {
      const ctx = makeContext({ completedProjectIds: ['proj-1'], sprintCount: 6 });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });

    it('returns false if no project completed', () => {
      const ctx = makeContext({ completedProjectIds: [], sprintCount: 3 });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('iron-man', () => {
    const ach = getAchievement('iron-man');

    it('returns true if any agent worked 6 or more consecutive sprints', () => {
      const ctx1 = makeContext({
        agents: [
          { morale: 80, locked: false, consecutiveSprints: 6 },
          { morale: 50, locked: false, consecutiveSprints: 2 },
        ],
      });
      expect(checkAchievement(ach, ctx1)).toBe(true);

      const ctx2 = makeContext({
        agents: [
          { morale: 80, locked: false, consecutiveWorkCount: 7 },
        ],
      });
      expect(checkAchievement(ach, ctx2)).toBe(true);
    });

    it('returns false if no agents worked 6 or more consecutive sprints', () => {
      const ctx = makeContext({
        agents: [
          { morale: 80, locked: false, consecutiveSprints: 5 },
          { morale: 50, locked: false, consecutiveWorkCount: 4 },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('penny-pincher', () => {
    const ach = getAchievement('penny-pincher');

    it('returns true if cheapestAgentOnly is true in context', () => {
      const ctx = makeContext({ cheapestAgentOnly: true });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns true if project completed and all agents are cheapest (salary <= 80 or isCheapest)', () => {
      const ctx1 = makeContext({
        completedProjectIds: ['proj-1'],
        agents: [
          { morale: 80, locked: false, salary: 80 },
        ],
      });
      expect(checkAchievement(ach, ctx1)).toBe(true);

      const ctx2 = makeContext({
        completedProjectIds: ['proj-1'],
        agents: [
          { morale: 80, locked: false, isCheapest: true },
        ],
      });
      expect(checkAchievement(ach, ctx2)).toBe(true);
    });

    it('returns false if any agent is not cheapest', () => {
      const ctx = makeContext({
        completedProjectIds: ['proj-1'],
        agents: [
          { morale: 80, locked: false, salary: 80 },
          { morale: 80, locked: false, salary: 150 },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });

    it('returns false if no project completed and cheapestAgentOnly not set', () => {
      const ctx = makeContext({
        completedProjectIds: [],
        agents: [
          { morale: 80, locked: false, salary: 80 },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });
});
