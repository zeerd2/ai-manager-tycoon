import { describe, it, expect } from 'vitest';
import { buildAchievementContext, checkAllAchievements } from '../src/domain/achievementUnlock';
import type { GameState } from '../src/domain/gameState';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';
import type { SprintResult } from '../src/domain/simulation';

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

const makeSprintResult = (overrides: Partial<SprintResult> = {}): SprintResult => ({
  sprintNumber: 1,
  project: { id: 'proj-1' } as Project,
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

describe('buildAchievementContext', () => {
  it('从 GameState 构建正确的上下文', () => {
    const state = makeGameState({
      funds: 6000,
      sprintCount: 5,
      completedProjectIds: ['p1', 'p2'],
      agents: [
        { id: 'a1', morale: 80, locked: false, salary: 100, consecutiveSprints: 3, skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 } } as Agent,
      ],
      history: [makeSprintResult({ cost: 200 }), makeSprintResult({ cost: 300 })],
    });
    const ctx = buildAchievementContext(state, 10);
    expect(ctx.fundsRemaining).toBe(6000);
    expect(ctx.totalFundsSpent).toBe(500);
    expect(ctx.completedProjectIds).toEqual(['p1', 'p2']);
    expect(ctx.sprintCount).toBe(5);
    expect(ctx.currentSprintBugs).toBe(10);
    expect(ctx.agents).toHaveLength(1);
    expect(ctx.agents[0].morale).toBe(80);
  });

  it('currentSprintBugs 可选', () => {
    const state = makeGameState();
    const ctx = buildAchievementContext(state);
    expect(ctx.currentSprintBugs).toBeUndefined();
  });
});

describe('checkAllAchievements', () => {
  it('首次完成项目时解锁 first-blood', () => {
    const state = makeGameState({
      completedProjectIds: ['p1'],
      agents: [{ id: 'a1', morale: 80, locked: false, salary: 100, consecutiveSprints: 0, skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 } } as Agent],
      history: [makeSprintResult({ cost: 200 })],
    });
    const result = checkAllAchievements(state);
    expect(result.newlyUnlocked.some(a => a.id === 'first-blood')).toBe(true);
    expect(result.unlockedIds).toContain('first-blood');
  });

  it('已解锁的成就不会重复解锁', () => {
    const state = makeGameState({
      completedProjectIds: ['p1'],
      unlockedAchievementIds: ['first-blood'],
    });
    const result = checkAllAchievements(state);
    expect(result.newlyUnlocked.some(a => a.id === 'first-blood')).toBe(false);
  });

  it('单轮 15+ bugs 解锁 bug-factory', () => {
    const state = makeGameState();
    const result = checkAllAchievements(state, 15);
    expect(result.newlyUnlocked.some(a => a.id === 'bug-factory')).toBe(true);
  });

  it('资金达到 8000 解锁 financial-freedom', () => {
    const state = makeGameState({ funds: 8000 });
    const result = checkAllAchievements(state);
    expect(result.newlyUnlocked.some(a => a.id === 'financial-freedom')).toBe(true);
  });

  it('完成 3 个项目解锁 10x-company', () => {
    const state = makeGameState({
      completedProjectIds: ['p1', 'p2', 'p3'],
      agents: [{ id: 'a1', morale: 80, locked: false, salary: 100, consecutiveSprints: 0, skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 } } as Agent],
      history: [makeSprintResult({ cost: 100 }), makeSprintResult({ cost: 100 }), makeSprintResult({ cost: 100 })],
    });
    const result = checkAllAchievements(state);
    expect(result.newlyUnlocked.some(a => a.id === '10x-company')).toBe(true);
  });

  it('6 名员工解锁 big-team', () => {
    const agents: Agent[] = Array.from({ length: 6 }, (_, i) => ({
      id: `a${i}`, morale: 80, locked: false, salary: 100, consecutiveSprints: 0,
      skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
    })) as Agent[];
    const state = makeGameState({ agents });
    const result = checkAllAchievements(state);
    expect(result.newlyUnlocked.some(a => a.id === 'big-team')).toBe(true);
  });

  it('同时满足多个条件时解锁所有对应成就', () => {
    const state = makeGameState({
      funds: 8000,
      completedProjectIds: ['p1'],
      agents: [{ id: 'a1', morale: 80, locked: false, salary: 100, consecutiveSprints: 0, skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 } } as Agent],
      history: [makeSprintResult({ cost: 200 })],
    });
    const result = checkAllAchievements(state, 20);
    const ids = result.newlyUnlocked.map(a => a.id);
    expect(ids).toContain('first-blood');
    expect(ids).toContain('bug-factory');
    expect(ids).toContain('financial-freedom');
  });

  it('没有任何条件满足时不解锁', () => {
    const state = makeGameState();
    const result = checkAllAchievements(state);
    expect(result.newlyUnlocked).toHaveLength(0);
  });
});
