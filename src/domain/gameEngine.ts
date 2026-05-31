import type { Agent } from './agent';
import type { Project } from './project';
import { getDifficultyReward } from './project';
import type { SprintResult } from './simulation';
import type { GameState } from './gameState';
import type { RNG } from './random';
import { pickRandom } from './random';

export const INITIAL_FUNDS = 5000;

/** 创建初始游戏状态，包含初始资金、工程师列表和可用项目 */
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
    reputation: 50,
    confidence: 50,
    reputationScore: 0,
    quarterlyEvaluations: [],
    triggeredCheckpoints: [],
  };
}

/** 处理 Sprint 结束后的状态更新：资金变化、工程师疲劳/士气/技能增长、项目完成判定、游戏结束检查 */
export function processPostSprint(
  state: GameState,
  result: SprintResult,
  participatingAgentIds: string[],
  rng?: RNG,
): GameState {
  let newFunds = state.funds - result.cost;
  const updatedResult: SprintResult = { ...result };
  const participatingAgentIdSet = new Set(participatingAgentIds);
  const newAgents = state.agents.map((agent) => {
    if (participatingAgentIdSet.has(agent.id)) {
      let morale = agent.morale;
      if (agent.consecutiveSprints >= 3) {
        morale -= 5;
      }
      
      const newSkills = { ...agent.skills };
      const skillKeys = Object.keys(newSkills) as Array<keyof typeof newSkills>;
      if (!rng) {
        throw new Error('processPostSprint requires an rng parameter for deterministic skill growth. Math.random fallback has been removed per quality requirements.');
      }
      const randomSkill = pickRandom(rng, skillKeys);
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
  let newReputation = state.reputation ?? 50;
  let newConfidence = state.confidence ?? 50;

  let repDelta = 0;
  let confDelta = 0;

  const isProjCompletedNow = result.project.progress >= result.project.maxProgress &&
    !completedProjectIds.includes(result.project.id);

  if (isProjCompletedNow) {
    completedProjectIds.push(result.project.id);
    const isOverdue = result.sprintNumber > (result.project.deadline ?? 999);
    if (isOverdue) {
      newFunds += Math.round(getDifficultyReward(result.project) * 0.5);
      repDelta -= 10;
      confDelta -= 10;
      updatedResult.summary += ` | 合同已逾期！完成奖励减半且扣除 10 点声望和 10 点信心。`;
    } else {
      newFunds += getDifficultyReward(result.project);

      let repGain = 10;
      let confGain = 10;
      if (result.project.difficultyLevel === 'intern') {
        repGain = 5;
        confGain = 8;
      } else if (result.project.difficultyLevel === 'normal') {
        repGain = 10;
        confGain = 12;
      } else if (result.project.difficultyLevel === 'hard') {
        repGain = 18;
        confGain = 18;
      } else if (result.project.difficultyLevel === 'legend') {
        repGain = 28;
        confGain = 25;
      }
      repDelta += repGain;
      confDelta += confGain;
      updatedResult.summary += ` | 项目按时完成！获得丰厚资金、声望及信心奖励。`;
    }
  }

  // Update reputation and confidence from regular turn events
  if (result.bugsDelta > 0) {
    repDelta -= Math.floor(result.bugsDelta / 2);
  } else if (result.bugsDelta === 0 && result.progressDelta > 0) {
    repDelta += 1;
  }

  if (result.moraleDelta !== 0) {
    confDelta += Math.round(result.moraleDelta * 0.5);
  }

  // Evaluate Quarterly KPI targets
  const nextSprintNumber = state.sprintCount + 1;
  if (nextSprintNumber % 4 === 0) {
    const endingQuarter = nextSprintNumber / 4;
    let kpiPassed: boolean;
    let kpiDesc: string;

    const completedCount = completedProjectIds.length;

    if (endingQuarter === 1) {
      kpiPassed = completedCount >= 1 && newFunds >= 4000;
      kpiDesc = '完成至少 1 个项目且资金不少于 $4000';
    } else if (endingQuarter === 2) {
      kpiPassed = completedCount >= 3 && newReputation + repDelta >= 60 && newConfidence + confDelta >= 60;
      kpiDesc = '累计完成至少 3 个项目且声望和信心均不低于 60';
    } else if (endingQuarter === 3) {
      kpiPassed = completedCount >= 5 && newReputation + repDelta >= 70 && newConfidence + confDelta >= 70;
      kpiDesc = '累计完成至少 5 个项目且声望和信心均不低于 70';
    } else if (endingQuarter === 4) {
      kpiPassed = completedCount >= 8 && newReputation + repDelta >= 80 && newConfidence + confDelta >= 80;
      kpiDesc = '累计完成至少 8 个项目且声望和信心均不低于 80';
    } else {
      kpiPassed = completedCount >= 12 && newReputation + repDelta >= 90 && newConfidence + confDelta >= 90;
      kpiDesc = '累计完成至少 12 个项目且声望和信心均不低于 90';
    }

    if (kpiPassed) {
      repDelta += 10;
      confDelta += 10;
      updatedResult.summary += ` | 🎉 季度 KPI 达标！声望+10，信心+10。`;
      updatedResult.quarterKpiResult = {
        quarter: endingQuarter,
        passed: true,
        desc: kpiDesc
      };
    } else {
      repDelta -= 15;
      confDelta -= 15;
      updatedResult.summary += ` | ⚠️ 季度 KPI 未达标！声望-15，信心-15。`;
      updatedResult.quarterKpiResult = {
        quarter: endingQuarter,
        passed: false,
        desc: kpiDesc
      };
    }
  }

  // Calculate new absolute values with clamp
  newReputation = Math.max(0, Math.min(100, newReputation + repDelta));
  newConfidence = Math.max(0, Math.min(100, newConfidence + confDelta));

  // Save actual deltas based on clamped values
  updatedResult.reputationDelta = newReputation - (state.reputation ?? 50);
  updatedResult.confidenceDelta = newConfidence - (state.confidence ?? 50);

  const newState: GameState = {
    ...state,
    funds: newFunds,
    sprintCount: state.sprintCount + 1,
    agents: newAgents,
    completedProjectIds,
    history: [...state.history, updatedResult],
    reputation: newReputation,
    reputationScore: newReputation - 50,
    confidence: newConfidence,
  };

  const { gameOver, reason } = checkGameOver(newState);
  if (gameOver) {
    newState.gameOver = true;
    newState.gameOverReason = reason;
  }

  return newState;
}

/** 检查游戏是否结束：资金耗尽或所有可用工程师士气归零 */
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

/** 检查已满足解锁条件的工程师，返回新解锁的工程师 ID 列表 */
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

function checkLocalStorageAvailability(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    const value = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return value === testKey;
  } catch {
    return false;
  }
}

const storageCache = new Map<string, string | null>();
let isUsingFallbackStorage = !checkLocalStorageAvailability();

function cachedGetItem(key: string): string | null {
  if (storageCache.has(key)) {
    return storageCache.get(key) ?? null;
  }
  if (!isUsingFallbackStorage) {
    try {
      const val = localStorage.getItem(key);
      storageCache.set(key, val);
      return val;
    } catch (e) {
      console.warn('localStorage getItem failed, falling back to memory storage', e);
      isUsingFallbackStorage = true;
    }
  }
  return null;
}

function cachedSetItem(key: string, value: string): void {
  storageCache.set(key, value);
  if (!isUsingFallbackStorage) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('localStorage setItem failed, falling back to memory storage', e);
      isUsingFallbackStorage = true;
    }
  }
}

function cachedRemoveItem(key: string): void {
  storageCache.delete(key);
  if (!isUsingFallbackStorage) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('localStorage removeItem failed, falling back to memory storage', e);
      isUsingFallbackStorage = true;
    }
  }
}

/** 保存游戏状态到 localStorage（旧版单槽位，向后兼容） */
export function saveGame(state: GameState): void {
  try {
    cachedSetItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save game', e);
  }
}

/** 从 localStorage 加载游戏状态（旧版单槽位，向后兼容） */
export function loadGame(): GameState | null {
  try {
    const saved = cachedGetItem(SAVE_KEY);
    if (saved) {
      return JSON.parse(saved) as GameState;
    }
  } catch (e) {
    console.error('Failed to load game', e);
  }
  return null;
}

/** 清除 localStorage 中的旧版存档 */
export function clearSave(): void {
  try {
    cachedRemoveItem(SAVE_KEY);
  } catch (e) {
    console.error('Failed to clear save', e);
  }
}
