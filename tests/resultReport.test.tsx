import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResultReport } from '../src/components/ResultReport';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';

const mockSprintResult = (sprintNumber: number): SprintResult => ({
  sprintNumber,
  project: { id: 'p1', name: '测试项目', maxProgress: 100, progress: 50, bugs: 2, techDebt: 3 } as any,
  agents: [],
  strategy: { id: 's1', name: '稳健策略', description: '无' } as any,
  progressDelta: 20,
  bugsDelta: 1,
  techDebtDelta: 2,
  moraleDelta: 5,
  cost: 200,
  incidents: [],
  summary: 'Sprint finished ok',
});

const mockGameState = (sprintNumber: number): GameState => ({
  funds: 6000,
  sprintCount: sprintNumber,
  agents: [],
  projects: [{ id: 'p1', name: '测试项目', maxProgress: 100, progress: 50, bugs: 2, techDebt: 3 } as any],
  completedProjectIds: ['p1'],
  unlockedAchievementIds: [],
  gameOver: false,
  history: [
    {
      sprintNumber: 1,
      cost: 200,
      bugsDelta: 1,
      techDebtDelta: 2,
      project: { id: 'p1', name: '测试项目', maxProgress: 100, progress: 100 }
    } as any
  ],
  relations: [],
  reputationScore: 35,
  quarterlyEvaluations: [],
  triggeredCheckpoints: [],
});

describe('ResultReport Component', () => {
  it('renders normal sprint report correctly', () => {
    const result = mockSprintResult(1);
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('Sprint #1');
    expect(html).toContain('稳健策略');
    expect(html).not.toContain('季度复盘报告');
  });

  it('renders quarterly review section at quarter end', () => {
    const result = mockSprintResult(4);
    const state = mockGameState(4);
    const html = renderToStaticMarkup(
      <ResultReport
        result={result}
        gameState={state}
        reputationScore={35}
      />
    );

    expect(html).toContain('Sprint #4');
    expect(html).toContain('第 1 季度复盘报告');
    expect(html).toContain('季度目标');
    expect(html).toContain('声望等级');
    expect(html).toContain('投资人信心');
    expect(html).toContain('季度融资评估');
    expect(html).toContain('种子轮融资');
  });
});
