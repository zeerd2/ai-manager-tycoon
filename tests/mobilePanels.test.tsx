import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MobileSectionNav } from '../src/components/MobileSectionNav';
import { MobileBottomSheet } from '../src/components/MobileBottomSheet';
import { MobileDecisionSummary } from '../src/components/MobileDecisionSummary';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';

const agent: Agent = {
  id: 'agent-1',
  name: 'Claude',
  model: 'claude',
  role: '全栈工程师',
  avatar: '🤖',
  skills: { coding: 8, debugging: 7, architecture: 8, creativity: 6, speed: 7 },
  salary: 120,
  morale: 90,
  quirk: '稳定输出',
  fatigue: 10,
  consecutiveSprints: 0,
  totalSprintsWorked: 0,
  locked: false,
};

const project: Project = {
  id: 'project-1',
  name: '移动端重构',
  description: '改造移动端交互',
  difficulty: 5,
  urgency: 6,
  risk: 4,
  progress: 20,
  bugs: 1,
  techDebt: 2,
  maxProgress: 100,
  difficultyLevel: 'normal',
};

const strategy: Strategy = {
  id: 'strategy-1',
  name: '稳健推进',
  description: '降低风险',
  modifiers: {
    progressMul: 1,
    bugMul: 0.8,
    techDebtMul: 0.9,
    moraleDelta: 2,
    incidentChanceMul: 0.8,
  },
};

describe('移动端弹出式二级功能', () => {
  it('底部导航暴露五个固定入口并使用成就/历史命名', () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav
        sections={[
          { id: 'team', label: '团队' },
          { id: 'project', label: '项目' },
          { id: 'strategy', label: '策略' },
          { id: 'achievement', label: '成就' },
          { id: 'history', label: '历史' },
        ]}
        activeSection="project"
        onSelect={() => undefined}
      />
    );

    expect(html).toContain('aria-label="移动端底部功能导航"');
    expect(html).toContain('mobile-bottom-nav');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('团队');
    expect(html).toContain('项目');
    expect(html).toContain('策略');
    expect(html).toContain('成就');
    expect(html).toContain('历史');
  });

  it('二级内容通过可关闭弹出面板呈现', () => {
    const html = renderToStaticMarkup(
      <MobileBottomSheet title="项目选择" isOpen onClose={() => undefined}>
        <button type="button">选择移动端重构</button>
      </MobileBottomSheet>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('mobile-sheet-panel');
    expect(html).toContain('项目选择');
    expect(html).toContain('关闭');
  });

  it('主屏摘要只呈现核心决策信息', () => {
    const html = renderToStaticMarkup(
      <MobileDecisionSummary
        selectedProject={project}
        selectedStrategy={strategy}
        selectedAgents={[agent]}
      />
    );

    expect(html).toContain('当前项目');
    expect(html).toContain('移动端重构');
    expect(html).toContain('当前策略');
    expect(html).toContain('稳健推进');
    expect(html).toContain('已选员工');
    expect(html).toContain('🤖');
    expect(html).toContain('1 人');
  });
});
