import type { GameState } from './gameState';

export type AchievementCategory = 'employee' | 'project' | 'economic' | 'incident';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  name: string;
  emoji: string;
  description: string;
  conditionType: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
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
    skills?: {
      coding: number;
      debugging: number;
      architecture: number;
      creativity: number;
      speed: number;
    };
  }>;
  sprintCount: number;
  projectsInOneGame: number;      // 本局完成的项目数
  history: Array<{
    bugsDelta: number;
    progressDelta: number;
    cost?: number;
  }>;
  cheapestAgentOnly?: boolean;
  currentBugs?: number;           // 当前项目 bugs 数
  totalIncidents?: number;        // 总事故数
  strategyUsed?: string;          // 使用的策略
  totalTechDebtRemoved?: number;  // 清理的技术债
  minFundsReached?: number;       // 历史最低资金
}

// 根据 conditionType 检查是否达成
/** 根据成就条件类型和当前上下文判断是否达成 */
export function checkAchievement(
  achievement: Achievement,
  context: AchievementContext,
): boolean {
  switch (achievement.conditionType) {
    case 'first_project_completed':
      return context.completedProjectIds.length > 0;

    case 'single_sprint_15_bugs':
      return context.currentSprintBugs !== undefined && context.currentSprintBugs >= 15;

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

    // 新增成就检查逻辑
    case 'agent_max_skills':
      return context.agents.some(
        a =>
          a.skills !== undefined &&
          a.skills.coding >= 100 &&
          a.skills.debugging >= 100 &&
          a.skills.architecture >= 100 &&
          a.skills.creativity >= 100 &&
          a.skills.speed >= 100
      );

    case 'six_agents_unlocked':
      return context.agents.filter(a => !a.locked).length >= 6;

    case 'five_star_agent':
      return context.agents.some(
        a =>
          a.skills !== undefined &&
          (a.skills.coding +
            a.skills.debugging +
            a.skills.architecture +
            a.skills.creativity +
            a.skills.speed) >= 450
      );

    case 'complete_legendary_project':
      // 传说项目在 sampleProjects 中是 autopilot，difficulty = 85 (>= 80)
      return context.completedProjectIds.includes('autopilot');

    case 'funds_reach_8000':
      return context.fundsRemaining >= 8000;

    case 'spend_10000_funds':
      return context.totalFundsSpent >= 10000;

    case 'recover_from_bugs':
      return (
        context.completedProjectIds.length > 0 &&
        context.history.some(h => h.bugsDelta >= 15)
      );

    case 'fifty_bugs_total':
      return context.history.reduce((sum, h) => sum + h.bugsDelta, 0) >= 50;

    // v9 新增成就检查逻辑
    case 'five_projects_one_game':
      return context.projectsInOneGame >= 5;

    case 'zero_bugs_completion':
      return (
        context.completedProjectIds.length > 0 &&
        context.currentBugs !== undefined &&
        context.currentBugs === 0
      );

    case 'all_agents_high_morale':
      return (
        context.agents.length > 0 &&
        context.agents.filter(a => !a.locked).length > 0 &&
        context.agents.filter(a => !a.locked).every(a => a.morale >= 80)
      );

    case 'three_agents_burnout':
      return (
        context.agents.filter(a => !a.locked && a.morale < 20).length >= 3
      );

    case 'funds_reach_15000':
      return context.fundsRemaining >= 15000;

    case 'recover_from_bankruptcy':
      return (
        context.minFundsReached !== undefined &&
        context.minFundsReached <= 100 &&
        context.fundsRemaining >= 2000
      );

    case 'hundred_bugs_total':
      return context.history.reduce((sum, h) => sum + h.bugsDelta, 0) >= 100;

    case 'ten_incidents':
      return context.totalIncidents !== undefined && context.totalIncidents >= 10;

    case 'complete_with_yolo':
      return (
        context.completedProjectIds.length > 0 &&
        context.strategyUsed === 'yolo'
      );

    case 'refactor_50_debt':
      return (
        context.totalTechDebtRemoved !== undefined &&
        context.totalTechDebtRemoved >= 50
      );

    case 'complete_with_crunch':
      return (
        context.completedProjectIds.length > 0 &&
        context.strategyUsed === 'crunch' &&
        context.agents.some(a => a.morale > 0)
      );

    // 隐藏成就
    case 'diva_agent_unlocked':
      return (
        context.agents.filter(a => !a.locked).length >= 8 &&
        context.agents.some(
          a =>
            a.skills !== undefined &&
            a.skills.coding >= 90 &&
            a.skills.creativity >= 90
        )
      );

    case 'chaos_theory':
      return (
        context.history.reduce((sum, h) => sum + h.bugsDelta, 0) >= 200 &&
        context.completedProjectIds.length > 0
      );

    case 'perfect_run':
      return (
        context.completedProjectIds.length >= 3 &&
        context.history.reduce((sum, h) => sum + h.bugsDelta, 0) === 0 &&
        context.fundsRemaining >= 5000
      );

    default:
      return false;
  }
}

// 进度追踪函数
/** 获取成就当前进度（current / target），用于 UI 进度条展示 */
export function getAchievementProgress(
  achievement: Achievement,
  gameState: GameState,
): { current: number; target: number; display: string } | null {
  const completedCount = gameState.completedProjectIds.length;
  const totalSpent = gameState.history.reduce((sum, h) => sum + h.cost, 0);

  switch (achievement.conditionType) {
    case 'first_project_completed':
      return {
        current: completedCount > 0 ? 1 : 0,
        target: 1,
        display: `${completedCount > 0 ? 1 : 0} / 1`,
      };

    case 'single_sprint_15_bugs': {
      const maxBugs = gameState.history.reduce((max, h) => Math.max(max, h.bugsDelta), 0);
      return {
        current: Math.min(maxBugs, 15),
        target: 15,
        display: `${maxBugs} / 15`,
      };
    }

    case 'all_agents_zero_morale': {
      const activeAgents = gameState.agents.filter(a => !a.locked);
      const zeroMoraleCount = activeAgents.filter(a => a.morale <= 0).length;
      return {
        current: zeroMoraleCount,
        target: activeAgents.length || 1,
        display: `${zeroMoraleCount} / ${activeAgents.length}`,
      };
    }

    case 'three_projects_one_game':
      return {
        current: Math.min(completedCount, 3),
        target: 3,
        display: `${completedCount} / 3`,
      };

    case 'project_in_5_sprints':
      return {
        current: Math.min(gameState.sprintCount, 5),
        target: 5,
        display: `${gameState.sprintCount} / 5`,
      };

    case 'agent_6_consecutive': {
      const maxConsecutive = gameState.agents.reduce(
        (max, a) => Math.max(max, a.consecutiveSprints || 0),
        0,
      );
      return {
        current: Math.min(maxConsecutive, 6),
        target: 6,
        display: `${maxConsecutive} / 6`,
      };
    }

    case 'agent_max_skills': {
      const maxSkillsCount = gameState.agents.reduce((max, a) => {
        if (a.locked) return max;
        const skillsCount =
          (a.skills.coding >= 100 ? 1 : 0) +
          (a.skills.debugging >= 100 ? 1 : 0) +
          (a.skills.architecture >= 100 ? 1 : 0) +
          (a.skills.creativity >= 100 ? 1 : 0) +
          (a.skills.speed >= 100 ? 1 : 0);
        return Math.max(max, skillsCount);
      }, 0);
      return {
        current: maxSkillsCount,
        target: 5,
        display: `${maxSkillsCount} / 5`,
      };
    }

    case 'six_agents_unlocked': {
      const unlockedCount = gameState.agents.filter(a => !a.locked).length;
      return {
        current: Math.min(unlockedCount, 6),
        target: 6,
        display: `${unlockedCount} / 6`,
      };
    }

    case 'five_star_agent': {
      const maxTotalSkills = gameState.agents.reduce((max, a) => {
        if (a.locked) return max;
        const total =
          a.skills.coding +
          a.skills.debugging +
          a.skills.architecture +
          a.skills.creativity +
          a.skills.speed;
        return Math.max(max, total);
      }, 0);
      return {
        current: Math.min(maxTotalSkills, 450),
        target: 450,
        display: `${maxTotalSkills} / 450`,
      };
    }

    case 'complete_legendary_project': {
      const hasLegendary = gameState.completedProjectIds.includes('autopilot') ? 1 : 0;
      return {
        current: hasLegendary,
        target: 1,
        display: `${hasLegendary} / 1`,
      };
    }

    case 'funds_reach_8000':
      return {
        current: Math.min(gameState.funds, 8000),
        target: 8000,
        display: `${gameState.funds} / 8000`,
      };

    case 'spend_10000_funds':
      return {
        current: Math.min(totalSpent, 10000),
        target: 10000,
        display: `${totalSpent} / 10000`,
      };

    case 'recover_from_bugs': {
      const maxBugsInSprint = gameState.history.reduce((max, h) => Math.max(max, h.bugsDelta), 0);
      return {
        current: Math.min(maxBugsInSprint, 15),
        target: 15,
        display: `${maxBugsInSprint} / 15`,
      };
    }

    case 'fifty_bugs_total': {
      const totalBugs = gameState.history.reduce((sum, h) => sum + h.bugsDelta, 0);
      return {
        current: Math.min(totalBugs, 50),
        target: 50,
        display: `${totalBugs} / 50`,
      };
    }

    // v9 新增成就进度追踪
    case 'five_projects_one_game':
      return {
        current: Math.min(completedCount, 5),
        target: 5,
        display: `${completedCount} / 5`,
      };

    case 'zero_bugs_completion':
      return null; // 二元成就，无进度

    case 'all_agents_high_morale': {
      const activeAgents = gameState.agents.filter(a => !a.locked);
      const highMoraleCount = activeAgents.filter(a => a.morale >= 80).length;
      return {
        current: highMoraleCount,
        target: activeAgents.length || 1,
        display: `${highMoraleCount} / ${activeAgents.length}`,
      };
    }

    case 'three_agents_burnout': {
      const activeAgents = gameState.agents.filter(a => !a.locked);
      const burnoutCount = activeAgents.filter(a => a.morale < 20).length;
      return {
        current: Math.min(burnoutCount, 3),
        target: 3,
        display: `${burnoutCount} / 3`,
      };
    }

    case 'funds_reach_15000':
      return {
        current: Math.min(gameState.funds, 15000),
        target: 15000,
        display: `${gameState.funds} / 15000`,
      };

    case 'recover_from_bankruptcy':
      return null; // 需要历史最低资金追踪

    case 'hundred_bugs_total': {
      const totalBugs = gameState.history.reduce((sum, h) => sum + h.bugsDelta, 0);
      return {
        current: Math.min(totalBugs, 100),
        target: 100,
        display: `${totalBugs} / 100`,
      };
    }

    case 'ten_incidents': {
      const totalIncidents = gameState.history.reduce((sum, h) => sum + (h.incidents?.length || 0), 0);
      return {
        current: Math.min(totalIncidents, 10),
        target: 10,
        display: `${totalIncidents} / 10`,
      };
    }

    case 'complete_with_yolo':
      return null; // 需要策略追踪

    case 'refactor_50_debt':
      return null; // 需要技术债清理追踪

    case 'complete_with_crunch':
      return null; // 需要策略追踪

    // 隐藏成就不显示进度
    case 'diva_agent_unlocked':
    case 'chaos_theory':
    case 'perfect_run':
      return null;

    default:
      return null;
  }
}
