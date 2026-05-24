export type DifficultyLevel = 'intern' | 'normal' | 'challenge' | 'hell' | 'legend';

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
    rewardMultiplier: 1.0,
    riskModifier: 0.7,
    bugChanceModifier: 0.5,
    requiredCompletedProjects: 0,
  },
  normal: {
    label: '普通项目',
    emoji: '💼',
    rewardMultiplier: 1.5,
    riskModifier: 1.0,
    bugChanceModifier: 1.0,
    requiredCompletedProjects: 2,
  },
  challenge: {
    label: '挑战项目',
    emoji: '🔥',
    rewardMultiplier: 2.5,
    riskModifier: 1.3,
    bugChanceModifier: 1.5,
    requiredCompletedProjects: 5,
  },
  hell: {
    label: '地狱项目',
    emoji: '💀',
    rewardMultiplier: 4.0,
    riskModifier: 1.8,
    bugChanceModifier: 2.0,
    requiredCompletedProjects: 10,
  },
  legend: {
    label: '传说项目',
    emoji: '🏆',
    rewardMultiplier: 7.0,
    riskModifier: 2.5,
    bugChanceModifier: 3.0,
    requiredCompletedProjects: 15,
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
}

export function isProjectComplete(project: Project): boolean {
  return project.progress >= project.maxProgress;
}

export function getDifficultyReward(project: Project): number {
  const config = DIFFICULTY_CONFIGS[project.difficultyLevel ?? 'normal'];
  return Math.round(project.difficulty * 20 * config.rewardMultiplier);
}

export function isDifficultyUnlocked(level: DifficultyLevel, completedCount: number): boolean {
  return completedCount >= DIFFICULTY_CONFIGS[level].requiredCompletedProjects;
}
