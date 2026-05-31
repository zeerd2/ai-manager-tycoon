import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { getTutorialStepText } from '../src/components/tutorialGuideLogic';
import { TutorialGuide } from '../src/components/TutorialGuide';

describe('getTutorialStepText Logic', () => {
  it('should return null if sprintCount is 3 or more', () => {
    const result = getTutorialStepText(3, 0, null, null);
    expect(result).toBeNull();
  });

  it('should return null if sprintCount is 4', () => {
    const result = getTutorialStepText(4, 1, 'todo-app', 'agile');
    expect(result).toBeNull();
  });

  it('should request agent selection if selectedAgentCount is 0 at sprint 0', () => {
    const result = getTutorialStepText(0, 0, null, null);
    expect(result).toContain('第一步');
    expect(result).toContain('团队');
  });

  it('should request project selection if agent is selected but project is not at sprint 0', () => {
    const result = getTutorialStepText(0, 1, null, null);
    expect(result).toContain('第二步');
    expect(result).toContain('项目');
  });

  it('should request strategy selection if agent and project are selected but strategy is not at sprint 0', () => {
    const result = getTutorialStepText(0, 1, 'todo-app', null);
    expect(result).toContain('第三步');
    expect(result).toContain('策略');
  });

  it('should notify ready if all selected at sprint 0', () => {
    const result = getTutorialStepText(0, 1, 'todo-app', 'agile');
    expect(result).toContain('准备就绪');
    expect(result).toContain('执行 Sprint');
  });

  it('should guide through sprint 1 step-by-step', () => {
    const step1 = getTutorialStepText(1, 0, null, null);
    expect(step1).toContain('第一步');
    expect(step1).toContain('工程师');

    const step2 = getTutorialStepText(1, 1, null, null);
    expect(step2).toContain('第二步');
    expect(step2).toContain('项目');

    const step3 = getTutorialStepText(1, 1, 'todo-app', null);
    expect(step3).toContain('第三步');
    expect(step3).toContain('策略');

    const step4 = getTutorialStepText(1, 1, 'todo-app', 'agile');
    expect(step4).toContain('准备就绪');
    expect(step4).toContain('执行 Sprint');
  });

  it('should guide through sprint 2 step-by-step', () => {
    const step1 = getTutorialStepText(2, 0, null, null);
    expect(step1).toContain('第一步');
    expect(step1).toContain('技能树');

    const step2 = getTutorialStepText(2, 1, null, null);
    expect(step2).toContain('第二步');
    expect(step2).toContain('项目');

    const step3 = getTutorialStepText(2, 1, 'todo-app', null);
    expect(step3).toContain('第三步');
    expect(step3).toContain('策略');

    const step4 = getTutorialStepText(2, 1, 'todo-app', 'agile');
    expect(step4).toContain('准备完毕');
    expect(step4).toContain('执行 Sprint');
  });
});

describe('TutorialGuide Component', () => {
  const baseProps = {
    sprintCount: 0,
    selectedAgentCount: 0,
    selectedProjectId: null,
    selectedStrategyId: null,
    isOpen: true,
    onClose: vi.fn(),
  };

  it('returns null when sprintCount >= 3', () => {
    const html = renderToStaticMarkup(
      <TutorialGuide {...baseProps} sprintCount={3} />
    );

    expect(html).toBe('');
  });

  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <TutorialGuide {...baseProps} isOpen={false} />
    );

    expect(html).toBe('');
  });

  it('renders close button with tutorial-close-btn class', () => {
    const html = renderToStaticMarkup(
      <TutorialGuide {...baseProps} />
    );

    expect(html).toContain('tutorial-close-btn');
    expect(html).toContain('不再显示');
  });

  it('renders different content for sprint 0 vs sprint 1', () => {
    const html0 = renderToStaticMarkup(
      <TutorialGuide {...baseProps} sprintCount={0} />
    );
    const html1 = renderToStaticMarkup(
      <TutorialGuide {...baseProps} sprintCount={1} />
    );

    expect(html0).toContain('第一步');
    expect(html0).toContain('部署你的首个项目');
    expect(html1).toContain('结算报告与精力管理');
    expect(html0).not.toContain('结算报告');
  });

  it('renders sprint 2 content with skill tree info', () => {
    const html = renderToStaticMarkup(
      <TutorialGuide {...baseProps} sprintCount={2} />
    );

    expect(html).toContain('技能树');
    expect(html).toContain('第三步');
  });
});
