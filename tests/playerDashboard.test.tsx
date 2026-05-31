import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerDashboard } from '../src/components/PlayerDashboard';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';

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

function makeSprintResult(sprintNumber: number, overrides: Partial<SprintResult> = {}): SprintResult {
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

describe('PlayerDashboard Component', () => {
  it('renders overview stats', () => {
    const state = makeGameState({
      history: [makeSprintResult(1, { progressDelta: 30, cost: 250 })],
      completedProjectIds: ['p1'],
      unlockedAchievementIds: ['a1', 'a2'],
    });
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('个人统计');
    expect(html).toContain('总回合');
    expect(html).toContain('完成项目');
    expect(html).toContain('总进度');
    expect(html).toContain('成就解锁');
  });

  it('renders achievement rate correctly', () => {
    const state = makeGameState({
      unlockedAchievementIds: ['a1', 'a2', 'a3'],
    });
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('3');
    expect(html).toContain('%');
  });

  it('renders without crashing for empty history', () => {
    const state = makeGameState();
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('个人统计');
    expect(html).toContain('总回合');
  });

  it('does not have expanded class when collapsed', () => {
    const state = makeGameState({
      history: [makeSprintResult(1)],
    });
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('player-dashboard-content');
    expect(html).not.toContain('player-dashboard-content expanded');
  });

  it('renders toggle button with correct aria attribute', () => {
    const state = makeGameState();
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('aria-expanded');
    expect(html).toContain('player-dashboard-toggle');
  });

  it('renders player-dashboard class', () => {
    const state = makeGameState();
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('player-dashboard');
  });

  /* =====================================================
   * WS-103 P1: Scenario 3 — PlayerDashboard 显示 playerStats 数据
   * (验证包含新 v9 成就时统计正确渲染)
   * ===================================================== */
  it('renders correct achievement count and rate with v9 achievements', () => {
    const state = makeGameState({
      unlockedAchievementIds: ['first-blood', 'long-run-survivor', 'efficient-project'],
    });
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    // Should show 3 unlocked achievements
    expect(html).toContain('3');
    expect(html).toContain('成就解锁');
    // Achievement rate should be visible (percentage)
    expect(html).toContain('%');
  });

  it('renders player stats including v9 long-run achievement context', () => {
    const state = makeGameState({
      sprintCount: 25,
      unlockedAchievementIds: ['long-run-survivor'],
      history: Array.from({ length: 25 }, (_, i) => makeSprintResult(i + 1)),
    });
    const html = renderToStaticMarkup(<PlayerDashboard gameState={state} />);

    expect(html).toContain('25'); // total sprints
    expect(html).toContain('成就解锁');
  });
});
