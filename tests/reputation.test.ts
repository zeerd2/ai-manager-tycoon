import { describe, it, expect } from 'vitest';
import {
  calculateReputationDelta,
  calculateNewReputation,
  getReputationLevel,
  getReputationLabel,
  MIN_REPUTATION,
  MAX_REPUTATION,
  DEFAULT_IMPACT,
  summarizeReputationFactors,
} from '../src/domain/reputation';
import type { SprintResult } from '../src/domain/simulation';
import type { GameState } from '../src/domain/gameState';

const makeSprintResult = (overrides: Partial<SprintResult> = {}): SprintResult => ({
  sprintNumber: 1,
  project: { id: 'p1', name: 'Test', maxProgress: 100, progress: 30 } as SprintResult['project'],
  agents: [],
  strategy: { id: 's1', name: 'S1', description: 'D1', modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 } },
  progressDelta: 30,
  bugsDelta: 5,
  techDebtDelta: 3,
  moraleDelta: 0,
  cost: 100,
  incidents: [],
  summary: 'Test sprint',
  ...overrides,
});

describe('calculateReputationDelta', () => {
  it('returns positive delta when project is completed and no bugs/techDebt', () => {
    const result = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });
    const delta = calculateReputationDelta(result, true);
    expect(delta).toBe(15); // projectCompleted
  });

  it('returns negative delta when bugs and tech debt exist without project completion', () => {
    const result = makeSprintResult({ bugsDelta: 10, techDebtDelta: 5 });
    const delta = calculateReputationDelta(result, false);
    expect(delta).toBe(-25); // 10*-2 + 5*-1
  });

  it('combines project completion bonus with bug/tech debt penalties', () => {
    const result = makeSprintResult({ bugsDelta: 3, techDebtDelta: 2 });
    const delta = calculateReputationDelta(result, true);
    expect(delta).toBe(7); // 15 + 3*-2 + 2*-1
  });

  it('returns 0 delta when nothing happens', () => {
    const result = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });
    const delta = calculateReputationDelta(result, false);
    expect(delta).toBe(0);
  });

  it('uses custom impact multipliers when provided', () => {
    const result = makeSprintResult({ bugsDelta: 1, techDebtDelta: 1 });
    const customImpact = { projectCompleted: 5, bugsPerSprint: -5, techDebtPerSprint: -3, fundMilestone: 0 };
    const deltaWithProject = calculateReputationDelta(result, true, customImpact);
    const deltaWithoutProject = calculateReputationDelta(result, false, customImpact);
    expect(deltaWithProject).toBe(-3); // 5 + 1*-5 + 1*-3
    expect(deltaWithoutProject).toBe(-8); // 0 + 1*-5 + 1*-3
  });
});

describe('calculateNewReputation', () => {
  it('adds delta to current score', () => {
    const result = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });
    const newScore = calculateNewReputation(50, result, true);
    expect(newScore).toBe(65); // 50 + 15
  });

  it('subtracts delta when negative', () => {
    const result = makeSprintResult({ bugsDelta: 10, techDebtDelta: 5 });
    const newScore = calculateNewReputation(30, result, false);
    expect(newScore).toBe(5); // 30 - 25
  });

  it('clamps score to MAX_REPUTATION', () => {
    const result = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });
    const newScore = calculateNewReputation(MAX_REPUTATION, result, true);
    expect(newScore).toBe(MAX_REPUTATION);
  });

  it('clamps score to MIN_REPUTATION', () => {
    const result = makeSprintResult({ bugsDelta: 100, techDebtDelta: 100 });
    const newScore = calculateNewReputation(MIN_REPUTATION, result, false);
    expect(newScore).toBe(MIN_REPUTATION);
  });

  it('rounds the score to an integer', () => {
    const result = makeSprintResult({ bugsDelta: 0.5, techDebtDelta: 0.3 });
    const newScore = calculateNewReputation(10, result, true);
    expect(Number.isInteger(newScore)).toBe(true);
  });
});

describe('getReputationLevel', () => {
  it('returns very_high for score >= 60', () => {
    expect(getReputationLevel(60)).toBe('very_high');
    expect(getReputationLevel(100)).toBe('very_high');
  });

  it('returns high for score 20-59', () => {
    expect(getReputationLevel(20)).toBe('high');
    expect(getReputationLevel(59)).toBe('high');
  });

  it('returns medium for score -20 to 19', () => {
    expect(getReputationLevel(0)).toBe('medium');
    expect(getReputationLevel(-20)).toBe('medium');
    expect(getReputationLevel(19)).toBe('medium');
  });

  it('returns low for score -60 to -21', () => {
    expect(getReputationLevel(-21)).toBe('low');
    expect(getReputationLevel(-60)).toBe('low');
  });

  it('returns very_low for score < -60', () => {
    expect(getReputationLevel(-61)).toBe('very_low');
    expect(getReputationLevel(-100)).toBe('very_low');
  });
});

describe('getReputationLabel', () => {
  it('returns Chinese label for each level', () => {
    expect(getReputationLabel(80)).toBe('极高');
    expect(getReputationLabel(40)).toBe('高');
    expect(getReputationLabel(0)).toBe('中');
    expect(getReputationLabel(-40)).toBe('低');
    expect(getReputationLabel(-80)).toBe('极低');
  });
});

describe('summarizeReputationFactors', () => {
  it('counts completed projects from completedProjectIds', () => {
    const state: GameState = {
      funds: 5000,
      sprintCount: 5,
      agents: [],
      projects: [],
      completedProjectIds: ['p1', 'p2', 'p3'],
      unlockedAchievementIds: [],
      gameOver: false,
      history: [],
      relations: [],
    };

    const factors = summarizeReputationFactors(state);
    expect(factors.totalCompleted).toBe(3);
  });

  it('sums bugsDelta and techDebtDelta from history', () => {
    const state: GameState = {
      funds: 5000,
      sprintCount: 2,
      agents: [],
      projects: [],
      completedProjectIds: [],
      unlockedAchievementIds: [],
      gameOver: false,
      history: [
        { bugsDelta: 5, techDebtDelta: 2 } as SprintResult,
        { bugsDelta: 3, techDebtDelta: 1 } as SprintResult,
      ],
      relations: [],
    };

    const factors = summarizeReputationFactors(state);
    expect(factors.totalBugs).toBe(8);
    expect(factors.totalTechDebt).toBe(3);
  });

  it('returns zeroes when history is empty', () => {
    const state: GameState = {
      funds: 5000,
      sprintCount: 0,
      agents: [],
      projects: [],
      completedProjectIds: [],
      unlockedAchievementIds: [],
      gameOver: false,
      history: [],
      relations: [],
    };

    const factors = summarizeReputationFactors(state);
    expect(factors.totalCompleted).toBe(0);
    expect(factors.totalBugs).toBe(0);
    expect(factors.totalTechDebt).toBe(0);
  });
});
