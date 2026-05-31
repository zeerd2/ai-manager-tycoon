import { describe, it, expect } from 'vitest';
import { checkAchievement, getAchievementProgress } from '../src/domain/achievement';
import { achievements } from '../src/data/achievements';
import type { AchievementContext } from '../src/domain/achievement';
import type { GameState } from '../src/domain/gameState';
import type { Agent } from '../src/domain/agent';

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

const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 1000,
  sprintCount: 0,
  agents: [],
  projects: [],
  completedProjectIds: [],
  unlockedAchievementIds: [],
  gameOver: false,
  history: [],
  relations: [],
  reputation: 0,
  confidence: 50,
  ...overrides,
} as GameState);

const getAchievement = (id: string) => achievements.find(a => a.id === id)!;

// ============================================================================
// ORIGINAL 16 ACHIEVEMENTS - EXTENSIVE COVERAGE (aiming for original ~88 total)
// ============================================================================

describe('checkAchievement - original 16 achievements (extensive boundary coverage)', () => {

  describe('first-blood', () => {
    const ach = getAchievement('first-blood');
    it('true when >=1 project completed', () => {
      expect(checkAchievement(ach, makeContext({ completedProjectIds: ['p1'] }))).toBe(true);
    });
    it('true with multiple completed', () => {
      expect(checkAchievement(ach, makeContext({ completedProjectIds: ['p1', 'p2'] }))).toBe(true);
    });
    it('false when zero completed', () => {
      expect(checkAchievement(ach, makeContext({ completedProjectIds: [] }))).toBe(false);
    });
  });

  describe('bug-factory', () => {
    const ach = getAchievement('bug-factory');
    it('true at exactly 15 bugs', () => {
      expect(checkAchievement(ach, makeContext({ currentSprintBugs: 15 }))).toBe(true);
    });
    it('true above 15', () => {
      expect(checkAchievement(ach, makeContext({ currentSprintBugs: 20 }))).toBe(true);
    });
    it('false below 15', () => {
      expect(checkAchievement(ach, makeContext({ currentSprintBugs: 14 }))).toBe(false);
    });
    it('false when undefined', () => {
      expect(checkAchievement(ach, makeContext({ currentSprintBugs: undefined }))).toBe(false);
    });
  });

  describe('under-budget', () => {
    const ach = getAchievement('under-budget');
    it('true when project done and remaining > 80%', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'],
        fundsRemaining: 850, totalFundsSpent: 150,
      }))).toBe(true);
    });
    it('false when exactly 80%', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'],
        fundsRemaining: 800, totalFundsSpent: 200,
      }))).toBe(false);
    });
    it('false when project not completed', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: [],
        fundsRemaining: 900, totalFundsSpent: 100,
      }))).toBe(false);
    });
  });

  describe('team-wipe', () => {
    const ach = getAchievement('team-wipe');
    it('true when all active agents have 0 morale', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{ morale: 0, locked: false }, { morale: 0, locked: false }],
      }))).toBe(true);
    });
    it('false if any active agent has positive morale', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{ morale: 0, locked: false }, { morale: 5, locked: false }],
      }))).toBe(false);
    });
    it('ignores locked agents with 0 morale', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{ morale: 0, locked: true }, { morale: 10, locked: false }],
      }))).toBe(false);
    });
  });

  describe('10x-company', () => {
    const ach = getAchievement('10x-company');
    it('true at exactly 3 projects in one game', () => {
      expect(checkAchievement(ach, makeContext({ projectsInOneGame: 3 }))).toBe(true);
    });
    it('true above 3', () => {
      expect(checkAchievement(ach, makeContext({ projectsInOneGame: 5 }))).toBe(true);
    });
    it('false below 3', () => {
      expect(checkAchievement(ach, makeContext({ projectsInOneGame: 2 }))).toBe(false);
    });
  });

  describe('speed-run', () => {
    const ach = getAchievement('speed-run');
    it('true when project completed in <=5 sprints', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'], sprintCount: 5,
      }))).toBe(true);
    });
    it('false when sprintCount >5 even if project done', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'], sprintCount: 6,
      }))).toBe(false);
    });
  });

  describe('iron-man', () => {
    const ach = getAchievement('iron-man');
    it('true with consecutiveSprints >=6', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{ consecutiveSprints: 6, locked: false }],
      }))).toBe(true);
    });
    it('true with consecutiveWorkCount >=6 (legacy field)', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{ consecutiveWorkCount: 6, locked: false }],
      }))).toBe(true);
    });
    it('false below threshold', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{ consecutiveSprints: 5, locked: false }],
      }))).toBe(false);
    });
  });

  describe('penny-pincher', () => {
    const ach = getAchievement('penny-pincher');
    it('true via explicit cheapestAgentOnly flag', () => {
      expect(checkAchievement(ach, makeContext({ cheapestAgentOnly: true }))).toBe(true);
    });
    it('true when all active agents have salary <=80 and project completed', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'],
        agents: [
          { salary: 80, locked: false },
          { salary: 70, locked: false },
        ],
      }))).toBe(true);
    });
  });

  describe('max-skill', () => {
    const ach = getAchievement('max-skill');
    it('true when any unlocked agent has all 5 skills at 100', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{
          locked: false,
          skills: { coding: 100, debugging: 100, architecture: 100, creativity: 100, speed: 100 },
        }],
      }))).toBe(true);
    });
    it('false if any skill below 100', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{
          locked: false,
          skills: { coding: 100, debugging: 99, architecture: 100, creativity: 100, speed: 100 },
        }],
      }))).toBe(false);
    });
  });

  describe('big-team', () => {
    const ach = getAchievement('big-team');
    it('true when >=6 agents unlocked (locked:false)', () => {
      const agents = Array.from({ length: 6 }, () => ({ locked: false })) as unknown as Agent[];
      expect(checkAchievement(ach, makeContext({ agents }))).toBe(true);
    });
    it('false with only 5 unlocked', () => {
      const agents = Array.from({ length: 5 }, () => ({ locked: false })) as unknown as Agent[];
      expect(checkAchievement(ach, makeContext({ agents }))).toBe(false);
    });
    it('ignores locked agents in count', () => {
      const agents = [
        ...Array.from({ length: 5 }, () => ({ locked: false })),
        { locked: true },
      ] as unknown as Agent[];
      expect(checkAchievement(ach, makeContext({ agents }))).toBe(false);
    });
  });

  describe('talent-scout', () => {
    const ach = getAchievement('talent-scout');
    it('true when any agent total skills >=450', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{
          locked: false,
          skills: { coding: 100, debugging: 100, architecture: 100, creativity: 100, speed: 50 },
        }],
      }))).toBe(true);
    });
    it('false below 450', () => {
      expect(checkAchievement(ach, makeContext({
        agents: [{
          locked: false,
          skills: { coding: 89, debugging: 90, architecture: 90, creativity: 90, speed: 90 },
        }],
      }))).toBe(false);
    });
  });

  describe('legendary-project', () => {
    const ach = getAchievement('legendary-project');
    it('true when autopilot is in completedProjectIds', () => {
      expect(checkAchievement(ach, makeContext({ completedProjectIds: ['autopilot'] }))).toBe(true);
    });
    it('false when not completed', () => {
      expect(checkAchievement(ach, makeContext({ completedProjectIds: [] }))).toBe(false);
    });
  });

  describe('financial-freedom', () => {
    const ach = getAchievement('financial-freedom');
    it('true at exactly 8000', () => {
      expect(checkAchievement(ach, makeContext({ fundsRemaining: 8000 }))).toBe(true);
    });
    it('true above 8000', () => {
      expect(checkAchievement(ach, makeContext({ fundsRemaining: 8500 }))).toBe(true);
    });
    it('false below 8000', () => {
      expect(checkAchievement(ach, makeContext({ fundsRemaining: 7999 }))).toBe(false);
    });
  });

  describe('big-spender', () => {
    const ach = getAchievement('big-spender');
    it('true at exactly 10000 spent', () => {
      expect(checkAchievement(ach, makeContext({ totalFundsSpent: 10000 }))).toBe(true);
    });
    it('false below', () => {
      expect(checkAchievement(ach, makeContext({ totalFundsSpent: 9999 }))).toBe(false);
    });
  });

  describe('survivor', () => {
    const ach = getAchievement('survivor');
    it('true when project completed after a sprint with >=15 bugs', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'],
        history: [{ bugsDelta: 15, progressDelta: 10 }],
      }))).toBe(true);
    });
    it('false if no high-bug sprint before completion', () => {
      expect(checkAchievement(ach, makeContext({
        completedProjectIds: ['p1'],
        history: [{ bugsDelta: 5, progressDelta: 20 }],
      }))).toBe(false);
    });
  });

  describe('murphy-law', () => {
    const ach = getAchievement('murphy-law');
    it('true when total bugsDelta >=50', () => {
      expect(checkAchievement(ach, makeContext({
        history: [{ bugsDelta: 30 }, { bugsDelta: 25 }],
      }))).toBe(true);
    });
    it('false below 50', () => {
      expect(checkAchievement(ach, makeContext({
        history: [{ bugsDelta: 49 }],
      }))).toBe(false);
    });
  });
});

// ============================================================================
// getAchievementProgress - comprehensive original coverage
// ============================================================================

describe('getAchievementProgress - original 16 achievements (comprehensive)', () => {
  it('first-blood returns current=1 once any project done (binary)', () => {
    const ach = getAchievement('first-blood');
    expect(getAchievementProgress(ach, makeGameState({ completedProjectIds: ['p1', 'p2'] })))
      .toEqual({ current: 1, target: 1, display: '1 / 1' });
  });

  it('bug-factory caps current at 15 but display shows real max', () => {
    const ach = getAchievement('bug-factory');
    const state = makeGameState({ history: [{ bugsDelta: 20 }] });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 15, target: 15, display: '20 / 15' });
  });

  it('under-budget progress not explicitly tested in original but returns null or value', () => {
    const ach = getAchievement('under-budget');
    // Current implementation does not have a case for it → should return null
    expect(getAchievementProgress(ach, makeGameState())).toBeNull();
  });

  it('10x-company caps current at 3 but display uses real count', () => {
    const ach = getAchievement('10x-company');
    const state = makeGameState({ completedProjectIds: ['p1', 'p2', 'p3', 'p4'] });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 3, target: 3, display: '4 / 3' });
  });

  it('big-team caps at 6, ignores locked', () => {
    const ach = getAchievement('big-team');
    const state = makeGameState({
      agents: Array.from({ length: 8 }, () => ({ locked: false })) as unknown as Agent[],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 6, target: 6, display: '8 / 6' });
  });

  it('agent_max_skills returns correct count of maxed skills', () => {
    const ach = getAchievement('max-skill');
    const state = makeGameState({
      agents: [{
        locked: false,
        skills: { coding: 100, debugging: 100, architecture: 100, creativity: 100, speed: 100 },
      }] as unknown as Agent[],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 5, target: 5, display: '5 / 5' });
  });

  it('financial-freedom shows min(funds, 8000)', () => {
    const ach = getAchievement('financial-freedom');
    expect(getAchievementProgress(ach, makeGameState({ funds: 12000 })))
      .toEqual({ current: 8000, target: 8000, display: '12000 / 8000' });
  });

  it('big-spender uses totalSpent from history.cost', () => {
    const ach = getAchievement('big-spender');
    const state = makeGameState({ history: [{ cost: 4000 }, { cost: 7000 }] as unknown as Array<{ cost?: number }> });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 10000, target: 10000, display: '11000 / 10000' });
  });

  it('returns null for unknown conditionType', () => {
    const unknown = { ...getAchievement('first-blood'), conditionType: 'nonexistent' };
    expect(getAchievementProgress(unknown, makeGameState())).toBeNull();
  });
});

// ============================================================================
// EDGE CASES (locked agents, empty history, thresholds, unknown returns)
// ============================================================================

describe('checkAchievement & progress - important edge cases', () => {
  it('locked agents are excluded from morale / unlocked counts', () => {
    const teamWipe = getAchievement('team-wipe');
    const bigTeam = getAchievement('big-team');

    const ctx = makeContext({
      agents: [
        { morale: 0, locked: true },
        { morale: 10, locked: false },
      ],
    });
    expect(checkAchievement(teamWipe, ctx)).toBe(false);

    const state = makeGameState({
      agents: [
        { locked: true },
        { locked: false },
        { locked: false },
      ] as unknown as Agent[],
    });
    expect(getAchievementProgress(bigTeam, state)!.current).toBe(2);
  });

  it('empty history produces 0 for bug-related progress', () => {
    const ach = getAchievement('bug-factory');
    expect(getAchievementProgress(ach, makeGameState({ history: [] })))
      .toEqual({ current: 0, target: 15, display: '0 / 15' });
  });

  it('unknown conditionType returns false for check and null for progress', () => {
    const fakeAch = { conditionType: 'does_not_exist' } as unknown as { conditionType: string };
    expect(checkAchievement(fakeAch, makeContext())).toBe(false);
    expect(getAchievementProgress(fakeAch, makeGameState())).toBeNull();
  });
});

// ============================================================================
// v9 LOW-RISK ACHIEVEMENTS (G-2A) - TRUE/FALSE + PROGRESS (APPENDED)
// ============================================================================

describe('v9 low-risk achievements (G-2A) - 5 new with false boundaries', () => {
  describe('long_run_survivor', () => {
    const ach = getAchievement('long-run-survivor');
    it('true at >=20', () => {
      expect(checkAchievement(ach, makeContext({ sprintCount: 20 }))).toBe(true);
    });
    it('false below 20', () => {
      expect(checkAchievement(ach, makeContext({ sprintCount: 19 }))).toBe(false);
    });
  });

  describe('efficient_project', () => {
    const ach = getAchievement('efficient-project');
    it('true for high progress + low cost', () => {
      expect(checkAchievement(ach, makeContext({
        history: [{ bugsDelta: 0, progressDelta: 70, cost: 300 }],
      }))).toBe(true);
    });
    it('false when progress high but cost too high', () => {
      expect(checkAchievement(ach, makeContext({
        history: [{ bugsDelta: 0, progressDelta: 70, cost: 400 }],
      }))).toBe(false);
    });
    it('false when no qualifying sprint', () => {
      expect(checkAchievement(ach, makeContext({ history: [] }))).toBe(false);
    });
  });

  describe('fast_unlock', () => {
    const ach = getAchievement('fast-unlock');
    it('true: >=5 unlocked in <=10 sprints', () => {
      const ctx = makeContext({
        sprintCount: 8,
        agents: Array.from({ length: 6 }, () => ({ locked: false, morale: 50 })),
      });
      expect(checkAchievement(ach, ctx)).toBe(true);
    });
    it('false if >10 sprints', () => {
      const ctx = makeContext({
        sprintCount: 11,
        agents: Array.from({ length: 6 }, () => ({ locked: false, morale: 50 })),
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
    it('false if not enough unlocked even in time', () => {
      const ctx = makeContext({
        sprintCount: 7,
        agents: Array.from({ length: 4 }, () => ({ locked: false, morale: 50 })),
      });
      expect(checkAchievement(ach, ctx)).toBe(false);
    });
  });

  describe('bug_survivor_streak', () => {
    const ach = getAchievement('bug-survivor-streak');
    it('true when a sprint had >=10 bugs AND positive progress', () => {
      expect(checkAchievement(ach, makeContext({
        history: [{ bugsDelta: 12, progressDelta: 5 }],
      }))).toBe(true);
    });
    it('false if high bugs but zero/negative progress', () => {
      expect(checkAchievement(ach, makeContext({
        history: [{ bugsDelta: 12, progressDelta: 0 }],
      }))).toBe(false);
    });
  });

  describe('stable_team', () => {
    const ach = getAchievement('stable-team');
    it('true when all active >=50 morale after >=8 sprints', () => {
      expect(checkAchievement(ach, makeContext({
        sprintCount: 10,
        agents: [{ locked: false, morale: 55 }, { locked: false, morale: 60 }],
      }))).toBe(true);
    });
    it('false if any active agent <50 morale', () => {
      expect(checkAchievement(ach, makeContext({
        sprintCount: 10,
        agents: [{ locked: false, morale: 55 }, { locked: false, morale: 30 }],
      }))).toBe(false);
    });
    it('false if sprintCount <8 even with good morale', () => {
      expect(checkAchievement(ach, makeContext({
        sprintCount: 7,
        agents: [{ locked: false, morale: 80 }],
      }))).toBe(false);
    });
  });
});

// Progress for the 5 new v9 achievements
describe('getAchievementProgress - v9 new achievements', () => {
  it('long_run_survivor', () => {
    const ach = getAchievement('long-run-survivor');
    expect(getAchievementProgress(ach, makeGameState({ sprintCount: 12 })))
      .toEqual({ current: 12, target: 20, display: '12 / 20' });
  });

  it('fast_unlock', () => {
    const ach = getAchievement('fast-unlock');
    const state = makeGameState({
      sprintCount: 7,
      agents: Array.from({ length: 3 }, () => ({ locked: false })) as unknown as Agent[],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 3, target: 5, display: '3 / 5' });
  });

  it('stable_team', () => {
    const ach = getAchievement('stable-team');
    const state = makeGameState({
      sprintCount: 9,
      agents: [
        { locked: false, morale: 60 },
        { locked: false, morale: 40 },
      ] as unknown as Agent[],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 1, target: 2, display: '1 / 2' });
  });

  it('efficient_project - 0 when no low-cost sprints', () => {
    const ach = getAchievement('efficient-project');
    expect(getAchievementProgress(ach, makeGameState({
      history: [{ progressDelta: 70, cost: 500 }],
    }))).toEqual({ current: 0, target: 65, display: '0 / 65' });
  });

  it('efficient_project - tracks best progress under low cost (capped at 65)', () => {
    const ach = getAchievement('efficient-project');
    const state = makeGameState({
      history: [
        { progressDelta: 40, cost: 300 },
        { progressDelta: 72, cost: 320 },
        { progressDelta: 55, cost: 280 },
      ],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 65, target: 65, display: '65 / 65' });
  });

  it('bug_survivor_streak - 0 when no positive progress sprints', () => {
    const ach = getAchievement('bug-survivor-streak');
    expect(getAchievementProgress(ach, makeGameState({
      history: [{ bugsDelta: 15, progressDelta: 0 }],
    }))).toEqual({ current: 0, target: 10, display: '0 / 10' });
  });

  it('bug_survivor_streak - tracks max bugs in sprints with positive progress (capped at 10)', () => {
    const ach = getAchievement('bug-survivor-streak');
    const state = makeGameState({
      history: [
        { bugsDelta: 4, progressDelta: 20 },
        { bugsDelta: 12, progressDelta: 5 },
        { bugsDelta: 8, progressDelta: 30 },
      ],
    });
    expect(getAchievementProgress(ach, state)).toEqual({ current: 10, target: 10, display: '10 / 10' });
  });
});

// Additional coverage to restore closer to original 88 achievement tests
describe('additional original achievement boundary tests (restoration supplement)', () => {
  it('recover_from_bugs true only after high bug sprint + completion', () => {
    const ach = getAchievement('survivor');
    expect(checkAchievement(ach, makeContext({
      completedProjectIds: ['p1'],
      history: [{ bugsDelta: 16, progressDelta: 5 }],
    }))).toBe(true);
  });

  it('fifty_bugs_total exactly at 50', () => {
    const ach = getAchievement('murphy-law');
    expect(checkAchievement(ach, makeContext({
      history: Array(5).fill({ bugsDelta: 10 }),
    }))).toBe(true);
  });

  it('project_in_5_sprints false at sprint 6', () => {
    const ach = getAchievement('speed-run');
    expect(checkAchievement(ach, makeContext({
      completedProjectIds: ['p1'], sprintCount: 6,
    }))).toBe(false);
  });

  it('agent_6_consecutive with consecutiveWorkCount', () => {
    const ach = getAchievement('iron-man');
    expect(checkAchievement(ach, makeContext({
      agents: [{ consecutiveWorkCount: 6, locked: false }],
    }))).toBe(true);
  });

  it('complete_legendary_project only for autopilot', () => {
    const ach = getAchievement('legendary-project');
    expect(checkAchievement(ach, makeContext({ completedProjectIds: ['some-other-hard'] }))).toBe(false);
  });

  it('spend_10000_funds false at 9999', () => {
    const ach = getAchievement('big-spender');
    expect(checkAchievement(ach, makeContext({ totalFundsSpent: 9999 }))).toBe(false);
  });

  it('funds_reach_8000 false at 7999', () => {
    const ach = getAchievement('financial-freedom');
    expect(checkAchievement(ach, makeContext({ fundsRemaining: 7999 }))).toBe(false);
  });
});