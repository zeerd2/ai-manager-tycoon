import { describe, expect, it } from 'vitest';
import { calculatePlayerStats } from '../src/domain/playerStats';
import type { GameState } from '../src/domain/gameState';
import type { Agent } from '../src/domain/agent';
import type { SprintResult } from '../src/domain/simulation';

function makeAgent(id: string, overrides: Partial<Agent> = {}): Agent {
  return {
    id,
    name: `Agent ${id}`,
    model: 'gpt-4',
    role: 'dev',
    avatar: '',
    skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
    salary: 100,
    morale: 50,
    quirk: '',
    fatigue: 0,
    consecutiveSprints: 0,
    totalSprintsWorked: 0,
    locked: false,
    ...overrides,
  };
}

function makeSprintResult(
  sprintNumber: number,
  overrides: Partial<SprintResult> = {}
): SprintResult {
  return {
    sprintNumber,
    project: { id: 'p1', name: 'Test', description: '', difficulty: 10, urgency: 5, risk: 5, progress: 50, bugs: 0, techDebt: 0, maxProgress: 100, difficultyLevel: 'intern' },
    agents: [],
    strategy: { id: 's1', name: 'Default', description: '', modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 } },
    progressDelta: 20,
    bugsDelta: 1,
    techDebtDelta: 2,
    moraleDelta: 5,
    cost: 200,
    incidents: [],
    summary: 'ok',
    ...overrides,
  };
}

function makeGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    funds: 5000,
    sprintCount: 0,
    agents: [],
    projects: [],
    completedProjectIds: [],
    unlockedAchievementIds: [],
    gameOver: false,
    history: [],
    relations: [],
    reputation: 50,
    confidence: 50,
    ...overrides,
  };
}

describe('calculatePlayerStats', () => {
  it('returns all zeros for empty history', () => {
    const stats = calculatePlayerStats(makeGameState(), 10);

    expect(stats.totalSprints).toBe(0);
    expect(stats.totalProgress).toBe(0);
    expect(stats.totalBugs).toBe(0);
    expect(stats.totalTechDebt).toBe(0);
    expect(stats.totalFundsSpent).toBe(0);
    expect(stats.avgProgressPerSprint).toBe(0);
    expect(stats.avgCostPerSprint).toBe(0);
    expect(stats.avgMoraleDelta).toBe(0);
    expect(stats.bestSprintProgress).toBe(0);
    expect(stats.worstSprintProgress).toBe(0);
    expect(stats.disasterSprintCount).toBe(0);
    expect(stats.progressPerFund).toBe(0);
    expect(stats.bugsPerProject).toBe(0);
    expect(stats.achievementRate).toBe(0);
  });

  it('calculates correct stats for single sprint', () => {
    const state = makeGameState({
      history: [makeSprintResult(1, { progressDelta: 30, bugsDelta: 2, techDebtDelta: 3, moraleDelta: 5, cost: 250 })],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.totalSprints).toBe(1);
    expect(stats.totalProgress).toBe(30);
    expect(stats.totalBugs).toBe(2);
    expect(stats.totalTechDebt).toBe(3);
    expect(stats.totalFundsSpent).toBe(250);
    expect(stats.avgProgressPerSprint).toBe(30);
    expect(stats.avgCostPerSprint).toBe(250);
    expect(stats.avgMoraleDelta).toBe(5);
    expect(stats.bestSprintProgress).toBe(30);
    expect(stats.worstSprintProgress).toBe(30);
    expect(stats.disasterSprintCount).toBe(0);
  });

  it('accumulates stats across multiple sprints', () => {
    const state = makeGameState({
      history: [
        makeSprintResult(1, { progressDelta: 20, bugsDelta: 1, cost: 200 }),
        makeSprintResult(2, { progressDelta: 30, bugsDelta: 3, cost: 300 }),
        makeSprintResult(3, { progressDelta: 15, bugsDelta: 0, cost: 150 }),
      ],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.totalSprints).toBe(3);
    expect(stats.totalProgress).toBe(65);
    expect(stats.totalBugs).toBe(4);
    expect(stats.totalFundsSpent).toBe(650);
    expect(stats.avgProgressPerSprint).toBeCloseTo(21.67, 1);
    expect(stats.avgCostPerSprint).toBeCloseTo(216.67, 1);
  });

  it('counts disaster sprints correctly', () => {
    const state = makeGameState({
      history: [
        makeSprintResult(1, { progressDelta: 20 }),
        makeSprintResult(2, { progressDelta: 0 }),
        makeSprintResult(3, { progressDelta: 0 }),
        makeSprintResult(4, { progressDelta: 15 }),
      ],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.disasterSprintCount).toBe(2);
    expect(stats.bestSprintProgress).toBe(20);
    expect(stats.worstSprintProgress).toBe(0);
  });

  it('finds best and worst sprint progress', () => {
    const state = makeGameState({
      history: [
        makeSprintResult(1, { progressDelta: 10 }),
        makeSprintResult(2, { progressDelta: 35 }),
        makeSprintResult(3, { progressDelta: 5 }),
      ],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.bestSprintProgress).toBe(35);
    expect(stats.worstSprintProgress).toBe(5);
  });

  it('calculates team stats from agents', () => {
    const state = makeGameState({
      agents: [
        makeAgent('a1', { totalSprintsWorked: 5, skills: { coding: 60, debugging: 50, architecture: 40, creativity: 55, speed: 45 } }),
        makeAgent('a2', { totalSprintsWorked: 3, skills: { coding: 70, debugging: 60, architecture: 50, creativity: 40, speed: 50 } }),
      ],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.currentTeamSize).toBe(2);
    expect(stats.totalPersonSprints).toBe(8);
    // avg of [60,50,40,55,45,70,60,50,40,50] = 520/10 = 52
    expect(stats.avgTeamSkill).toBe(52);
  });

  it('calculates efficiency metrics', () => {
    const state = makeGameState({
      history: [
        makeSprintResult(1, { progressDelta: 20, bugsDelta: 2, cost: 100 }),
        makeSprintResult(2, { progressDelta: 30, bugsDelta: 4, cost: 200 }),
      ],
      completedProjectIds: ['p1', 'p2'],
    });
    const stats = calculatePlayerStats(state, 10);

    // progressPerFund = 50 / 300 = 0.167
    expect(stats.progressPerFund).toBeCloseTo(0.167, 2);
    // bugsPerProject = 6 / 2 = 3
    expect(stats.bugsPerProject).toBe(3);
    expect(stats.totalProjectsCompleted).toBe(2);
  });

  it('calculates achievement stats', () => {
    const state = makeGameState({
      unlockedAchievementIds: ['a1', 'a2', 'a3'],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.achievementCount).toBe(3);
    expect(stats.achievementRate).toBe(0.3);
  });

  it('handles zero totalAchievements gracefully', () => {
    const state = makeGameState({
      unlockedAchievementIds: ['a1'],
    });
    const stats = calculatePlayerStats(state, 0);

    expect(stats.achievementCount).toBe(1);
    expect(stats.achievementRate).toBe(0);
  });

  it('handles zero funds spent gracefully', () => {
    const state = makeGameState({
      history: [makeSprintResult(1, { cost: 0, progressDelta: 10 })],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.progressPerFund).toBe(0);
    expect(stats.totalFundsSpent).toBe(0);
  });

  it('handles zero completed projects gracefully', () => {
    const state = makeGameState({
      history: [makeSprintResult(1, { bugsDelta: 5 })],
      completedProjectIds: [],
    });
    const stats = calculatePlayerStats(state, 10);

    expect(stats.bugsPerProject).toBe(0);
    expect(stats.totalProjectsCompleted).toBe(0);
  });
});
