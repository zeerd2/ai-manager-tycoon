import type { SprintResult } from './simulation';
import type { GameState } from './gameState';

export const MIN_REPUTATION = -100;
export const MAX_REPUTATION = 100;

export interface ReputationImpact {
  projectCompleted: number;
  bugsPerSprint: number;
  techDebtPerSprint: number;
  fundMilestone: number;
}

/** 声望等级划分 */
export type ReputationLevel = 'very_low' | 'low' | 'medium' | 'high' | 'very_high';

const LEVEL_THRESHOLDS: { level: ReputationLevel; min: number; label: string }[] = [
  { level: 'very_high', min: 60, label: '极高' },
  { level: 'high', min: 20, label: '高' },
  { level: 'medium', min: -20, label: '中' },
  { level: 'low', min: -60, label: '低' },
  { level: 'very_low', min: -100, label: '极低' },
];

export const DEFAULT_IMPACT: ReputationImpact = {
  projectCompleted: 15,
  bugsPerSprint: -2,
  techDebtPerSprint: -1,
  fundMilestone: 10,
};

/** 根据分数获取声望等级 */
export function getReputationLevel(score: number): ReputationLevel {
  for (const t of LEVEL_THRESHOLDS) {
    if (score >= t.min) return t.level;
  }
  return 'very_low';
}

/** 获取声望等级的中文标签 */
export function getReputationLabel(score: number): string {
  for (const t of LEVEL_THRESHOLDS) {
    if (score >= t.min) return t.label;
  }
  return '极低';
}

function clampScore(score: number): number {
  return Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, Math.round(score)));
}

/** 基于 Sprint 结果计算声望变化量（不修改原值） */
export function calculateReputationDelta(
  sprintResult: SprintResult,
  completedProjectThisSprint: boolean,
  impact: ReputationImpact = DEFAULT_IMPACT,
): number {
  let delta = 0;

  if (completedProjectThisSprint) {
    delta += impact.projectCompleted;
  }

  delta += sprintResult.bugsDelta * impact.bugsPerSprint;

  delta += sprintResult.techDebtDelta * impact.techDebtPerSprint;

  return delta;
}

/** 基于 GameState 和 Sprint 结果计算新的声望值 */
export function calculateNewReputation(
  currentScore: number,
  sprintResult: SprintResult,
  completedProjectThisSprint: boolean,
  impact: ReputationImpact = DEFAULT_IMPACT,
): number {
  const delta = calculateReputationDelta(sprintResult, completedProjectThisSprint, impact);
  return clampScore(currentScore + delta);
}

/** 从 GameState 的快照统计生成声望影响摘要 */
export function summarizeReputationFactors(state: GameState): {
  totalCompleted: number;
  totalBugs: number;
  totalTechDebt: number;
} {
  const history = state.history || [];
  const totalCompleted = state.completedProjectIds?.length ?? 0;
  const totalBugs = history.reduce((s, h) => s + (h.bugsDelta || 0), 0);
  const totalTechDebt = history.reduce((s, h) => s + (h.techDebtDelta || 0), 0);

  return { totalCompleted, totalBugs, totalTechDebt };
}
