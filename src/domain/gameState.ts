import type { Agent } from './agent';
import type { Project } from './project';
import type { SprintResult } from './simulation';

import type { AgentRelation } from './relations/types';

export interface GameState {
  funds: number;
  sprintCount: number;
  agents: Agent[];
  projects: Project[];
  completedProjectIds: string[];
  unlockedAchievementIds: string[];
  gameOver: boolean;
  gameOverReason?: string;
  history: SprintResult[];
  relations: AgentRelation[];
  reputation: number;
  confidence: number;
  reputationScore?: number;
  quarterlyEvaluations?: any[];
  triggeredCheckpoints?: string[];
}
