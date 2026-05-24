export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  prerequisites: string[]; // List of SkillNode IDs
  unlocked: boolean;
  effect: (agent: import('./agent').Agent) => void;
}

export interface SkillTree {
  [agentRole: string]: SkillNode[];
}
