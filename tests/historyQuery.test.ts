import { describe, it, expect } from 'vitest';
import { queryHistory, getProjectHistory, getRecentSprints, getIncidentSummary } from '../src/domain/historyQuery';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';

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

describe('queryHistory', () => {
  const history: SprintResult[] = [
    makeSprintResult({ sprintNumber: 1, project: { id: 'p1' } as Project, bugsDelta: 5, cost: 100, incidents: [] }),
    makeSprintResult({ sprintNumber: 2, project: { id: 'p1' } as Project, bugsDelta: 0, cost: 200, incidents: [{ type: 'bug', severity: 'low', actor: 'A', title: '', description: '', effects: { progress: 0, bugs: 1, techDebt: 0, morale: 0 } }] }),
    makeSprintResult({ sprintNumber: 3, project: { id: 'p2' } as Project, bugsDelta: 10, cost: 300, incidents: [] }),
    makeSprintResult({ sprintNumber: 4, project: { id: 'p2' } as Project, bugsDelta: 2, cost: 150, incidents: [{ type: 'breakthrough', severity: 'high', actor: 'B', title: '', description: '', effects: { progress: 10, bugs: 0, techDebt: 0, morale: 5 } }] }),
  ];
  const state = makeGameState({ history });

  it('无查询条件返回全部', () => {
    const result = queryHistory(state);
    expect(result.total).toBe(4);
    expect(result.items).toHaveLength(4);
    expect(result.hasMore).toBe(false);
  });

  it('按项目 ID 过滤', () => {
    const result = queryHistory(state, { projectId: 'p1' });
    expect(result.total).toBe(2);
    expect(result.items.every(h => h.project.id === 'p1')).toBe(true);
  });

  it('按 Sprint 范围过滤', () => {
    const result = queryHistory(state, { sprintFrom: 2, sprintTo: 3 });
    expect(result.total).toBe(2);
    expect(result.items.map(h => h.sprintNumber)).toEqual([2, 3]);
  });

  it('过滤有 bug 的 sprint', () => {
    const result = queryHistory(state, { hasBugs: true });
    expect(result.total).toBe(3); // sprint 1, 3, 4
  });

  it('按最小 bug 数量过滤', () => {
    const result = queryHistory(state, { minBugs: 5 });
    expect(result.total).toBe(2); // sprint 1 (5), sprint 3 (10)
  });

  it('过滤有事件的 sprint', () => {
    const result = queryHistory(state, { hasIncidents: true });
    expect(result.total).toBe(2); // sprint 2, 4
  });

  it('按事件类型过滤', () => {
    const result = queryHistory(state, { incidentType: 'breakthrough' });
    expect(result.total).toBe(1);
    expect(result.items[0].sprintNumber).toBe(4);
  });

  it('按最大成本过滤', () => {
    const result = queryHistory(state, { maxCost: 150 });
    expect(result.total).toBe(2); // sprint 1 (100), sprint 4 (150)
  });

  it('降序排列', () => {
    const result = queryHistory(state, { order: 'desc' });
    expect(result.items.map(h => h.sprintNumber)).toEqual([4, 3, 2, 1]);
  });

  it('分页功能', () => {
    const result = queryHistory(state, { offset: 1, limit: 2 });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.hasMore).toBe(true);
  });

  it('组合查询条件', () => {
    const result = queryHistory(state, { projectId: 'p2', hasBugs: true });
    expect(result.total).toBe(2);
    expect(result.items.every(h => h.project.id === 'p2' && h.bugsDelta > 0)).toBe(true);
  });
});

describe('getProjectHistory', () => {
  it('返回指定项目的历史', () => {
    const state = makeGameState({
      history: [
        makeSprintResult({ sprintNumber: 1, project: { id: 'p1' } as Project }),
        makeSprintResult({ sprintNumber: 2, project: { id: 'p2' } as Project }),
        makeSprintResult({ sprintNumber: 3, project: { id: 'p1' } as Project }),
      ],
    });
    const result = getProjectHistory(state, 'p1');
    expect(result).toHaveLength(2);
    expect(result.every(h => h.project.id === 'p1')).toBe(true);
  });
});

describe('getRecentSprints', () => {
  it('返回最近 N 轮', () => {
    const state = makeGameState({
      history: [
        makeSprintResult({ sprintNumber: 1 }),
        makeSprintResult({ sprintNumber: 2 }),
        makeSprintResult({ sprintNumber: 3 }),
      ],
    });
    const result = getRecentSprints(state, 2);
    expect(result).toHaveLength(2);
    expect(result[0].sprintNumber).toBe(2);
    expect(result[1].sprintNumber).toBe(3);
  });
});

describe('getIncidentSummary', () => {
  it('统计事件类型出现次数', () => {
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
    const summary = getIncidentSummary(state);
    expect(summary['bug']).toBe(2);
    expect(summary['breakthrough']).toBe(1);
  });

  it('空历史返回空对象', () => {
    const state = makeGameState();
    expect(getIncidentSummary(state)).toEqual({});
  });
});
