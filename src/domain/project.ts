export type DifficultyLevel = 'intern' | 'normal' | 'hard' | 'legend';

export interface DifficultyConfig {
  label: string;
  emoji: string;
  rewardMultiplier: number;
  riskModifier: number;
  bugChanceModifier: number;
  requiredCompletedProjects: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  intern: {
    label: '实习项目',
    emoji: '🌱',
    rewardMultiplier: 1.4,
    riskModifier: 0.55,
    bugChanceModifier: 0.45,
    requiredCompletedProjects: 0,
  },
  normal: {
    label: '普通项目',
    emoji: '💼',
    rewardMultiplier: 1.6,
    riskModifier: 0.9,
    bugChanceModifier: 0.9,
    requiredCompletedProjects: 2,
  },
  hard: {
    label: '困难项目',
    emoji: '🔥',
    rewardMultiplier: 2.0,
    riskModifier: 1.25,
    bugChanceModifier: 1.35,
    requiredCompletedProjects: 5,
  },
  legend: {
    label: '传说项目',
    emoji: '🏆',
    rewardMultiplier: 2.4,
    riskModifier: 1.55,
    bugChanceModifier: 1.75,
    requiredCompletedProjects: 10,
  },
};

export interface Project {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  urgency: number;
  risk: number;
  progress: number;
  bugs: number;
  techDebt: number;
  maxProgress: number;
  difficultyLevel: DifficultyLevel;
  deadline?: number;
}

/** 判断项目进度是否已达到完成条件 */
export function isProjectComplete(project: Project): boolean {
  return project.progress >= project.maxProgress;
}

/** 根据项目难度等级计算完成奖励金额 */
export function getDifficultyReward(project: Project): number {
  const config = DIFFICULTY_CONFIGS[project.difficultyLevel ?? 'normal'];
  return Math.round(project.difficulty * 20 * config.rewardMultiplier);
}

/** 判断指定难度的项目是否已解锁（基于已完成项目数） */
export function isDifficultyUnlocked(level: DifficultyLevel, completedCount: number): boolean {
  return completedCount >= DIFFICULTY_CONFIGS[level].requiredCompletedProjects;
}
