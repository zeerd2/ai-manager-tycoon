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
});
