import type { GameState } from './gameState';

export const SAVE_VERSION = 4;

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
}

export interface AutosaveConfig {
  enabled: boolean;
  interval: number; // in minutes
}

const SLOT_KEY_PREFIX = 'ai_manager_tycoon_save_slot_';
const AUTOSAVE_CONFIG_KEY = 'ai_manager_tycoon_autosave_config';
const OLD_SAVE_KEY = 'ai_manager_tycoon_save_v2';

export const MANUAL_SLOTS = ['1', '2', '3'];
export const AUTO_SLOT = 'auto';

/** 获取存档位的 localStorage key */
export function getSlotKey(slotId: string): string {
  return `${SLOT_KEY_PREFIX}${slotId}`;
}

/** 读取自动存档配置，默认启用且间隔 5 分钟 */
export function getAutosaveConfig(): AutosaveConfig {
  try {
    const saved = localStorage.getItem(AUTOSAVE_CONFIG_KEY);
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
    localStorage.setItem(AUTOSAVE_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save autosave config', e);
  }
}

/** 保存游戏到指定存档位（1/2/3/auto），包含元数据更新 */
export function saveToSlot(
  slotId: string,
  name: string,
  state: GameState,
  extra?: Partial<Pick<SaveData, 'skillTrees' | 'relationships' | 'achievements' | 'projectHistory'>>
): void {
  try {
    const saveData: SaveData = {
      version: SAVE_VERSION,
      gameState: state,
      savedAt: new Date().toISOString(),
      name,
      skillTrees: extra?.skillTrees || {},
      relationships: extra?.relationships || {},
      achievements: extra?.achievements || state.unlockedAchievementIds || [],
      projectHistory: extra?.projectHistory || state.history || []
    };

    localStorage.setItem(getSlotKey(slotId), JSON.stringify(saveData));

    // Update metadata list
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
  } catch (e) {
    console.error(`Failed to save to slot ${slotId}`, e);
    throw new Error(`存档失败: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

/** 从指定存档位加载游戏，自动执行低版本存档迁移 */
export function loadFromSlot(slotId: string): SaveData | null {
  try {
    const key = getSlotKey(slotId);
    const saved = localStorage.getItem(key);
    if (!saved) return null;

    const data = JSON.parse(saved) as SaveData;

    // Auto migration if needed
    if (data.version < SAVE_VERSION) {
      return migrateSaveData(data);
    }

    return data;
  } catch (e) {
    console.error(`Failed to load from slot ${slotId}`, e);
    throw new Error(`加载存档失败: ${e instanceof Error ? e.message : String(e)}`, { cause: e });
  }
}

/** 删除指定存档位的数据 */
export function deleteSlot(slotId: string): void {
  try {
    localStorage.removeItem(getSlotKey(slotId));
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
      const saved = localStorage.getItem(getSlotKey(slotId));
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
    const oldSave = localStorage.getItem(OLD_SAVE_KEY);
    if (!oldSave) return false;

    // Check if slot 1 is empty
    const slot1Key = getSlotKey('1');
    if (localStorage.getItem(slot1Key)) {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function migrateSaveData(oldData: any): SaveData {
  // Simple migration strategy: upgrade version and ensure all v4 keys exist
  const migrated: SaveData = {
    version: SAVE_VERSION,
    gameState: oldData.gameState || oldData, // Handle if v2 structure was raw GameState
    savedAt: oldData.savedAt || new Date().toISOString(),
    skillTrees: oldData.skillTrees || {},
    relationships: oldData.relationships || {},
    achievements: oldData.achievements || oldData.gameState?.unlockedAchievementIds || [],
    projectHistory: oldData.projectHistory || oldData.gameState?.history || []
  };

  return migrated;
}
