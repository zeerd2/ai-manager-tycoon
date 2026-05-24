import type { Agent } from './agent';
import { agentSkillTrees } from '../data/skillTrees';

export function unlockSkill(agent: Agent, skillId: string, companyMoney: number): { success: boolean; cost: number; message?: string } {
  if (!agentSkillTrees[agent.role]) {
    return { success: false, cost: 0, message: "No skill tree for this agent role." };
  }

  const skillNode = agentSkillTrees[agent.role].find(s => s.id === skillId);
  if (!skillNode) {
    return { success: false, cost: 0, message: "Skill not found." };
  }

  agent.unlockedSkills = agent.unlockedSkills || [];

  if (agent.unlockedSkills.includes(skillId)) {
    return { success: false, cost: 0, message: "Skill already unlocked." };
  }

  // Check prerequisites
  for (const prereq of skillNode.prerequisites) {
    if (!agent.unlockedSkills.includes(prereq)) {
      return { success: false, cost: 0, message: "Prerequisites not met." };
    }
  }

  if (companyMoney < skillNode.cost) {
    return { success: false, cost: 0, message: "Not enough money." };
  }

  // Apply effect
  skillNode.effect(agent);
  
  // Record unlock
  agent.unlockedSkills.push(skillId);

  return { success: true, cost: skillNode.cost };
}

export function canUnlockSkill(agent: Agent, skillId: string, companyMoney: number): boolean {
  if (!agentSkillTrees[agent.role]) return false;
  const skillNode = agentSkillTrees[agent.role].find(s => s.id === skillId);
  if (!skillNode) return false;
  
  agent.unlockedSkills = agent.unlockedSkills || [];
  if (agent.unlockedSkills.includes(skillId)) return false;

  for (const prereq of skillNode.prerequisites) {
    if (!agent.unlockedSkills.includes(prereq)) return false;
  }

  if (companyMoney < skillNode.cost) return false;

  return true;
}
