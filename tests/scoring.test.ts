import { describe, it, expect } from 'vitest';
import { calculateSprintScores } from '../src/domain/scoring';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'test',
  name: 'Test Agent',
  model: 'test-model',
  role: 'Tester',
  avatar: 'T',
  skills: { coding: 80, debugging: 80, architecture: 80, creativity: 80, speed: 80 },
  salary: 100,
  morale: 100,
  quirk: 'none',
  fatigue: 0,
  consecutiveSprints: 0,
  totalSprintsWorked: 0,
  locked: false,
  ...overrides,
});

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'proj',
  name: 'Test Project',
  description: 'test',
  difficulty: 50,
  urgency: 50,
  risk: 50,
  progress: 0,
  bugs: 0,
  techDebt: 0,
  maxProgress: 100,
  ...overrides,
});

const neutralStrategy: Strategy = {
  id: 'neutral',
  name: 'Neutral',
  description: 'test',
  modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 },
};

describe('calculateSprintScores', () => {
  it('returns positive progress for a team with good skills', () => {
    const agents = [makeAgent()];
    const project = makeProject();
    const scores = calculateSprintScores(agents, project, neutralStrategy);
    expect(scores.rawProgress).toBeGreaterThan(0);
  });

  it('scales progress with team size', () => {
    const oneAgent = [makeAgent()];
    const twoAgents = [makeAgent({ id: '1' }), makeAgent({ id: '2' })];
    const project = makeProject();
    const scores1 = calculateSprintScores(oneAgent, project, neutralStrategy);
    const scores2 = calculateSprintScores(twoAgents, project, neutralStrategy);
    expect(scores2.rawProgress).toBeGreaterThan(scores1.rawProgress);
  });

  it('applies strategy multipliers', () => {
    const agents = [makeAgent()];
    const project = makeProject();
    const fastStrategy: Strategy = {
      ...neutralStrategy,
      id: 'fast',
      modifiers: { ...neutralStrategy.modifiers, progressMul: 2 },
    };
    const normal = calculateSprintScores(agents, project, neutralStrategy);
    const fast = calculateSprintScores(agents, project, fastStrategy);
    expect(fast.rawProgress).toBeGreaterThan(normal.rawProgress);
  });

  it('calculates total cost from salaries', () => {
    const agents = [makeAgent({ salary: 200 }), makeAgent({ id: '2', salary: 300 })];
    const project = makeProject();
    const scores = calculateSprintScores(agents, project, neutralStrategy);
    expect(scores.totalCost).toBe(500);
  });

  it('returns zero progress for empty team', () => {
    const scores = calculateSprintScores([], makeProject(), neutralStrategy);
    expect(scores.rawProgress).toBe(0);
    expect(scores.totalCost).toBe(0);
  });

  it('higher difficulty reduces progress', () => {
    const agents = [makeAgent()];
    const easy = calculateSprintScores(agents, makeProject({ difficulty: 10 }), neutralStrategy);
    const hard = calculateSprintScores(agents, makeProject({ difficulty: 90 }), neutralStrategy);
    expect(easy.rawProgress).toBeGreaterThan(hard.rawProgress);
  });
});
