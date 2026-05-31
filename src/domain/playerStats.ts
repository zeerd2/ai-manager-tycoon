import type { GameState } from './gameState';

export interface PlayerStats {
  // Overview
  totalSprints: number;
  totalProjectsCompleted: number;
  totalFundsSpent: number;
  totalProgress: number;
  totalBugs: number;
  totalTechDebt: number;

  // Averages
  avgProgressPerSprint: number;
  avgCostPerSprint: number;
  avgMoraleDelta: number;

  // Records
  bestSprintProgress: number;
  worstSprintProgress: number;
  disasterSprintCount: number;

  // Team
  currentTeamSize: number;
  avgTeamSkill: number;
  totalPersonSprints: number;

  // Efficiency
  progressPerFund: number;
  bugsPerProject: number;

  // Achievements
  achievementCount: number;
  achievementRate: number;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

export function calculatePlayerStats(
  gameState: GameState,
  totalAchievements: number
): PlayerStats {
  const { history, completedProjectIds, agents, unlockedAchievementIds } = gameState;

  const totalSprints = history.length;

  // Sums
  const totalProgress = history.reduce((s, h) => s + h.progressDelta, 0);
  const totalBugs = history.reduce((s, h) => s + h.bugsDelta, 0);
  const totalTechDebt = history.reduce((s, h) => s + h.techDebtDelta, 0);
  const totalFundsSpent = history.reduce((s, h) => s + h.cost, 0);

  // Averages
  const avgProgressPerSprint = avg(history.map(h => h.progressDelta));
  const avgCostPerSprint = avg(history.map(h => h.cost));
  const avgMoraleDelta = avg(history.map(h => h.moraleDelta));

  // Records
  const progressDeltas = history.map(h => h.progressDelta);
  const bestSprintProgress = progressDeltas.length > 0 ? Math.max(...progressDeltas) : 0;
  const worstSprintProgress = progressDeltas.length > 0 ? Math.min(...progressDeltas) : 0;
  const disasterSprintCount = history.filter(h => h.progressDelta === 0).length;

  // Team
  const currentTeamSize = agents.length;
  const allSkills = agents.flatMap(a => Object.values(a.skills));
  const avgTeamSkill = avg(allSkills);
  const totalPersonSprints = agents.reduce((s, a) => s + a.totalSprintsWorked, 0);

  // Efficiency
  const progressPerFund = totalFundsSpent > 0 ? totalProgress / totalFundsSpent : 0;
  const totalProjectsCompleted = completedProjectIds.length;
  const bugsPerProject = totalProjectsCompleted > 0 ? totalBugs / totalProjectsCompleted : 0;

  // Achievements
  const achievementCount = unlockedAchievementIds.length;
  const achievementRate = totalAchievements > 0 ? achievementCount / totalAchievements : 0;

  return {
    totalSprints,
    totalProjectsCompleted,
    totalFundsSpent,
    totalProgress,
    totalBugs,
    totalTechDebt,
    avgProgressPerSprint,
    avgCostPerSprint,
    avgMoraleDelta,
    bestSprintProgress,
    worstSprintProgress,
    disasterSprintCount,
    currentTeamSize,
    avgTeamSkill,
    totalPersonSprints,
    progressPerFund,
    bugsPerProject,
    achievementCount,
    achievementRate,
  };
}
