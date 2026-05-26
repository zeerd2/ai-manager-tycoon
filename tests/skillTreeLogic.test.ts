import { describe, it, expect } from 'vitest';
import { unlockSkill, canUnlockSkill } from '../src/domain/skillTreeLogic';
import type { Agent } from '../src/domain/agent';

describe('Skill Tree Logic Unit Tests', () => {
  const createMockAgent = (overrides: Partial<Agent> = {}): Agent => {
    return {
      id: 'agent-1',
      name: 'Tech Lead Agent',
      model: 'model-x',
      role: 'Tech Lead',
      avatar: '💻',
      skills: { coding: 70, debugging: 70, architecture: 70, creativity: 70, speed: 70 },
      salary: 3000,
      morale: 100,
      quirk: '',
      fatigue: 0,
      consecutiveSprints: 0,
      totalSprintsWorked: 0,
      locked: false,
      unlockedSkills: [],
      ...overrides,
    };
  };

  it('allows unlocking a valid skill with sufficient funds and no prerequisites (normal)', () => {
    const agent = createMockAgent();
    // tl_1 costs 500, adds 10 architecture
    const canUnlock = canUnlockSkill(agent, 'tl_1', 600);
    expect(canUnlock).toBe(true);

    const result = unlockSkill(agent, 'tl_1', 600);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(500);
    expect(agent.unlockedSkills).toContain('tl_1');
    expect(agent.skills.architecture).toBe(80); // 70 + 10
  });

  it('allows unlocking a skill with exactly enough funds (boundary)', () => {
    const agent = createMockAgent();
    // tl_1 costs 500
    const canUnlock = canUnlockSkill(agent, 'tl_1', 500);
    expect(canUnlock).toBe(true);

    const result = unlockSkill(agent, 'tl_1', 500);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(500);
  });

  it('fails to unlock a skill when prerequisites are missing (boundary)', () => {
    const agent = createMockAgent();
    // tl_2 requires tl_1, costs 800
    const canUnlock = canUnlockSkill(agent, 'tl_2', 1000);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'tl_2', 1000);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Prerequisites not met.');
    expect(agent.unlockedSkills).not.toContain('tl_2');
  });

  it('fails to unlock a skill when role does not exist (exception)', () => {
    const agent = createMockAgent({ role: 'Ghost Role' });
    const canUnlock = canUnlockSkill(agent, 'tl_1', 1000);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'tl_1', 1000);
    expect(result.success).toBe(false);
    expect(result.message).toBe('No skill tree for this agent role.');
  });

  it('fails to unlock a skill when skill ID does not exist for the role (exception)', () => {
    const agent = createMockAgent();
    const canUnlock = canUnlockSkill(agent, 'nonexistent_skill', 1000);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'nonexistent_skill', 1000);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Skill not found.');
  });
});
