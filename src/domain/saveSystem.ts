import type { GameState } from './gameState';

export const SAVE_VERSION = 7;

export interface SaveMetadata {
  id: string; // '1', '2', '3', 'auto'
  name: string;
  sprintCount: number;
  funds: number;
  completedProjectsCount: number;
  savedAt: string;
  version: number;
}

export interface SaveData {
  version: number;
  gameState: GameState;
  savedAt: string;
  name?: string;
  // v4 extended/future-proof fields
  skillTrees?: Record<string, unknown>;
  relationships?: Record<string, unknown>;
  achievements?: string[];
  projectHistory?: unknown[];
  // v5 quarterly / reputation / financing fields
  quarterlyEvaluations?: unknown[];
  reputationScore?: number;
  triggeredCheckpoints?: string[];
  // v9 team dynamics and performance tracking
  teamDynamics?: {
    averageMorale: number;
    totalFatigue: number;
    averageLoyalty: number;
  };
  performanceHistory?: {
    bestSprintProgress: number;
    worstSprintProgress: number;
    averageSprintProgress: number;
    totalBugsCreated: number;
    totalBugsFixed: number;
  };
  strategyPreferences?: Record<string, number>;
  // v7 incremental save support
  checksum?: string;
  baseVersion?: number;
  delta?: Partial<SaveData>;
}

/** 存档验证结果 */
export interface SaveValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AutosaveConfig {
  enabled: boolean;
  interval: number; // in minutes
}

/** 成就索引结构 */
export interface AchievementIndex {
  unlockedIds: Set<string>;
  unlockedAt: Map<string, string>;
  count: number;
}

/** 统计索引结构 */
export interface StatisticsIndex {
  totalProjects: number;
  totalSprints: number;
  totalFundsSpent: number;
  averageProgress: number;
  bugRate: number;
  topAgents: Array<{ id: string; name: string; sprints: number }>;
}

const SLOT_KEY_PREFIX = 'ai_manager_tycoon_save_slot_';
const AUTOSAVE_CONFIG_KEY = 'ai_manager_tycoon_autosave_config';
const OLD_SAVE_KEY = 'ai_manager_tycoon_save_v2';
const BACKUP_KEY_PREFIX = 'ai_manager_tycoon_backup_slot_';
const INDEX_KEY_PREFIX = 'ai_manager_tycoon_index_';

export const MANUAL_SLOTS = ['1', '2', '3'];
export const AUTO_SLOT = 'auto';

/** 内存缓存的索引 */
const achievementIndexCache = new Map<string, AchievementIndex>();
const statisticsIndexCache = new Map<string, StatisticsIndex>();

/** 获取存档位的 localStorage key */
export function getSlotKey(slotId: string): string {
  return `${SLOT_KEY_PREFIX}${slotId}`;
}

/** 获取备份的 localStorage key */
function getBackupKey(slotId: string): string {
  return `${BACKUP_KEY_PREFIX}${slotId}`;
}

/** 获取索引的 localStorage key */
function getIndexKey(slotId: string, type: string): string {
  return `${INDEX_KEY_PREFIX}${slotId}_${type}`;
}

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
let hasCheckedLocalStorage = false;
let isUsingFallbackStorage = false;

function ensureStorageChecked(): void {
  if (!hasCheckedLocalStorage) {
    isUsingFallbackStorage = !checkLocalStorageAvailability();
    hasCheckedLocalStorage = true;
  }
}

export function resetStorageCheck(): void {
  hasCheckedLocalStorage = false;
  isUsingFallbackStorage = false;
  storageCache.clear();
  achievementIndexCache.clear();
  statisticsIndexCache.clear();
}

export function isFallbackStorageActive(): boolean {
  ensureStorageChecked();
  return isUsingFallbackStorage;
}

function cachedGetItem(key: string): string | null {
  ensureStorageChecked();
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
  ensureStorageChecked();
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
  ensureStorageChecked();
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

/** 计算简单校验和用于数据完整性验证 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/** 创建存档备份 */
function createBackup(slotId: string): void {
  try {
    const current = cachedGetItem(getSlotKey(slotId));
    if (current) {
      cachedSetItem(getBackupKey(slotId), current);
    }
  } catch (e) {
    console.warn('Failed to create backup', e);
  }
}

/** 从备份恢复存档 */
export function restoreFromBackup(slotId: string): boolean {
  try {
    const backup = cachedGetItem(getBackupKey(slotId));
    if (backup) {
      cachedSetItem(getSlotKey(slotId), backup);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to restore from backup', e);
    return false;
  }
}

/** 读取自动存档配置，默认启用且间隔 5 分钟 */
export function getAutosaveConfig(): AutosaveConfig {
  try {
    const saved = cachedGetItem(AUTOSAVE_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved) as AutosaveConfig;
    }
  } catch (e) {
    console.error('Failed to load autosave config', e);
  }
  return { enabled: true, interval: 5 }; // default enabled, 5 minutes
}

/** 保存自动存档配置到 localStorage */
export function setAutosaveConfig(config: AutosaveConfig): void {
  try {
    cachedSetItem(AUTOSAVE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save autosave config', e);
  }
}

/** 计算两个状态之间的差异 */
function calculateDelta(oldState: GameState, newState: GameState): Partial<GameState> {
  const delta: Partial<GameState> = {};

  if (oldState.funds !== newState.funds) delta.funds = newState.funds;
  if (oldState.sprintCount !== newState.sprintCount) delta.sprintCount = newState.sprintCount;
  if (oldState.gameOver !== newState.gameOver) delta.gameOver = newState.gameOver;
  if (oldState.gameOverReason !== newState.gameOverReason) delta.gameOverReason = newState.gameOverReason;
  if (oldState.reputation !== newState.reputation) delta.reputation = newState.reputation;
  if (oldState.confidence !== newState.confidence) delta.confidence = newState.confidence;

  // 比较数组
  if (JSON.stringify(oldState.completedProjectIds) !== JSON.stringify(newState.completedProjectIds)) {
    delta.completedProjectIds = newState.completedProjectIds;
  }
  if (JSON.stringify(oldState.unlockedAchievementIds) !== JSON.stringify(newState.unlockedAchievementIds)) {
    delta.unlockedAchievementIds = newState.unlockedAchievementIds;
  }

  // 对于复杂数组，检查长度变化或内容变化
  if (oldState.agents.length !== newState.agents.length ||
      JSON.stringify(oldState.agents) !== JSON.stringify(newState.agents)) {
    delta.agents = newState.agents;
  }
  if (oldState.projects.length !== newState.projects.length ||
      JSON.stringify(oldState.projects) !== JSON.stringify(newState.projects)) {
    delta.projects = newState.projects;
  }
  if (oldState.history.length !== newState.history.length ||
      JSON.stringify(oldState.history) !== JSON.stringify(newState.history)) {
    delta.history = newState.history;
  }
  if (oldState.relations.length !== newState.relations.length ||
      JSON.stringify(oldState.relations) !== JSON.stringify(newState.relations)) {
    delta.relations = newState.relations;
  }

  return delta;
}

/** 保存游戏到指定存档位（1/2/3/auto），包含元数据更新 */
export function saveToSlot(
  slotId: string,
  name: string,
  state: GameState,
  extra?: Partial<Pick<SaveData, 'skillTrees' | 'relationships' | 'achievements' | 'projectHistory' | 'quarterlyEvaluations' | 'reputationScore' | 'triggeredCheckpoints' | 'teamDynamics' | 'performanceHistory' | 'strategyPreferences'>>,
  options?: { incremental?: boolean }
): void {
  try {
    let saveData: SaveData;

    // 增量保存模式
    if (options?.incremental) {
      const existing = loadFromSlot(slotId);
      if (existing && existing.version === SAVE_VERSION) {
        const delta = calculateDelta(existing.gameState, state);
        const hasChanges = Object.keys(delta).length > 0;

        if (!hasChanges) {
          return; // 没有变化，跳过保存
        }

        // 有变化时才创建备份
        createBackup(slotId);

        saveData = {
          version: SAVE_VERSION,
          gameState: state,
          savedAt: new Date().toISOString(),
          name,
          baseVersion: existing.baseVersion || existing.version,
          delta: { gameState: delta } as any,
          skillTrees: extra?.skillTrees || existing.skillTrees || {},
          relationships: extra?.relationships || existing.relationships || {},
          achievements: extra?.achievements || state.unlockedAchievementIds || [],
          projectHistory: extra?.projectHistory || state.history || [],
          quarterlyEvaluations: extra?.quarterlyEvaluations || existing.quarterlyEvaluations || [],
          reputationScore: extra?.reputationScore ?? existing.reputationScore ?? 0,
          triggeredCheckpoints: extra?.triggeredCheckpoints || existing.triggeredCheckpoints || [],
          teamDynamics: extra?.teamDynamics || calculateTeamDynamics(state),
          performanceHistory: extra?.performanceHistory || calculatePerformanceHistory(state),
          strategyPreferences: extra?.strategyPreferences || existing.strategyPreferences || {},
        };
      } else {
        // 首次保存或版本不匹配，执行完整保存
        createBackup(slotId);
        saveData = createFullSaveData(state, name, extra);
      }
    } else {
      // 完整保存模式
      createBackup(slotId);
      saveData = createFullSaveData(state, name, extra);
    }

    // 计算校验和
    const dataString = JSON.stringify(saveData);
    saveData.checksum = calculateChecksum(dataString);

    cachedSetItem(getSlotKey(slotId), JSON.stringify(saveData));

    // 更新索引
    updateAchievementIndex(slotId, state);
    updateStatisticsIndex(slotId, state);

    // 更新元数据列表
    updateMetadataList(slotId, name, state, saveData);
  } catch (e) {
    console.error(`Failed to save to slot ${slotId}`, e);
    throw new Error(`存档失败: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

/** 创建完整保存数据 */
function createFullSaveData(
  state: GameState,
  name: string,
  extra?: Partial<Pick<SaveData, 'skillTrees' | 'relationships' | 'achievements' | 'projectHistory' | 'quarterlyEvaluations' | 'reputationScore' | 'triggeredCheckpoints' | 'teamDynamics' | 'performanceHistory' | 'strategyPreferences'>>
): SaveData {
  return {
    version: SAVE_VERSION,
    gameState: state,
    savedAt: new Date().toISOString(),
    name,
    skillTrees: extra?.skillTrees || {},
    relationships: extra?.relationships || {},
    achievements: extra?.achievements || state.unlockedAchievementIds || [],
    projectHistory: extra?.projectHistory || state.history || [],
    quarterlyEvaluations: extra?.quarterlyEvaluations || [],
    reputationScore: extra?.reputationScore ?? 0,
    triggeredCheckpoints: extra?.triggeredCheckpoints || [],
    teamDynamics: extra?.teamDynamics || calculateTeamDynamics(state),
    performanceHistory: extra?.performanceHistory || calculatePerformanceHistory(state),
    strategyPreferences: extra?.strategyPreferences || {},
  };
}

/** 更新成就索引 */
function updateAchievementIndex(slotId: string, state: GameState): void {
  const index: AchievementIndex = {
    unlockedIds: new Set(state.unlockedAchievementIds),
    unlockedAt: new Map(),
    count: state.unlockedAchievementIds.length,
  };

  // 记录解锁时间
  state.unlockedAchievementIds.forEach(id => {
    if (!index.unlockedAt.has(id)) {
      index.unlockedAt.set(id, new Date().toISOString());
    }
  });

  achievementIndexCache.set(slotId, index);

  // 持久化索引
  try {
    const indexData = {
      unlockedIds: Array.from(index.unlockedIds),
      unlockedAt: Object.fromEntries(index.unlockedAt),
      count: index.count,
    };
    cachedSetItem(getIndexKey(slotId, 'achievements'), JSON.stringify(indexData));
  } catch (e) {
    console.warn('Failed to persist achievement index', e);
  }
}

/** 更新统计索引 */
function updateStatisticsIndex(slotId: string, state: GameState): void {
  const history = state.history || [];
  const agents = state.agents || [];

  const totalProgress = history.reduce((sum, h) => sum + (h.progressDelta || 0), 0);
  const totalBugs = history.reduce((sum, h) => sum + Math.max(0, h.bugsDelta || 0), 0);

  const index: StatisticsIndex = {
    totalProjects: state.completedProjectIds.length,
    totalSprints: state.sprintCount,
    totalFundsSpent: history.reduce((sum, h) => sum + (h.cost || 0), 0),
    averageProgress: history.length > 0 ? totalProgress / history.length : 0,
    bugRate: state.sprintCount > 0 ? totalBugs / state.sprintCount : 0,
    topAgents: agents
      .map(a => ({ id: a.id, name: a.name, sprints: a.totalSprintsWorked || 0 }))
      .sort((a, b) => b.sprints - a.sprints)
      .slice(0, 5),
  };

  statisticsIndexCache.set(slotId, index);

  // 持久化索引
  try {
    cachedSetItem(getIndexKey(slotId, 'statistics'), JSON.stringify(index));
  } catch (e) {
    console.warn('Failed to persist statistics index', e);
  }
}

/** 更新元数据列表 */
function updateMetadataList(slotId: string, name: string, state: GameState, saveData: SaveData): void {
  const metadataList = getSaveSlotsMetadata();
  const existingIndex = metadataList.findIndex(m => m.id === slotId);

  const newMetadata: SaveMetadata = {
    id: slotId,
    name,
    sprintCount: state.sprintCount,
    funds: state.funds,
    completedProjectsCount: state.completedProjectIds.length,
    savedAt: saveData.savedAt,
    version: SAVE_VERSION
  };

  if (existingIndex >= 0) {
    metadataList[existingIndex] = newMetadata;
  } else {
    metadataList.push(newMetadata);
  }
}

/** 从指定存档位加载游戏，自动执行低版本存档迁移 */
export function loadFromSlot(slotId: string): SaveData | null {
  try {
    const key = getSlotKey(slotId);
    const saved = cachedGetItem(key);
    if (!saved) return null;

    const data = JSON.parse(saved) as SaveData;

    // 校验和验证
    if (data.checksum) {
      const dataWithoutChecksum = { ...data };
      delete dataWithoutChecksum.checksum;
      const expectedChecksum = calculateChecksum(JSON.stringify(dataWithoutChecksum));
      if (data.checksum !== expectedChecksum) {
        console.warn(`存档校验和不匹配 (slot ${slotId})，尝试从备份恢复`);
        if (restoreFromBackup(slotId)) {
          return loadFromSlot(slotId); // 重试加载
        }
        console.error('备份恢复失败，存档可能损坏');
      }
    }

    // Auto migration if needed (also handles raw GameState without version/gameState wrapper)
    if (!data.version || data.version < SAVE_VERSION || !data.gameState) {
      return migrateSaveData(data);
    }

    // 处理增量存档
    if (data.delta) {
      // 增量存档已包含完整gameState，直接返回
      delete data.delta;
    }

    return data;
  } catch (e) {
    console.error(`Failed to load from slot ${slotId}`, e);
    throw new Error(`加载存档失败: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

/** 获取成就索引 */
export function getAchievementIndex(slotId: string): AchievementIndex | null {
  // 先检查缓存
  if (achievementIndexCache.has(slotId)) {
    return achievementIndexCache.get(slotId)!;
  }

  // 从存储加载
  try {
    const saved = cachedGetItem(getIndexKey(slotId, 'achievements'));
    if (saved) {
      const data = JSON.parse(saved);
      const index: AchievementIndex = {
        unlockedIds: new Set(data.unlockedIds),
        unlockedAt: new Map(Object.entries(data.unlockedAt)),
        count: data.count,
      };
      achievementIndexCache.set(slotId, index);
      return index;
    }
  } catch (e) {
    console.warn('Failed to load achievement index', e);
  }

  // 从存档数据构建索引
  const saveData = loadFromSlot(slotId);
  if (saveData) {
    updateAchievementIndex(slotId, saveData.gameState);
    return achievementIndexCache.get(slotId) || null;
  }

  return null;
}

/** 获取统计索引 */
export function getStatisticsIndex(slotId: string): StatisticsIndex | null {
  // 先检查缓存
  if (statisticsIndexCache.has(slotId)) {
    return statisticsIndexCache.get(slotId)!;
  }

  // 从存储加载
  try {
    const saved = cachedGetItem(getIndexKey(slotId, 'statistics'));
    if (saved) {
      const index = JSON.parse(saved) as StatisticsIndex;
      statisticsIndexCache.set(slotId, index);
      return index;
    }
  } catch (e) {
    console.warn('Failed to load statistics index', e);
  }

  // 从存档数据构建索引
  const saveData = loadFromSlot(slotId);
  if (saveData) {
    updateStatisticsIndex(slotId, saveData.gameState);
    return statisticsIndexCache.get(slotId) || null;
  }

  return null;
}

/** 检查成就是否已解锁（使用索引快速查询） */
export function isAchievementUnlocked(slotId: string, achievementId: string): boolean {
  const index = getAchievementIndex(slotId);
  return index ? index.unlockedIds.has(achievementId) : false;
}

/** 批量检查成就解锁状态 */
export function batchCheckAchievements(slotId: string, achievementIds: string[]): Map<string, boolean> {
  const index = getAchievementIndex(slotId);
  const result = new Map<string, boolean>();

  achievementIds.forEach(id => {
    result.set(id, index ? index.unlockedIds.has(id) : false);
  });

  return result;
}

/** 验证指定存档位的数据完整性 */
export function validateSlot(slotId: string): SaveValidationResult {
  try {
    const key = getSlotKey(slotId);
    const saved = cachedGetItem(key);
    if (!saved) {
      return { valid: false, errors: ['存档位为空'], warnings: [] };
    }
    const data = JSON.parse(saved);
    return validateSaveData(data);
  } catch (e) {
    return { valid: false, errors: [`解析存档失败: ${e instanceof Error ? e.message : String(e)}`], warnings: [] };
  }
}

/** 删除指定存档位的数据 */
export function deleteSlot(slotId: string): void {
  try {
    cachedRemoveItem(getSlotKey(slotId));
    cachedRemoveItem(getBackupKey(slotId));
    cachedRemoveItem(getIndexKey(slotId, 'achievements'));
    cachedRemoveItem(getIndexKey(slotId, 'statistics'));
    achievementIndexCache.delete(slotId);
    statisticsIndexCache.delete(slotId);
  } catch (e) {
    console.error(`Failed to delete slot ${slotId}`, e);
  }
}

/** 获取所有存档位的元数据列表（用于存档管理界面） */
export function getSaveSlotsMetadata(): SaveMetadata[] {
  const metadataList: SaveMetadata[] = [];
  const allSlots = [...MANUAL_SLOTS, AUTO_SLOT];

  for (const slotId of allSlots) {
    try {
      const saved = cachedGetItem(getSlotKey(slotId));
      if (saved) {
        const data = JSON.parse(saved) as SaveData;
        metadataList.push({
          id: slotId,
          name: data.name || (slotId === AUTO_SLOT ? '自动存档' : `存档位 ${slotId}`),
          sprintCount: data.gameState?.sprintCount || 0,
          funds: data.gameState?.funds || 0,
          completedProjectsCount: data.gameState?.completedProjectIds?.length || 0,
          savedAt: data.savedAt || new Date().toISOString(),
          version: data.version || 2
        });
      }
    } catch (e) {
      console.error(`Failed to parse metadata for slot ${slotId}`, e);
    }
  }

  return metadataList;
}

/** 检查并迁移旧版 v2 存档到新多槽位系统 */
export function checkAndMigrateOldSave(): boolean {
  try {
    const oldSave = cachedGetItem(OLD_SAVE_KEY);
    if (!oldSave) return false;

    // Check if slot 1 is empty
    const slot1Key = getSlotKey('1');
    if (cachedGetItem(slot1Key)) {
      // Slot 1 is already taken, don't overwrite automatically
      return false;
    }

    const state = JSON.parse(oldSave) as GameState;
    saveToSlot('1', '旧版导入存档', state);

    // We keep the old save as a backup as requested in requirements
    // "保留旧数据作为备份"
    return true;
  } catch (e) {
    console.error('Failed to migrate old save', e);
    return false;
  }
}

/** 计算团队动态数据 */
function calculateTeamDynamics(state: GameState): SaveData['teamDynamics'] {
  const agents = state.agents || [];
  if (agents.length === 0) {
    return { averageMorale: 0, totalFatigue: 0, averageLoyalty: 0 };
  }
  const averageMorale = agents.reduce((sum, a) => sum + (a.morale || 0), 0) / agents.length;
  const totalFatigue = agents.reduce((sum, a) => sum + (a.fatigue || 0), 0);
  return { averageMorale, totalFatigue, averageLoyalty: 0 };
}

/** 计算绩效历史数据 */
function calculatePerformanceHistory(state: GameState): SaveData['performanceHistory'] {
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
const MIGRATION_CHAIN: Array<(data: any) => any> = [
  migrateV2ToV3, // index 0: v2→v3
  migrateV3ToV4, // index 1: v3→v4
  migrateV4ToV5, // index 2: v4→v5
  migrateV5ToV6, // index 3: v5→v6
  migrateV6ToV7, // index 4: v6→v7
];

/** 执行版本迁移：从当前版本逐步升级到最新版本 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateSaveData(oldData: any): SaveData {
  let currentVersion = oldData.version || 2;
  let migrated = { ...oldData };

  // Handle raw v2 GameState (no version field, no wrapper)
  if (!oldData.version && !oldData.gameState) {
    migrated = { version: 2, gameState: oldData, savedAt: new Date().toISOString() };
    currentVersion = 2;
  }

  // Step through migration chain
  while (currentVersion < SAVE_VERSION) {
    const migrationIndex = currentVersion - 2; // v2 is index 0
    if (migrationIndex >= 0 && migrationIndex < MIGRATION_CHAIN.length) {
      migrated = MIGRATION_CHAIN[migrationIndex](migrated);
      currentVersion = migrated.version;
    } else {
      // Unknown version, force to current
      console.warn(`Unknown save version ${currentVersion}, forcing to ${SAVE_VERSION}`);
      migrated.version = SAVE_VERSION;
      break;
    }
  }

  // Ensure all required fields exist at final version
  return {
    version: SAVE_VERSION,
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
  };
}

/** 验证存档数据的完整性和结构 */
export function validateSaveData(data: unknown): SaveValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['存档数据为空或格式错误'], warnings };
  }

  const save = data as Record<string, unknown>;

  // Check version
  if (typeof save.version !== 'number') {
    errors.push('缺少版本号字段');
  } else if (save.version > SAVE_VERSION) {
    warnings.push(`存档版本 (${save.version}) 高于当前支持版本 (${SAVE_VERSION})，可能丢失新功能数据`);
  } else if (save.version < 2) {
    errors.push(`存档版本 (${save.version}) 过旧，无法迁移`);
  }

  // Check gameState
  if (!save.gameState || typeof save.gameState !== 'object') {
    errors.push('缺少游戏状态数据');
  } else {
    const gs = save.gameState as Record<string, unknown>;
    if (typeof gs.funds !== 'number') warnings.push('缺少资金数据，将使用默认值');
    if (typeof gs.sprintCount !== 'number') warnings.push('缺少 Sprint 计数，将使用默认值');
    if (!Array.isArray(gs.agents)) warnings.push('缺少员工数据，将使用空数组');
    if (!Array.isArray(gs.projects)) warnings.push('缺少项目数据，将使用空数组');
    if (!Array.isArray(gs.completedProjectIds)) warnings.push('缺少已完成项目列表');
    if (!Array.isArray(gs.history)) warnings.push('缺少历史记录');
  }

  // Check savedAt
  if (!save.savedAt || typeof save.savedAt !== 'string') {
    warnings.push('缺少保存时间戳');
  }

  // v5+ fields
  const saveVersion = save.version as number;
  if (saveVersion >= 5) {
    if (save.quarterlyEvaluations !== undefined && !Array.isArray(save.quarterlyEvaluations)) {
      errors.push('季度评估数据格式错误');
    }
    if (save.reputationScore !== undefined && typeof save.reputationScore !== 'number') {
      errors.push('声望分数格式错误');
    }
    if (save.triggeredCheckpoints !== undefined && !Array.isArray(save.triggeredCheckpoints)) {
      errors.push('融资检查点数据格式错误');
    }
  }

  // v6+ fields
  if (saveVersion >= 6) {
    if (save.teamDynamics !== undefined) {
      const td = save.teamDynamics as Record<string, unknown>;
      if (typeof td !== 'object') {
        errors.push('团队动态数据格式错误');
      } else {
        if (td.averageMorale !== undefined && typeof td.averageMorale !== 'number') {
          warnings.push('团队平均士气数据格式异常');
        }
      }
    }
    if (save.performanceHistory !== undefined) {
      const ph = save.performanceHistory as Record<string, unknown>;
      if (typeof ph !== 'object') {
        errors.push('绩效历史数据格式错误');
      }
    }
    if (save.strategyPreferences !== undefined && typeof save.strategyPreferences !== 'object') {
      errors.push('策略偏好数据格式错误');
    }
  }

  // v7+ fields (incremental save)
  if (saveVersion >= 7) {
    if (save.checksum !== undefined && typeof save.checksum !== 'string') {
      warnings.push('校验和格式异常');
    }
    if (save.delta !== undefined && typeof save.delta !== 'object') {
      errors.push('增量数据格式错误');
    }
  }

  // 验证校验和
  if (save.checksum && typeof save.checksum === 'string') {
    const dataWithoutChecksum = { ...save };
    delete dataWithoutChecksum.checksum;
    const expectedChecksum = calculateChecksum(JSON.stringify(dataWithoutChecksum));
    if (save.checksum !== expectedChecksum) {
      warnings.push('存档校验和不匹配，数据可能被修改');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/** 清除所有索引缓存 */
export function clearIndexCache(): void {
  achievementIndexCache.clear();
  statisticsIndexCache.clear();
}

/** 重建指定存档位的所有索引 */
export function rebuildIndexes(slotId: string): void {
  const saveData = loadFromSlot(slotId);
  if (saveData) {
    updateAchievementIndex(slotId, saveData.gameState);
    updateStatisticsIndex(slotId, saveData.gameState);
  }
}
