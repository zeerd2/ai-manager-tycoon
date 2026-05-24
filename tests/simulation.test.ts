import { describe, it, expect } from 'vitest';
import { runSprint } from '../src/domain/simulation';
import { createRNG } from '../src/domain/random';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';
import { incidentTemplates } from '../src/data/incidentTemplates';

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: 'test',
  name: 'Test Agent',
  model: 'test-model',
  role: 'Tester',
  avatar: 'T',
  skills: { coding: 80, debugging: 80, architecture: 80, creativity: 80, speed: 80 },
  salary: 100,
  morale: 80,
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

describe('runSprint', () => {
  it('produces a result with correct sprint number', () => {
    const rng = createRNG(42);
    const result = runSprint(5, [makeAgent()], makeProject(), neutralStrategy, incidentTemplates, rng);
    expect(result.sprintNumber).toBe(5);
  });

  it('increases project progress', () => {
    const rng = createRNG(42);
    const result = runSprint(1, [makeAgent()], makeProject(), neutralStrategy, incidentTemplates, rng);
    expect(result.project.progress).toBeGreaterThan(0);
    expect(result.progressDelta).toBeGreaterThan(0);
  });

  it('does not exceed max progress', () => {
    const rng = createRNG(42);
    const project = makeProject({ progress: 98, maxProgress: 100 });
    const result = runSprint(1, [makeAgent()], project, neutralStrategy, incidentTemplates, rng);
    expect(result.project.progress).toBeLessThanOrEqual(100);
  });

  it('keeps morale between 0 and 100', () => {
    const rng = createRNG(42);
    const crunchStrategy: Strategy = {
      ...neutralStrategy,
      modifiers: { ...neutralStrategy.modifiers, moraleDelta: -50 },
    };
    const result = runSprint(1, [makeAgent({ morale: 10 })], makeProject(), crunchStrategy, incidentTemplates, rng);
    for (const agent of result.agents) {
      expect(agent.morale).toBeGreaterThanOrEqual(0);
      expect(agent.morale).toBeLessThanOrEqual(100);
    }
  });

  it('generates a summary string', () => {
    const rng = createRNG(42);
    const result = runSprint(1, [makeAgent()], makeProject(), neutralStrategy, incidentTemplates, rng);
    expect(result.summary).toBeTruthy();
    expect(typeof result.summary).toBe('string');
  });

  it('is deterministic with the same RNG seed', () => {
    const result1 = runSprint(1, [makeAgent()], makeProject(), neutralStrategy, incidentTemplates, createRNG(42));
    const result2 = runSprint(1, [makeAgent()], makeProject(), neutralStrategy, incidentTemplates, createRNG(42));
    expect(result1.progressDelta).toBe(result2.progressDelta);
    expect(result1.bugsDelta).toBe(result2.bugsDelta);
    expect(result1.incidents.length).toBe(result2.incidents.length);
  });

  it('calculates cost from agent salaries', () => {
    const rng = createRNG(42);
    const agents = [makeAgent({ id: '1', salary: 200 }), makeAgent({ id: '2', salary: 300 })];
    const result = runSprint(1, agents, makeProject(), neutralStrategy, incidentTemplates, rng);
    expect(result.cost).toBe(500);
  });
});
