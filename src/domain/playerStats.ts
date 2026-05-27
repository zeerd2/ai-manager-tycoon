import type { GameState } from './gameState';

export interface PlayerStats {
  // 基础统计
  totalSprints: number;
  totalCompletedProjects: number;
  currentFunds: number;
  totalFundsSpent: number;
  totalFundsEarned: number;

  // Sprint 统计
  totalProgress: number;
  totalBugs: number;
  totalTechDebt: number;
  totalCost: number;
  totalIncidents: number;

  // 均值统计
  avgProgressPerSprint: number;
  avgBugsPerSprint: number;
  avgCostPerSprint: number;
  avgAgentMorale: number;

  // 极值统计
  bestSprintProgress: number;
  worstSprintBugs: number;
  highestCostSprint: number;
  mostIncidentsInSprint: number;

  // 员工统计
  totalAgents: number;
  unlockedAgents: number;
  avgAgentFatigue: number;
  highestAgentSkill: number;

  // 声望与信心
  reputation: number;
  confidence: number;

  // 成就统计
  totalAchievementsUnlocked: number;

  // 事件分类统计
  incidentBreakdown: Record<string, number>;
}

/** 从 GameState 聚合玩家统计数据 */
export function getPlayerStats(state: GameState): PlayerStats {
  const history = state.history;
  const agents = state.agents;
  const unlockedAgents = agents.filter(a => !a.locked);

  // 基础统计
  const totalFundsSpent = history.reduce((sum, h) => sum + h.cost, 0);
  const totalFundsEarned = totalFundsSpent + state.funds - 5000; // 初始资金 5000

  // Sprint 累计
  const totalProgress = history.reduce((sum, h) => sum + h.progressDelta, 0);
  const totalBugs = history.reduce((sum, h) => sum + h.bugsDelta, 0);
  const totalTechDebt = history.reduce((sum, h) => sum + h.techDebtDelta, 0);
  const totalCost = history.reduce((sum, h) => sum + h.cost, 0);
  const totalIncidents = history.reduce((sum, h) => sum + h.incidents.length, 0);

  // 均值
  const sprintCount = history.length || 1;
  const avgProgressPerSprint = Math.round((totalProgress / sprintCount) * 100) / 100;
  const avgBugsPerSprint = Math.round((totalBugs / sprintCount) * 100) / 100;
  const avgCostPerSprint = Math.round((totalCost / sprintCount) * 100) / 100;

  // 极值
  const bestSprintProgress = history.reduce((max, h) => Math.max(max, h.progressDelta), 0);
  const worstSprintBugs = history.reduce((max, h) => Math.max(max, h.bugsDelta), 0);
  const highestCostSprint = history.reduce((max, h) => Math.max(max, h.cost), 0);
  const mostIncidentsInSprint = history.reduce((max, h) => Math.max(max, h.incidents.length), 0);

  // 员工
  const avgAgentMorale = unlockedAgents.length > 0
    ? Math.round(unlockedAgents.reduce((sum, a) => sum + a.morale, 0) / unlockedAgents.length * 100) / 100
    : 0;
  const avgAgentFatigue = unlockedAgents.length > 0
    ? Math.round(unlockedAgents.reduce((sum, a) => sum + a.fatigue, 0) / unlockedAgents.length * 100) / 100
    : 0;
  const highestAgentSkill = agents.reduce((max, a) => {
    const maxSkill = Math.max(a.skills.coding, a.skills.debugging, a.skills.architecture, a.skills.creativity, a.skills.speed);
    return Math.max(max, maxSkill);
  }, 0);

  // 事件分类
  const incidentBreakdown: Record<string, number> = {};
  for (const h of history) {
    for (const inc of h.incidents) {
      incidentBreakdown[inc.type] = (incidentBreakdown[inc.type] || 0) + 1;
    }
  }

  return {
    totalSprints: state.sprintCount,
    totalCompletedProjects: state.completedProjectIds.length,
    currentFunds: state.funds,
    totalFundsSpent,
    totalFundsEarned,
    totalProgress,
    totalBugs,
    totalTechDebt,
    totalCost,
    totalIncidents,
    avgProgressPerSprint,
    avgBugsPerSprint,
    avgCostPerSprint,
    avgAgentMorale,
    bestSprintProgress,
    worstSprintBugs,
    highestCostSprint,
    mostIncidentsInSprint,
    totalAgents: agents.length,
    unlockedAgents: unlockedAgents.length,
    avgAgentFatigue,
    highestAgentSkill,
    reputation: state.reputation ?? 50,
    confidence: state.confidence ?? 50,
    totalAchievementsUnlocked: state.unlockedAchievementIds.length,
    incidentBreakdown,
  };
}
