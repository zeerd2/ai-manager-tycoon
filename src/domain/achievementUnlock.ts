import type { GameState } from './gameState';
import type { Achievement, AchievementContext } from './achievement';
import { checkAchievement } from './achievement';
import { achievements as allAchievements } from '../data/achievements';

export interface UnlockResult {
  /** 本次新解锁的成就列表 */
  newlyUnlocked: Achievement[];
  /** 更新后的已解锁 ID 列表 */
  unlockedIds: string[];
}

/** 从 GameState 构建成就检查上下文 */
export function buildAchievementContext(state: GameState, currentSprintBugs?: number): AchievementContext {
  const totalFundsSpent = state.history.reduce((sum, h) => sum + h.cost, 0);

  return {
    completedProjectIds: state.completedProjectIds,
    currentSprintBugs,
    fundsRemaining: state.funds,
    totalFundsSpent,
    agents: state.agents.map(a => ({
      morale: a.morale,
      locked: a.locked,
      salary: a.salary,
      consecutiveSprints: a.consecutiveSprints,
      skills: a.skills,
    })),
    sprintCount: state.sprintCount,
    projectsInOneGame: state.completedProjectIds.length,
    history: state.history.map(h => ({
      bugsDelta: h.bugsDelta,
      progressDelta: h.progressDelta,
      cost: h.cost,
    })),
  };
}

/** 检查所有成就，返回本次新解锁的成就列表和更新后的已解锁 ID 列表 */
export function checkAllAchievements(
  state: GameState,
  currentSprintBugs?: number,
): UnlockResult {
  const context = buildAchievementContext(state, currentSprintBugs);
  const alreadyUnlocked = new Set(state.unlockedAchievementIds);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of allAchievements) {
    if (alreadyUnlocked.has(achievement.id)) continue;
    if (checkAchievement(achievement, context)) {
      newlyUnlocked.push(achievement);
      alreadyUnlocked.add(achievement.id);
    }
  }

  return {
    newlyUnlocked,
    unlockedIds: Array.from(alreadyUnlocked),
  };
}
