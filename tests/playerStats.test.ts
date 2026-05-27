import { describe, it, expect } from 'vitest';
import { getPlayerStats } from '../src/domain/playerStats';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';
import type { Agent } from '../src/domain/agent';

const makeSprintResult = (overrides: Partial<SprintResult> = {}): SprintResult => ({
  sprintNumber: 1,
  project: { id: 'proj-1', name: 'Test', difficulty: 50 } as Project,
  agents: [],
  strategy: { name: 'balanced' } as Strategy,
  progressDelta: 20,
  bugsDelta: 3,
  techDebtDelta: 2,
  moraleDelta: -5,
  cost: 200,
  incidents: [],
  summary: '',
  ...overrides,
});

const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
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
});

describe('getPlayerStats', () => {
  it('返回空历史时的默认统计', () => {
    const state = makeGameState();
    const stats = getPlayerStats(state);
    expect(stats.totalSprints).toBe(0);
    expect(stats.totalCompletedProjects).toBe(0);
    expect(stats.currentFunds).toBe(5000);
    expect(stats.totalBugs).toBe(0);
    expect(stats.totalAchievementsUnlocked).toBe(0);
  });

  it('正确聚合 Sprint 历史数据', () => {
    const state = makeGameState({
      sprintCount: 3,
      history: [
        makeSprintResult({ sprintNumber: 1, progressDelta: 20, bugsDelta: 3, cost: 200 }),
        makeSprintResult({ sprintNumber: 2, progressDelta: 30, bugsDelta: 5, cost: 300 }),
        makeSprintResult({ sprintNumber: 3, progressDelta: 10, bugsDelta: 0, cost: 150 }),
      ],
    });
    const stats = getPlayerStats(state);
    expect(stats.totalSprints).toBe(3);
    expect(stats.totalProgress).toBe(60);
    expect(stats.totalBugs).toBe(8);
    expect(stats.totalCost).toBe(650);
    expect(stats.avgProgressPerSprint).toBe(20);
    expect(stats.avgBugsPerSprint).toBeCloseTo(2.67, 1);
    expect(stats.bestSprintProgress).toBe(30);
    expect(stats.worstSprintBugs).toBe(5);
    expect(stats.highestCostSprint).toBe(300);
  });

  it('正确计算员工统计', () => {
    const agents: Agent[] = [
      { id: 'a1', morale: 80, fatigue: 30, locked: false, skills: { coding: 90, debugging: 70, architecture: 60, creativity: 50, speed: 80 } } as Agent,
      { id: 'a2', morale: 60, fatigue: 50, locked: false, skills: { coding: 40, debugging: 50, architecture: 60, creativity: 70, speed: 30 } } as Agent,
      { id: 'a3', morale: 0, fatigue: 0, locked: true, skills: { coding: 10, debugging: 10, architecture: 10, creativity: 10, speed: 10 } } as Agent,
    ];
    const state = makeGameState({ agents });
    const stats = getPlayerStats(state);
    expect(stats.totalAgents).toBe(3);
    expect(stats.unlockedAgents).toBe(2);
    expect(stats.avgAgentMorale).toBe(70);
    expect(stats.avgAgentFatigue).toBe(40);
    expect(stats.highestAgentSkill).toBe(90);
  });

  it('正确统计事件分类', () => {
    const state = makeGameState({
      history: [
        makeSprintResult({
          incidents: [
            { type: 'bug', severity: 'low', actor: 'A', title: '', description: '', effects: { progress: 0, bugs: 1, techDebt: 0, morale: 0 } },
            { type: 'bug', severity: 'medium', actor: 'B', title: '', description: '', effects: { progress: 0, bugs: 2, techDebt: 0, morale: 0 } },
          ],
        }),
        makeSprintResult({
          incidents: [
            { type: 'breakthrough', severity: 'high', actor: 'A', title: '', description: '', effects: { progress: 10, bugs: 0, techDebt: 0, morale: 5 } },
          ],
        }),
      ],
    });
    const stats = getPlayerStats(state);
    expect(stats.totalIncidents).toBe(3);
    expect(stats.incidentBreakdown['bug']).toBe(2);
    expect(stats.incidentBreakdown['breakthrough']).toBe(1);
    expect(stats.mostIncidentsInSprint).toBe(2);
  });

  it('正确计算资金统计', () => {
    const state = makeGameState({
      funds: 6000,
      history: [
        makeSprintResult({ cost: 500 }),
        makeSprintResult({ cost: 300 }),
      ],
    });
    const stats = getPlayerStats(state);
    expect(stats.currentFunds).toBe(6000);
    expect(stats.totalFundsSpent).toBe(800);
    expect(stats.totalFundsEarned).toBe(1800); // 800 + 6000 - 5000
  });
});
