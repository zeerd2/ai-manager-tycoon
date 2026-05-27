import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PlayerDataDashboard } from '../src/components/PlayerDataDashboard';
import type { GameState } from '../src/domain/gameState';

const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 5000,
  sprintCount: 5,
  agents: [
    {
      id: 'agent-1', name: '小明', avatar: '👨‍💻', role: '前端开发',
      morale: 70, fatigue: 30, salary: 100,
      skills: { frontend: 80, backend: 50, devops: 40, testing: 60, communication: 70 },
      locked: false, quirk: '喜欢喝咖啡', consecutiveSprints: 0, unlockedSkills: [],
    },
    {
      id: 'agent-2', name: '小红', avatar: '👩‍💻', role: '后端开发',
      morale: 80, fatigue: 20, salary: 120,
      skills: { frontend: 40, backend: 90, devops: 60, testing: 70, communication: 50 },
      locked: true, quirk: '', consecutiveSprints: 0, unlockedSkills: [],
    },
  ],
  projects: [],
  completedProjectIds: ['proj-1'],
  unlockedAchievementIds: ['first-blood'],
  gameOver: false,
  history: [
    { sprintNumber: 1, bugsDelta: 3, progressDelta: 20, cost: 500, moraleDelta: -5, summary: 'ok', incidents: [], project: {} as any, agents: [], strategy: {} as any },
    { sprintNumber: 2, bugsDelta: 1, progressDelta: 30, cost: 400, moraleDelta: 2, summary: 'ok', incidents: [], project: {} as any, agents: [], strategy: {} as any },
  ],
  relations: [],
  reputation: 50,
  confidence: 50,
  quarterlyEvaluations: [
    { quarterNumber: 1, target: {}, achieved: true, actualValue: 10 },
    { quarterNumber: 2, target: {}, achieved: false, actualValue: 5 },
  ],
  ...overrides,
});

describe('PlayerDataDashboard', () => {
  it('renders dashboard title', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('玩家数据仪表盘');
  });

  it('renders sprint count', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('总 Sprint 数');
  });

  it('renders completed projects count', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('已完成项目');
  });

  it('renders total bugs from history', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('累计 Bug 数');
  });

  it('renders total cost from history', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('累计花费');
  });

  it('renders current funds', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('当前资金');
    expect(html).toContain('$5000');
  });

  it('renders team overview section', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('团队概况');
    expect(html).toContain('已解锁员工');
  });

  it('renders average morale', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('平均士气');
  });

  it('renders average fatigue', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('平均疲劳');
  });

  it('renders average salary', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('平均薪资');
  });

  it('renders achievement progress section', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('成就进度');
    expect(html).toContain('dash-achievement-bar');
  });

  it('renders quarterly evaluation section', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('季度评估');
    expect(html).toContain('已评估季度');
    expect(html).toContain('达标季度');
  });

  it('renders efficiency metrics section', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('效率指标');
    expect(html).toContain('平均 Bug/Sprint');
    expect(html).toContain('平均花费/Sprint');
    expect(html).toContain('公司声望');
    expect(html).toContain('团队信心');
  });

  it('handles empty agents list', () => {
    const html = renderToStaticMarkup(
      <PlayerDataDashboard gameState={makeGameState({ agents: [] })} />
    );
    expect(html).toContain('0 / 0');
  });

  it('handles empty history', () => {
    const html = renderToStaticMarkup(
      <PlayerDataDashboard gameState={makeGameState({ history: [] })} />
    );
    expect(html).toContain('玩家数据仪表盘');
  });

  it('renders stats grid', () => {
    const html = renderToStaticMarkup(<PlayerDataDashboard gameState={makeGameState()} />);
    expect(html).toContain('dashboard-stats-grid');
    expect(html).toContain('dash-stat-card');
  });

  it('renders with zero quarterly evaluations', () => {
    const html = renderToStaticMarkup(
      <PlayerDataDashboard gameState={makeGameState({ quarterlyEvaluations: [] })} />
    );
    expect(html).toContain('季度评估');
  });
});
