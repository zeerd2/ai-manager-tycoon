import type { GameState } from './gameState';
import type { SaveData } from './saveSystem';

/**
 * 版本迁移专用模块
 *
 * 本文件包含从 v2 到 v7 的完整迁移链逻辑。
 * 所有迁移函数和调度器均在此处定义。
 *
 * 红线（R4-1）：
 * - 不得改变任何迁移逻辑
 * - 不得改变迁移顺序
 * - 不得修改 SaveData 结构或默认值规则
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV2ToV3(oldData: any): any {
  // v3 added: relationships, achievements, projectHistory
  return {
    ...oldData,
    version: 3,
    skillTrees: oldData.skillTrees || {},
    relationships: oldData.relationships || {},
    achievements: oldData.achievements || oldData.gameState?.unlockedAchievementIds || [],
    projectHistory: oldData.projectHistory || oldData.gameState?.history || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV3ToV4(oldData: any): any {
  // v4 is same structure as v3, just version bump for consistency
  return {
    ...oldData,
    version: 4,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV4ToV5(oldData: any): any {
  // v5 added: quarterlyEvaluations, reputationScore, triggeredCheckpoints
  return {
    ...oldData,
    version: 5,
    quarterlyEvaluations: oldData.quarterlyEvaluations || [],
    reputationScore: oldData.reputationScore ?? 0,
    triggeredCheckpoints: oldData.triggeredCheckpoints || [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV5ToV6(oldData: any): any {
  // v6 added: teamDynamics, performanceHistory, strategyPreferences
  const gameState = oldData.gameState || oldData;
  return {
    ...oldData,
    version: 6,
    teamDynamics: oldData.teamDynamics || calculateTeamDynamics(gameState),
    performanceHistory: oldData.performanceHistory || calculatePerformanceHistory(gameState),
    strategyPreferences: oldData.strategyPreferences || {},
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateV6ToV7(oldData: any): any {
  // v7 added: checksum, baseVersion, delta (incremental save support)
  return {
    ...oldData,
    version: 7,
    checksum: oldData.checksum || undefined,
    baseVersion: oldData.baseVersion || undefined,
    delta: oldData.delta || undefined,
  };
}

/** 版本迁移链：每一步只处理相邻版本的差异 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MIGRATION_CHAIN: Array<(data: any) => any> = [
  migrateV2ToV3, // index 0: v2→v3
  migrateV3ToV4, // index 1: v3→v4
  migrateV4ToV5, // index 2: v4→v5
  migrateV5ToV6, // index 3: v5→v6
  migrateV6ToV7, // index 4: v6→v7
];

export function normalizeReputationFields(saveData: SaveData): SaveData {
  const reputationScore = saveData.reputationScore ?? saveData.gameState.reputationScore ?? 0;
  return {
    ...saveData,
    reputationScore,
    gameState: {
      ...saveData.gameState,
      reputationScore,
    },
  };
}

/** 计算团队动态数据 */
export function calculateTeamDynamics(state: GameState): SaveData['teamDynamics'] {
  const agents = state.agents || [];
  if (agents.length === 0) {
    return { averageMorale: 0, totalFatigue: 0, averageLoyalty: 0 };
  }
  const averageMorale = agents.reduce((sum, a) => sum + (a.morale || 0), 0) / agents.length;
  const totalFatigue = agents.reduce((sum, a) => sum + (a.fatigue || 0), 0);
  return { averageMorale, totalFatigue, averageLoyalty: 0 };
}

/** 计算绩效历史数据 */
export function calculatePerformanceHistory(state: GameState): SaveData['performanceHistory'] {
  const history = state.history || [];
  if (history.length === 0) {
    return { bestSprintProgress: 0, worstSprintProgress: 0, averageSprintProgress: 0, totalBugsCreated: 0, totalBugsFixed: 0 };
  }
  const progresses = history.map(h => h.progressDelta || 0);
  const bestSprintProgress = Math.max(...progresses);
  const worstSprintProgress = Math.min(...progresses);
  const averageSprintProgress = progresses.reduce((s, p) => s + p, 0) / progresses.length;
  const totalBugsCreated = history.reduce((s, h) => s + Math.max(0, h.bugsDelta || 0), 0);
  return { bestSprintProgress, worstSprintProgress, averageSprintProgress, totalBugsCreated, totalBugsFixed: 0 };
}

/** 执行版本迁移：从当前版本逐步升级到最新版本 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateSaveData(oldData: any): SaveData {
  let currentVersion = oldData.version || 2;
  let migrated = { ...oldData };

  // Handle raw v2 GameState (no version field, no wrapper)
  if (!oldData.version && !oldData.gameState) {
    migrated = { version: 2, gameState: oldData, savedAt: new Date().toISOString() };
    currentVersion = 2;
  }

  // Step through migration chain
  while (currentVersion < 7) {
    const migrationIndex = currentVersion - 2; // v2 is index 0
    if (migrationIndex >= 0 && migrationIndex < MIGRATION_CHAIN.length) {
      migrated = MIGRATION_CHAIN[migrationIndex](migrated);
      currentVersion = migrated.version;
    } else {
      // Unknown version, force to current
      console.warn(`Unknown save version ${currentVersion}, forcing to 7`);
      migrated.version = 7;
      break;
    }
  }

  // Ensure all required fields exist at final version
  return normalizeReputationFields({
    version: 7,
    gameState: migrated.gameState || migrated,
    savedAt: migrated.savedAt || new Date().toISOString(),
    name: migrated.name,
    skillTrees: migrated.skillTrees || {},
    relationships: migrated.relationships || {},
    achievements: migrated.achievements || [],
    projectHistory: migrated.projectHistory || [],
    quarterlyEvaluations: migrated.quarterlyEvaluations || [],
    reputationScore: migrated.reputationScore ?? 0,
    triggeredCheckpoints: migrated.triggeredCheckpoints || [],
    teamDynamics: migrated.teamDynamics || { averageMorale: 0, totalFatigue: 0, averageLoyalty: 0 },
    performanceHistory: migrated.performanceHistory || { bestSprintProgress: 0, worstSprintProgress: 0, averageSprintProgress: 0, totalBugsCreated: 0, totalBugsFixed: 0 },
    strategyPreferences: migrated.strategyPreferences || {},
    checksum: migrated.checksum,
    baseVersion: migrated.baseVersion,
    delta: migrated.delta,
  });
}