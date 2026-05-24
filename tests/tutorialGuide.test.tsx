import { describe, expect, it } from 'vitest';
import { getTutorialStepText } from '../src/components/TutorialGuide';

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
