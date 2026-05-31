import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ResultReport } from '../src/components/ResultReport';
import { processQuarterSettlement } from '../src/domain/quarterSettlement';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';

const testProject: Project = {
  id: 'p1',
  name: '测试项目',
  description: '测试项目描述',
  difficulty: 10,
  urgency: 5,
  risk: 5,
  progress: 50,
  bugs: 2,
  techDebt: 3,
  maxProgress: 100,
  difficultyLevel: 'intern',
};

const testStrategy: Strategy = {
  id: 's1',
  name: '稳健策略',
  description: '无',
  modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 },
};

const mockSprintResult = (sprintNumber: number): SprintResult => ({
  sprintNumber,
  project: testProject,
  agents: [],
  strategy: testStrategy,
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
  projects: [testProject],
  completedProjectIds: ['p1'],
  unlockedAchievementIds: [],
  gameOver: false,
  history: [
    {
      ...mockSprintResult(1),
      cost: 200,
      bugsDelta: 1,
      techDebtDelta: 2,
      project: { ...testProject, progress: 100 },
    }
  ],
  relations: [],
  reputation: 50,
  confidence: 50,
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
        quarterSettlement={processQuarterSettlement(state, 35)}
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

  it('renders incident cards when incidents are present', () => {
    const result: SprintResult = {
      ...mockSprintResult(2),
      incidents: [
        {
          type: 'bug',
          severity: 'high',
          actor: 'Claude',
          title: '严重的生产事故',
          description: '数据库连接泄漏导致服务不可用',
          effects: { progress: -10, bugs: 5, techDebt: 3, morale: -8 },
        },
        {
          type: 'breakthrough',
          severity: 'low',
          actor: 'Gemini',
          title: '意外发现优化空间',
          description: '通过缓存机制提升性能',
          effects: { progress: 15, bugs: 0, techDebt: -2, morale: 5 },
          isRare: true,
        },
      ],
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('事件报告');
    expect(html).toContain('严重的生产事故');
    expect(html).toContain('数据库连接泄漏');
    expect(html).toContain('意外发现优化空间');
    expect(html).toContain('RARE!');
    expect(html).toContain('HIGH');
  });

  it('renders project completion celebration with bonus', () => {
    const result = mockSprintResult(3);
    const html = renderToStaticMarkup(
      <ResultReport
        result={result}
        projectCompleted={true}
        projectBonus={500}
      />
    );

    expect(html).toContain('项目大功告成');
    expect(html).toContain('测试项目');
    expect(html).toContain('+$500');
  });

  it('renders newly unlocked agents notification', () => {
    const result = mockSprintResult(2);
    const html = renderToStaticMarkup(
      <ResultReport
        result={result}
        newlyUnlockedAgents={[
          { name: 'AlphaFold 3', avatar: '🧬' },
          { name: 'Copilot', avatar: '🤖' },
        ]}
      />
    );

    expect(html).toContain('新员工入职');
    expect(html).toContain('AlphaFold 3');
    expect(html).toContain('Copilot');
  });

  it('renders KPI result notification for failed quarter', () => {
    const result: SprintResult = {
      ...mockSprintResult(4),
      quarterKpiResult: {
        passed: false,
        quarter: 1,
        desc: '完成至少 3 个项目',
      },
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('季度 KPI 未达标');
    expect(html).toContain('季度惩罚');
  });

  it('renders KPI result notification for passed quarter', () => {
    const result: SprintResult = {
      ...mockSprintResult(4),
      quarterKpiResult: {
        passed: true,
        quarter: 1,
        desc: '完成至少 3 个项目',
      },
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('季度 KPI 达标');
    expect(html).toContain('季度奖励');
  });

  // ─── Conditional rendering: things that should NOT appear ───

  it('does not render celebration when projectCompleted is false', () => {
    const result = mockSprintResult(1);
    const html = renderToStaticMarkup(
      <ResultReport result={result} projectCompleted={false} />
    );

    expect(html).not.toContain('项目大功告成');
    expect(html).not.toContain('project-complete-celebration');
  });

  it('does not render celebration when projectCompleted is undefined', () => {
    const result = mockSprintResult(1);
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).not.toContain('项目大功告成');
  });

  it('does not render bonus when projectBonus is 0', () => {
    const result = mockSprintResult(3);
    const html = renderToStaticMarkup(
      <ResultReport
        result={result}
        projectCompleted={true}
        projectBonus={0}
      />
    );

    expect(html).toContain('项目大功告成');
    expect(html).not.toContain('交付奖金');
  });

  it('does not render agent notification when list is empty', () => {
    const result = mockSprintResult(2);
    const html = renderToStaticMarkup(
      <ResultReport result={result} newlyUnlockedAgents={[]} />
    );

    expect(html).not.toContain('新员工入职');
  });

  it('does not render incidents section when incidents array is empty', () => {
    const result = mockSprintResult(1);
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).not.toContain('事件报告');
  });

  it('does not render quarterly review for non-quarter sprint', () => {
    const result = mockSprintResult(3);
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).not.toContain('季度复盘报告');
  });

  it('does not render KPI notification when quarterKpiResult is absent', () => {
    const result = mockSprintResult(1);
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).not.toContain('季度 KPI');
  });

  // ─── Combo incident rendering ───

  it('renders combo incident with COMBO badge', () => {
    const result: SprintResult = {
      ...mockSprintResult(2),
      incidents: [
        {
          type: 'drama',
          severity: 'medium',
          actor: 'Team',
          title: '办公室政治爆发',
          description: '两个工程师因为代码风格问题吵了起来',
          effects: { progress: -5, bugs: 2, techDebt: 1, morale: -12 },
          isCombo: true,
          comboSource: 'burnout+drama',
        },
      ],
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('COMBO!');
    expect(html).toContain('办公室政治爆发');
    expect(html).toContain('combo-incident');
  });

  // ─── Effects formatting ───

  it('renders incident effects with correct sign formatting', () => {
    const result: SprintResult = {
      ...mockSprintResult(2),
      incidents: [
        {
          type: 'bug',
          severity: 'critical',
          actor: 'Claude',
          title: '灾难性 Bug',
          description: '系统崩溃',
          effects: { progress: -15, bugs: 8, techDebt: 5, morale: -10, funds: -500 },
        },
      ],
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('CRITICAL');
    expect(html).toContain('灾难性 Bug');
    // effects are formatted as "进度 -15 | Bug +8 | 技术债 +5 | 士气 -10 | 资金 -500"
    expect(html).toContain('进度 -15');
    expect(html).toContain('Bug +8');
  });

  // ─── Sprint category / badge rendering ───

  it('renders disaster badge for terrible sprint', () => {
    const result: SprintResult = {
      ...mockSprintResult(1),
      progressDelta: 0,
      bugsDelta: 6,
      techDebtDelta: 10,
      moraleDelta: -20,
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('disaster');
    expect(html).toContain('灾难');
  });

  it('renders epic_win badge for outstanding sprint', () => {
    const result: SprintResult = {
      ...mockSprintResult(1),
      progressDelta: 30,
      bugsDelta: 0,
      techDebtDelta: 0,
      moraleDelta: 5,
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('epic_win');
    expect(html).toContain('大胜');
  });

  // ─── Stats rendering ───

  it('renders all stat cards with correct values', () => {
    const result: SprintResult = {
      ...mockSprintResult(1),
      progressDelta: 25,
      bugsDelta: 3,
      techDebtDelta: 1,
      moraleDelta: -2,
      cost: 350,
      reputationDelta: 5,
      confidenceDelta: -3,
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('+25');   // progress
    expect(html).toContain('$350');  // cost
    expect(html).toContain('+5');    // reputation
    expect(html).toContain('-3');    // confidence
    expect(html).toContain('+3');    // bugs
    expect(html).toContain('+1');    // techDebt
    expect(html).toContain('-2');    // morale
  });

  // ─── Negative reputation delta ───

  it('renders negative reputation delta correctly', () => {
    const result: SprintResult = {
      ...mockSprintResult(1),
      reputationDelta: -8,
    };
    const html = renderToStaticMarkup(
      <ResultReport result={result} />
    );

    expect(html).toContain('-8');
    expect(html).toContain('negative');
  });

  // ─── QuarterSettlement / KPI priority ───

  it('prioritises quarterSettlement over legacy quarterKpiResult when both are provided', () => {
    // Build a state at quarter end
    const state: GameState = {
      ...mockGameState(4),
      completedProjectIds: ['p1'],
      funds: 5000,
    };
    const settlement = processQuarterSettlement(state, state.reputationScore ?? 0);

    // Create a result that ALSO has quarterKpiResult set (simulating legacy processPostSprint output)
    const result: SprintResult = {
      ...mockSprintResult(4),
      quarterKpiResult: {
        quarter: 1,
        passed: false,
        desc: '完成至少 1 个项目',
      },
    };

    const html = renderToStaticMarkup(
      <ResultReport
        result={result}
        quarterSettlement={settlement}
        reputationScore={35}
      />
    );

    // Should show the proper quarter settlement review
    expect(html).toContain('季度复盘报告');
    // Should NOT show the legacy KPI notification (hidden because quarterSettlement exists)
    expect(html).not.toContain('季度 KPI 未达标');
    expect(html).not.toContain('季度 KPI 达标');
  });

  it('falls back to legacy quarterKpiResult when quarterSettlement is not provided', () => {
    const result: SprintResult = {
      ...mockSprintResult(4),
      quarterKpiResult: {
        quarter: 1,
        passed: false,
        desc: '完成至少 1 个项目',
      },
    };

    const html = renderToStaticMarkup(
      <ResultReport result={result} reputationScore={35} />
    );

    // Without quarterSettlement, should show legacy KPI notification
    expect(html).toContain('季度 KPI');
  });
});
