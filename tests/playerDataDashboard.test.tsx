import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerDataDashboard } from '../src/components/PlayerDataDashboard';
import type { GameState } from '../src/domain/gameState';
import type { Agent } from '../src/domain/agent';
import type { SprintResult } from '../src/domain/simulation';

const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 5000,
  sprintCount: 5,
  agents: [],
  projects: [],
  completedProjectIds: [],
  unlockedAchievementIds: [],
  gameOver: false,
  history: [],
  relations: [],
  reputation: 60,
  confidence: 55,
  ...overrides,
});

const makeAgent = (overrides: Partial<Agent> = {}): Agent => ({
  id: '1',
  name: 'Test Agent',
  model: 'gpt-4',
  role: 'Developer',
  avatar: '🤖',
  skills: { coding: 80, debugging: 70, architecture: 60, creativity: 50, speed: 40 },
  salary: 100,
  morale: 75,
  quirk: 'likes coffee',
  fatigue: 30,
  consecutiveSprints: 2,
  totalSprintsWorked: 5,
  locked: false,
  ...overrides,
});

const makeHistory = (overrides: Partial<SprintResult> = {}): SprintResult => ({
  sprintNumber: 1,
  project: {} as SprintResult['project'],
  agents: [],
  strategy: {} as SprintResult['strategy'],
  progressDelta: 20,
  bugsDelta: 5,
  techDebtDelta: 3,
  moraleDelta: -2,
  cost: 200,
  incidents: [],
  summary: 'test sprint',
  ...overrides,
});

describe('PlayerDataDashboard', () => {
  it('renders the dashboard title', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('玩家数据仪表盘');
  });

  it('displays sprint count', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ sprintCount: 10 })} />);
    expect(html).toContain('10');
    expect(html).toContain('总 Sprint 数');
  });

  it('displays completed projects count', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ completedProjectIds: ['p1', 'p2', 'p3'] })} />);
    expect(html).toContain('>3<');
    expect(html).toContain('已完成项目');
  });

  it('displays current funds', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ funds: 7500 })} />);
    expect(html).toContain('$7500');
    expect(html).toContain('当前资金');
  });

  it('displays total bugs from history', () => {
    const history = [
      makeHistory({ bugsDelta: 10 }),
      makeHistory({ bugsDelta: 15 }),
    ];
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ history })} />);
    expect(html).toContain('>25<');
    expect(html).toContain('累计 Bug 数');
  });

  it('displays total cost from history', () => {
    const history = [
      makeHistory({ cost: 200 }),
      makeHistory({ cost: 300 }),
    ];
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ history })} />);
    expect(html).toContain('$500');
    expect(html).toContain('累计花费');
  });

  it('displays total progress from history', () => {
    const history = [
      makeHistory({ progressDelta: 20 }),
      makeHistory({ progressDelta: 30 }),
    ];
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ history })} />);
    expect(html).toContain('>50<');
    expect(html).toContain('累计进度');
  });

  it('displays team stats with agents', () => {
    const agents = [
      makeAgent({ morale: 80, fatigue: 20, salary: 100 }),
      makeAgent({ id: '2', morale: 60, fatigue: 40, salary: 150 }),
    ];
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ agents })} />);
    expect(html).toContain('2 / 2');
    expect(html).toContain('70%'); // avg morale
    expect(html).toContain('$125'); // avg salary
  });

  it('displays achievement progress', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ unlockedAchievementIds: ['a1', 'a2'] })} />);
    expect(html).toContain('2 / 16');
  });

  it('displays quarterly evaluation stats', () => {
    const quarterlyEvaluations = [
      { quarterNumber: 1, achieved: true },
      { quarterNumber: 2, achieved: false },
    ];
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ quarterlyEvaluations })} />);
    expect(html).toContain('季度评估');
    expect(html).toContain('已评估季度');
    expect(html).toContain('达标季度');
  });

  it('displays reputation and confidence', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ reputation: 75, confidence: 80 })} />);
    expect(html).toContain('公司声望');
    expect(html).toContain('团队信心');
  });

  it('handles zero agents gracefully', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState({ agents: [] })} />);
    expect(html).toContain('0 / 0');
    expect(html).toContain('团队概况');
  });

  it('renders all stat cards', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('总 Sprint 数');
    expect(html).toContain('已完成项目');
    expect(html).toContain('累计 Bug 数');
    expect(html).toContain('累计花费');
    expect(html).toContain('累计进度');
    expect(html).toContain('当前资金');
  });

  it('renders all dashboard sections', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('团队概况');
    expect(html).toContain('成就进度');
    expect(html).toContain('季度评估');
    expect(html).toContain('效率指标');
  });
});
