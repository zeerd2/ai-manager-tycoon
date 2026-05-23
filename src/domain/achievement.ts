export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  // 检查条件：传入当前状态 + 最新 sprint 结果
  // 用一个字符串 conditionType 来标识检查逻辑，避免序列化问题
  conditionType: string;
}

export interface AchievementContext {
  completedProjectIds: string[];
  currentSprintBugs?: number;     // 本轮产生的 bugs
  fundsRemaining: number;
  totalFundsSpent: number;
  agents: Array<{
    morale: number;
    locked: boolean;
    salary?: number;
    isCheapest?: boolean;
    consecutiveSprints?: number;
    consecutiveWorkCount?: number;
  }>;
  sprintCount: number;
  projectsInOneGame: number;      // 本局完成的项目数
  history: Array<{ bugsDelta: number; progressDelta: number }>;
  cheapestAgentOnly?: boolean;
}

// 根据 conditionType 检查是否达成
export function checkAchievement(
  achievement: Achievement,
  context: AchievementContext,
): boolean {
  switch (achievement.conditionType) {
    case 'first_project_completed':
      return context.completedProjectIds.length > 0;

    case 'single_sprint_20_bugs':
      return context.currentSprintBugs !== undefined && context.currentSprintBugs >= 20;

    case 'complete_project_80_percent_funds': {
      const totalFunds = context.fundsRemaining + context.totalFundsSpent;
      return (
        context.completedProjectIds.length > 0 &&
        totalFunds > 0 &&
        (context.fundsRemaining / totalFunds) > 0.8
      );
    }

    case 'all_agents_zero_morale':
      return context.agents.length > 0 && context.agents.every(a => a.morale <= 0);

    case 'three_projects_one_game':
      return context.projectsInOneGame >= 3;

    case 'project_in_5_sprints':
      return context.completedProjectIds.length > 0 && context.sprintCount <= 5;

    case 'agent_6_consecutive':
      return context.agents.some(
        a =>
          (a.consecutiveSprints !== undefined && a.consecutiveSprints >= 6) ||
          (a.consecutiveWorkCount !== undefined && a.consecutiveWorkCount >= 6)
      );

    case 'cheapest_agent_only':
      return (
        context.cheapestAgentOnly === true ||
        (context.completedProjectIds.length > 0 &&
          context.agents.length > 0 &&
          context.agents.every(
            a =>
              a.isCheapest === true ||
              (a.salary !== undefined && a.salary <= 80)
          ))
      );

    default:
      return false;
  }
}
