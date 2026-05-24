import { describe, it, expect } from 'vitest';
import { unlockSkill, canUnlockSkill } from '../src/domain/skillTreeLogic';
import type { Agent } from '../src/domain/agent';

describe('Skill Tree Logic', () => {
  const mockAgent: Agent = {
    id: 'test-agent',
    name: 'Test Agent',
    model: 'test-model',
    role: 'AI Researcher',
    avatar: '🔬',
    skills: { coding: 70, debugging: 60, architecture: 90, creativity: 95, speed: 65 },
    salary: 600,
    morale: 80,
    quirk: 'None',
    fatigue: 0,
    consecutiveSprints: 0,
    totalSprintsWorked: 0,
    locked: false,
    unlockedSkills: []
  };

  it('should allow unlocking a skill when prerequisites are met and money is sufficient', () => {
    // ar_1 is a starting skill (no prerequisites, cost 300)
    const agent = { ...mockAgent, skills: { ...mockAgent.skills }, unlockedSkills: [] };
    const canUnlock = canUnlockSkill(agent, 'ar_1', 500);
    expect(canUnlock).toBe(true);

    const result = unlockSkill(agent, 'ar_1', 500);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(300);
    expect(agent.unlockedSkills).toContain('ar_1');
    expect(agent.skills.speed).toBe(mockAgent.skills.speed + 10); // Paper Reading Speedrun adds 10 speed
  });

  it('should not allow unlocking a skill with insufficient money', () => {
    const agent = { ...mockAgent, skills: { ...mockAgent.skills }, unlockedSkills: [] };
    const canUnlock = canUnlockSkill(agent, 'ar_1', 200);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'ar_1', 200);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Not enough money.');
  });

  it('should not allow unlocking a skill if prerequisites are not met', () => {
    // ar_2 requires ar_1, cost 600
    const agent = { ...mockAgent, skills: { ...mockAgent.skills }, unlockedSkills: [] };
    const canUnlock = canUnlockSkill(agent, 'ar_2', 1000);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'ar_2', 1000);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Prerequisites not met.');
  });

  it('should allow unlocking a skill when its prerequisites are already unlocked', () => {
    // ar_2 requires ar_1, cost 600
    const agent = { ...mockAgent, skills: { ...mockAgent.skills }, unlockedSkills: ['ar_1'] };
    const canUnlock = canUnlockSkill(agent, 'ar_2', 1000);
    expect(canUnlock).toBe(true);

    const result = unlockSkill(agent, 'ar_2', 1000);
    expect(result.success).toBe(true);
    expect(result.cost).toBe(600);
    expect(agent.unlockedSkills).toContain('ar_2');
    expect(agent.skills.architecture).toBe(mockAgent.skills.architecture + 20); // Novel Architecture Design adds 20 architecture
  });

  it('should not allow unlocking an already unlocked skill', () => {
    const agent = { ...mockAgent, skills: { ...mockAgent.skills }, unlockedSkills: ['ar_1'] };
    const canUnlock = canUnlockSkill(agent, 'ar_1', 500);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'ar_1', 500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Skill already unlocked.');
  });

  it('should handle invalid roles or invalid skill ids gracefully', () => {
    const agent = { ...mockAgent, role: 'Nonexistent Role' };
    const canUnlock = canUnlockSkill(agent, 'ar_1', 500);
    expect(canUnlock).toBe(false);

    const result = unlockSkill(agent, 'ar_1', 500);
    expect(result.success).toBe(false);
    expect(result.message).toBe('No skill tree for this agent role.');

    const agentWithValidRole = { ...mockAgent };
    const resultInvalidSkill = unlockSkill(agentWithValidRole, 'invalid_skill_id', 500);
    expect(resultInvalidSkill.success).toBe(false);
    expect(resultInvalidSkill.message).toBe('Skill not found.');
  });
});
