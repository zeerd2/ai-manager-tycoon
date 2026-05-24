import type { Agent } from './agent';
import type { Project } from './project';
import type { Strategy } from './strategy';
import { agentEffectiveness } from './agent';

export interface SprintScores {
  rawProgress: number;
  rawBugs: number;
  rawTechDebt: number;
  totalCost: number;
}

/** 计算 Sprint 各项原始数值：进度、Bug、技术债、成本 */
export function calculateSprintScores(
  agents: Agent[],
  project: Project,
  strategy: Strategy,
): SprintScores {
  const totalEff = agents.reduce((sum, a) => sum + agentEffectiveness(a), 0);
  const avgEff = agents.length > 0 ? totalEff / agents.length : 0;
  const teamSize = agents.length;

  const difficultyPenalty = 1 - (project.difficulty / 200);

  const rawProgress = Math.round(
    totalEff * 2 * difficultyPenalty * strategy.modifiers.progressMul
  );

  const baseBugs = Math.round(teamSize * (project.difficulty / 50) * strategy.modifiers.bugMul);
  const debugSkill = agents.reduce((s, a) => s + a.skills.debugging, 0) / Math.max(teamSize, 1);
  const rawBugs = Math.max(0, baseBugs - Math.round(debugSkill / 25));

  const rawTechDebt = Math.round(
    teamSize * 0.5 * (1 + project.risk / 100) * strategy.modifiers.techDebtMul
      - avgEff * 0.1 * (agents.reduce((s, a) => s + a.skills.architecture, 0) / Math.max(teamSize, 1) / 100)
  );

  const totalCost = agents.reduce((s, a) => s + a.salary, 0);

  return { rawProgress, rawBugs, rawTechDebt: Math.max(0, rawTechDebt), totalCost };
}
