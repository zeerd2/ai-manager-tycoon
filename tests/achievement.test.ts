import { describe, it, expect } from 'vitest';
import { checkAchievement, getAchievementProgress } from '../src/domain/achievement';
import { achievements } from '../src/data/achievements';
import type { AchievementContext } from '../src/domain/achievement';
import type { GameState } from '../src/domain/gameState';

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

  describe('max-skill', () => {
    const ach = getAchievement('max-skill');

    it('returns true if any agent has all skills >= 100', () => {
      const ctx = makeContext({
        agents: [
          {
            morale: 80,
            locked: false,
            skills: { coding: 100, debugging: 100, architecture: 100, creativity: 100, speed: 100 },
          },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if no agent has all skills >= 100', () => {
      const ctx = makeContext({
        agents: [
          {
            morale: 80,
            locked: false,
            skills: { coding: 100, debugging: 99, architecture: 100, creativity: 100, speed: 100 },
          },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('big-team', () => {
    const ach = getAchievement('big-team');

    it('returns true if 6 or more agents are unlocked', () => {
      const ctx = makeContext({
        agents: [
          { morale: 80, locked: false },
          { morale: 80, locked: false },
          { morale: 80, locked: false },
          { morale: 80, locked: false },
          { morale: 80, locked: false },
          { morale: 80, locked: false },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if less than 6 agents are unlocked', () => {
      const ctx = makeContext({
        agents: [
          { morale: 80, locked: false },
          { morale: 80, locked: false },
          { morale: 80, locked: true },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('talent-scout', () => {
    const ach = getAchievement('talent-scout');

    it('returns true if any agent has sum of skills >= 450', () => {
      const ctx = makeContext({
        agents: [
          {
            morale: 80,
            locked: false,
            skills: { coding: 90, debugging: 90, architecture: 90, creativity: 90, speed: 90 }, // sum = 450
          },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if no agent has sum of skills >= 450', () => {
      const ctx = makeContext({
        agents: [
          {
            morale: 80,
            locked: false,
            skills: { coding: 80, debugging: 80, architecture: 80, creativity: 80, speed: 80 }, // sum = 400
          },
        ],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('legendary-project', () => {
    const ach = getAchievement('legendary-project');

    it('returns true if completedProjectIds includes autopilot', () => {
      const ctx = makeContext({ completedProjectIds: ['chatbot', 'autopilot'] });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if completedProjectIds does not include autopilot', () => {
      const ctx = makeContext({ completedProjectIds: ['chatbot'] });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('financial-freedom', () => {
    const ach = getAchievement('financial-freedom');

    it('returns true if funds is 8000 or more', () => {
      const ctx = makeContext({ fundsRemaining: 8000 });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if funds is less than 8000', () => {
      const ctx = makeContext({ fundsRemaining: 7999 });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('big-spender', () => {
    const ach = getAchievement('big-spender');

    it('returns true if total spent is 10000 or more', () => {
      const ctx = makeContext({ totalFundsSpent: 10000 });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if total spent is less than 10000', () => {
      const ctx = makeContext({ totalFundsSpent: 9999 });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('survivor', () => {
    const ach = getAchievement('survivor');

    it('returns true if completed project and at least one sprint had >= 15 bugs', () => {
      const ctx = makeContext({
        completedProjectIds: ['chatbot'],
        history: [{ bugsDelta: 10, progressDelta: 20 }, { bugsDelta: 15, progressDelta: 5 }],
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if no project completed or no sprint had >= 15 bugs', () => {
      const ctx1 = makeContext({
        completedProjectIds: [],
        history: [{ bugsDelta: 15, progressDelta: 20 }],
      });
      expect(checkAchievement(ach, ctx1)).toBe(false);

      const ctx2 = makeContext({
        completedProjectIds: ['chatbot'],
        history: [{ bugsDelta: 14, progressDelta: 20 }],
      });
      expect(checkAchievement(ach, ctx2)).toBe(false);
    });
  });

  describe('murphy-law', () => {
    const ach = getAchievement('murphy-law');

    it('returns true if total bugs is 50 or more', () => {
      const ctx = makeContext({
        history: [{ bugsDelta: 30, progressDelta: 10 }, { bugsDelta: 20, progressDelta: 10 }],
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });

    it('returns false if total bugs is less than 50', () => {
      const ctx = makeContext({
        history: [{ bugsDelta: 30, progressDelta: 10 }, { bugsDelta: 19, progressDelta: 10 }],
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });
});

describe('getAchievementProgress', () => {
  const getAchievement = (id: string) => achievements.find(a => a.id === id)!;
  const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
    funds: 5000,
    sprintCount: 0,
    agents: [],
    projects: [],
    completedProjectIds: [],
    unlockedAchievementIds: [],
    gameOver: false,
    history: [],
    ...overrides,
  });

  it('tracks progress for first-blood', () => {
    const ach = getAchievement('first-blood');
    const state1 = makeGameState({ completedProjectIds: [] });
    expect(getAchievementProgress(ach, state1)).toEqual({ current: 0, target: 1, display: '0 / 1' });

    const state2 = makeGameState({ completedProjectIds: ['chatbot'] });
    expect(getAchievementProgress(ach, state2)).toEqual({ current: 1, target: 1, display: '1 / 1' });
  });

  it('tracks progress for bug-factory', () => {
    const ach = getAchievement('bug-factory');
    const state1 = makeGameState({
      history: [
        {
          sprintNumber: 1,
          project: {} as any,
          agents: [],
          strategy: {} as any,
          progressDelta: 10,
          bugsDelta: 12,
          techDebtDelta: 5,
          moraleDelta: 0,
          cost: 100,
          incidents: [],
          summary: '',
        },
      ],
    });
    expect(getAchievementProgress(ach, state1)).toEqual({ current: 12, target: 20, display: '12 / 20' });
  });

  it('tracks progress for big-team', () => {
    const ach = getAchievement('big-team');
    const state = makeGameState({
      agents: [
        { id: '1', locked: false, skills: {} } as any,
        { id: '2', locked: true, skills: {} } as any,
      ],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 1, target: 6, display: '1 / 6' });
  });

  it('tracks progress for financial-freedom', () => {
    const ach = getAchievement('financial-freedom');
    const state = makeGameState({ funds: 6500 });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 6500, target: 8000, display: '6500 / 8000' });
  });
});
