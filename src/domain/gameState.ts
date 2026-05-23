import type { Agent } from './agent';
import type { Project } from './project';
import type { SprintResult } from './simulation';

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
}
