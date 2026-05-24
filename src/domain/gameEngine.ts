import type { Agent } from './agent';
import type { Project } from './project';
import type { SprintResult } from './simulation';
import type { GameState } from './gameState';

export const INITIAL_FUNDS = 5000;

export function createInitialGameState(agents: Agent[], projects: Project[]): GameState {
  return {
    funds: INITIAL_FUNDS,
    sprintCount: 0,
    agents: [...agents],
    projects: [...projects],
    completedProjectIds: [],
    unlockedAchievementIds: [],
    gameOver: false,
    history: [],
    relations: [],
  };
}

export function processPostSprint(
  state: GameState,
  result: SprintResult,
  participatingAgentIds: string[],
): GameState {
  let newFunds = state.funds - result.cost;
  const newAgents = state.agents.map((agent) => {
    if (participatingAgentIds.includes(agent.id)) {
      let morale = agent.morale;
      if (agent.consecutiveSprints >= 3) {
        morale -= 5;
      }
      
      const newSkills = { ...agent.skills };
      const skillKeys = Object.keys(newSkills) as Array<keyof typeof newSkills>;
      const randomSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
      newSkills[randomSkill] = Math.min(100, newSkills[randomSkill] + 1);

      return {
        ...agent,
        fatigue: Math.min(100, agent.fatigue + 15),
        consecutiveSprints: agent.consecutiveSprints + 1,
        totalSprintsWorked: agent.totalSprintsWorked + 1,
        morale: Math.max(0, morale),
        skills: newSkills,
      };
    } else {
      return {
        ...agent,
        fatigue: Math.max(0, agent.fatigue - 25),
        consecutiveSprints: 0,
        morale: Math.min(100, agent.morale + 8),
      };
    }
  });

  const completedProjectIds = [...state.completedProjectIds];


  if (result.project.progress >= result.project.maxProgress && !completedProjectIds.includes(result.project.id)) {
    completedProjectIds.push(result.project.id);
    newFunds += result.project.difficulty * 20;

  }
  
  const newState: GameState = {
    ...state,
    funds: newFunds,
    sprintCount: state.sprintCount + 1,
    agents: newAgents,
    completedProjectIds,
    history: [...state.history, result],
  };

  const { gameOver, reason } = checkGameOver(newState);
  if (gameOver) {
    newState.gameOver = true;
    newState.gameOverReason = reason;
  }

  return newState;
}

export function checkGameOver(state: GameState): { gameOver: boolean; reason?: string } {
  if (state.funds <= 0) {
    return {
      gameOver: true,
      reason: '公司破产了！连最后一台服务器的电费都交不起了。',
    };
  }

  const unlockedAgents = state.agents.filter((a) => !a.locked);
  if (unlockedAgents.length > 0 && unlockedAgents.every((a) => a.morale <= 0)) {
    return {
      gameOver: true,
      reason: '所有员工集体罢工，公司群聊变成了吐槽大会。',
    };
  }

  return { gameOver: false };
}

export function checkUnlocks(state: GameState): string[] {
  const newlyUnlocked: string[] = [];
  state.agents.forEach((agent) => {
    if (agent.locked && agent.unlockAfterSprints !== undefined && state.sprintCount >= agent.unlockAfterSprints) {
      newlyUnlocked.push(agent.id);
    }
  });
  return newlyUnlocked;
}

const SAVE_KEY = 'ai_manager_tycoon_save_v2';

export function saveGame(state: GameState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game', e);
  }
}

export function loadGame(): GameState | null {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved) as GameState;
    }
  } catch (e) {
    console.error('Failed to load game', e);
  }
  return null;
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.error('Failed to clear save', e);
  }
}
