export interface Agent {
  id: string;
  name: string;
  model: string;
  role: string;
  avatar: string;
  skills: {
    coding: number;
    debugging: number;
    architecture: number;
    creativity: number;
    speed: number;
  };
  salary: number;
  morale: number;
  quirk: string;
  fatigue: number;            // 0-100, 越高越疲劳
  consecutiveSprints: number; // 连续参与 sprint 次数
  totalSprintsWorked: number; // 累计参与 sprint 次数
  locked: boolean;            // 是否已解锁
  unlockAfterSprints?: number; // 在第 N 轮后解锁
  unlockedSkills?: string[];  // 已解锁的技能ID列表
}

/** 计算工程师综合效率值，受技能平均值、士气和疲劳度影响 */
export function agentEffectiveness(agent: Agent): number {
  const { coding, debugging, architecture, creativity, speed } = agent.skills;
  const base = (coding + debugging + architecture + creativity + speed) / 5;
  const moraleMod = 0.5 + (agent.morale / 200);
  const fatigueMod = 1 - (agent.fatigue / 200); // fatigue 100 时效率降到 50%
  return base * moraleMod * fatigueMod;
}
