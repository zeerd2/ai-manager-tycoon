import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  getSaveSlotsMetadata,
  getAutosaveConfig,
  setAutosaveConfig,
  checkAndMigrateOldSave,
  SAVE_VERSION,
  resetStorageCheck,
  isFallbackStorageActive,
  validateSaveData,
  validateSlot,
  getAchievementIndex,
  getStatisticsIndex,
  isAchievementUnlocked,
  batchCheckAchievements,
  restoreFromBackup,
  rebuildIndexes,
  clearIndexCache
} from '../src/domain/saveSystem';
import type { GameState } from '../src/domain/gameState';

describe('Save System', () => {
  let mockState: GameState;

  beforeEach(() => {
    // Reset mock state
    mockState = {
      funds: 5000,
      sprintCount: 3,
      agents: [],
      projects: [],
      completedProjectIds: ['p1', 'p2'],
      unlockedAchievementIds: ['a1'],
      gameOver: false,
      history: [],
      relations: [],
      reputation: 0,
      confidence: 50,
    };

    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString() }),
      removeItem: vi.fn((key) => { delete store[key] }),
    });

    resetStorageCheck();
    clearIndexCache();
  });

  describe('Autosave Configuration', () => {
    it('should return default config when nothing is stored', () => {
      const config = getAutosaveConfig();
      expect(config).toEqual({ enabled: true, interval: 5 });
    });

    it('should save and load config correctly', () => {
      setAutosaveConfig({ enabled: false, interval: 10 });
      const config = getAutosaveConfig();
      expect(config).toEqual({ enabled: false, interval: 10 });
    });
  });

  describe('Save Slot Operations', () => {
    it('should save to slot and load back correctly', () => {
      saveToSlot('1', '测试存档 1', mockState);

      const loaded = loadFromSlot('1');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
      expect(loaded!.gameState.funds).toBe(5000);
      expect(loaded!.gameState.sprintCount).toBe(3);
      expect(loaded!.gameState.completedProjectIds).toEqual(['p1', 'p2']);
      expect(loaded!.gameState.unlockedAchievementIds).toEqual(['a1']);
    });

    it('should delete slots correctly', () => {
      saveToSlot('2', '测试存档 2', mockState);
      expect(loadFromSlot('2')).not.toBeNull();

      deleteSlot('2');
      expect(loadFromSlot('2')).toBeNull();
    });

    it('should fetch correct metadata for slots', () => {
      saveToSlot('1', '存档一', mockState);
      saveToSlot('3', '存档三', { ...mockState, funds: 1000, sprintCount: 15 });

      const metadata = getSaveSlotsMetadata();
      expect(metadata.length).toBe(2);

      const slot1 = metadata.find(m => m.id === '1')!;
      expect(slot1).toBeDefined();
      expect(slot1.name).toBe('存档一');
      expect(slot1.funds).toBe(5000);
      expect(slot1.sprintCount).toBe(3);
      expect(slot1.completedProjectsCount).toBe(2);

      const slot3 = metadata.find(m => m.id === '3')!;
      expect(slot3).toBeDefined();
      expect(slot3.funds).toBe(1000);
      expect(slot3.sprintCount).toBe(15);
    });
  });

  describe('Overwrite and Extended Fields', () => {
    it('should overwrite existing save slot and update metadata', () => {
      saveToSlot('1', '第一个存档', mockState);

      const updatedState = { ...mockState, funds: 9999, sprintCount: 10 };
      saveToSlot('1', '覆盖后的存档', updatedState);

      const loaded = loadFromSlot('1');
      expect(loaded!.gameState.funds).toBe(9999);
      expect(loaded!.gameState.sprintCount).toBe(10);

      const metadata = getSaveSlotsMetadata();
      const slot1Meta = metadata.find(m => m.id === '1')!;
      expect(slot1Meta.name).toBe('覆盖后的存档');
      expect(slot1Meta.funds).toBe(9999);
    });

    it('should preserve extra fields when saving and loading', () => {
      const extraFields = {
        skillTrees: { tree1: { unlocked: true } },
        relationships: { agent1: { trust: 80 } },
        achievements: ['first-blood', 'bug-factory'],
        projectHistory: [{ projectId: 'p1', completedAt: '2025-01-01' }],
      };

      saveToSlot('2', '额外数据存档', mockState, extraFields);
      const loaded = loadFromSlot('2');

      expect(loaded!.skillTrees).toEqual(extraFields.skillTrees);
      expect(loaded!.relationships).toEqual(extraFields.relationships);
      expect(loaded!.achievements).toEqual(extraFields.achievements);
      expect(loaded!.projectHistory).toEqual(extraFields.projectHistory);
    });

    it('should save auto slot and include it in metadata', () => {
      saveToSlot('auto', '自动存档', mockState);
      const metadata = getSaveSlotsMetadata();
      const autoSlot = metadata.find(m => m.id === 'auto');
      expect(autoSlot).toBeDefined();
      expect(autoSlot!.name).toBe('自动存档');
    });

    it('should handle multiple saves across all slots', () => {
      saveToSlot('1', '存档一', { ...mockState, funds: 1000 });
      saveToSlot('2', '存档二', { ...mockState, funds: 2000 });
      saveToSlot('3', '存档三', { ...mockState, funds: 3000 });
      saveToSlot('auto', '自动', { ...mockState, funds: 4000 });

      const metadata = getSaveSlotsMetadata();
      expect(metadata).toHaveLength(4);

      expect(metadata.find(m => m.id === '1')!.funds).toBe(1000);
      expect(metadata.find(m => m.id === '2')!.funds).toBe(2000);
      expect(metadata.find(m => m.id === '3')!.funds).toBe(3000);
      expect(metadata.find(m => m.id === 'auto')!.funds).toBe(4000);
    });

    it('should return null when loading from empty or deleted slot', () => {
      expect(loadFromSlot('empty')).toBeNull();
      saveToSlot('1', 'test', mockState);
      deleteSlot('1');
      expect(loadFromSlot('1')).toBeNull();
    });
  });

  describe('Migration Support', () => {
    it('should migrate old save format to slot 1 if empty', () => {
      const oldV2State = {
        funds: 2500,
        sprintCount: 5,
        agents: [],
        projects: [],
        completedProjectIds: ['p3'],
        unlockedAchievementIds: [],
        gameOver: false,
        history: []
      };

      // Set v2 save in localstorage manually
      localStorage.setItem('ai_manager_tycoon_save_v2', JSON.stringify(oldV2State));

      // Run migration
      const migrated = checkAndMigrateOldSave();
      expect(migrated).toBe(true);

      // Verify slot 1 has it
      const slot1 = loadFromSlot('1');
      expect(slot1).not.toBeNull();
      expect(slot1!.gameState.funds).toBe(2500);
      expect(slot1!.gameState.sprintCount).toBe(5);
      expect(slot1!.gameState.completedProjectIds).toEqual(['p3']);
    });

    it('should not overwrite slot 1 automatically if already occupied', () => {
      // Save something to slot 1
      saveToSlot('1', '已经占用的存档', mockState);

      const oldV2State = {
        funds: 2500,
        sprintCount: 5,
        agents: [],
        projects: [],
        completedProjectIds: ['p3'],
        unlockedAchievementIds: [],
        gameOver: false,
        history: []
      };

      localStorage.setItem('ai_manager_tycoon_save_v2', JSON.stringify(oldV2State));

      const migrated = checkAndMigrateOldSave();
      expect(migrated).toBe(false);

      // Verify slot 1 still has the original mockState
      const slot1 = loadFromSlot('1');
      expect(slot1!.gameState.funds).toBe(5000);
    });

    it('should auto migrate older version load format to version 7 format', () => {
      // Create a save with old version format
      const oldFormatSave = {
        version: 2,
        gameState: mockState,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem('ai_manager_tycoon_save_slot_1', JSON.stringify(oldFormatSave));

      const loaded = loadFromSlot('1');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
      expect(loaded!.skillTrees).toBeDefined();
      expect(loaded!.relationships).toBeDefined();
    });
  });

  describe('LocalStorage Fallback and Unavailable', () => {
    it('should seamlessly fallback to memory cache if localStorage is disabled or throws', () => {
      // Simulate localStorage throwing error (e.g. disabled or full)
      vi.stubGlobal('localStorage', {
        getItem: vi.fn(() => { throw new Error('SecurityError: The operation is insecure.') }),
        setItem: vi.fn(() => { throw new Error('QuotaExceededError') }),
        removeItem: vi.fn(() => { throw new Error('SecurityError') }),
      });
      resetStorageCheck();

      expect(isFallbackStorageActive()).toBe(true);

      // Now call saveToSlot. It should not throw since it falls back to memory!
      saveToSlot('1', '内存存档', mockState);

      // We should be able to load it back from slot!
      const loaded = loadFromSlot('1');
      expect(loaded).not.toBeNull();
      expect(loaded!.name).toBe('内存存档');
      expect(loaded!.gameState.funds).toBe(5000);

      // Check that metadata still returns the slot info
      const metadata = getSaveSlotsMetadata();
      const slot1Meta = metadata.find(m => m.id === '1')!;
      expect(slot1Meta).toBeDefined();
      expect(slot1Meta.name).toBe('内存存档');
    });
  });

  describe('v7 Save Compatibility and New Features', () => {
    it('should have SAVE_VERSION = 7 for v9', () => {
      expect(SAVE_VERSION).toBe(7);
    });

    it('should save and load v8 fields (quarterlyEvaluations, reputationScore, triggeredCheckpoints)', () => {
      const v8Extra = {
        quarterlyEvaluations: [{ quarterNumber: 1, achieved: true }],
        reputationScore: 42,
        triggeredCheckpoints: ['seed', 'angel-a'],
      };

      saveToSlot('2', 'v8存档', mockState, v8Extra);
      const loaded = loadFromSlot('2');

      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
      expect(loaded!.quarterlyEvaluations).toEqual(v8Extra.quarterlyEvaluations);
      expect(loaded!.reputationScore).toBe(42);
      expect(loaded!.triggeredCheckpoints).toEqual(v8Extra.triggeredCheckpoints);
    });

    it('should default reputationScore to 0 when not provided', () => {
      saveToSlot('3', '无额外字段', mockState);
      const loaded = loadFromSlot('3');
      expect(loaded!.reputationScore).toBe(0);
      expect(loaded!.quarterlyEvaluations).toEqual([]);
      expect(loaded!.triggeredCheckpoints).toEqual([]);
    });

    it('should migrate old v4 save to v7 with default v8/v9/v10 fields', () => {
      const oldV4Save = {
        version: 4,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        skillTrees: {},
        relationships: {},
        achievements: ['a1'],
        projectHistory: [],
      };

      localStorage.setItem('ai_manager_tycoon_save_slot_1', JSON.stringify(oldV4Save));

      const loaded = loadFromSlot('1');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
      expect(loaded!.quarterlyEvaluations).toEqual([]);
      expect(loaded!.reputationScore).toBe(0);
      expect(loaded!.triggeredCheckpoints).toEqual([]);
      // v9 fields should also be present
      expect(loaded!.teamDynamics).toBeDefined();
      expect(loaded!.performanceHistory).toBeDefined();
      expect(loaded!.strategyPreferences).toBeDefined();
    });

    it('should migrate old v2 structure to v7 with all default fields', () => {
      const oldV2Save = {
        version: 2,
        gameState: mockState,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem('ai_manager_tycoon_save_slot_2', JSON.stringify(oldV2Save));

      const loaded = loadFromSlot('2');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
      expect(loaded!.quarterlyEvaluations).toEqual([]);
      expect(loaded!.reputationScore).toBe(0);
      expect(loaded!.triggeredCheckpoints).toEqual([]);
      expect(loaded!.skillTrees).toBeDefined();
      expect(loaded!.relationships).toBeDefined();
      expect(loaded!.teamDynamics).toBeDefined();
      expect(loaded!.performanceHistory).toBeDefined();
      expect(loaded!.strategyPreferences).toBeDefined();
    });

    it('should preserve existing v4 fields after v7 migration', () => {
      const oldV4Save = {
        version: 4,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        skillTrees: { tree1: { unlocked: true } },
        relationships: { agent1: { trust: 80 } },
        achievements: ['first-blood', 'bug-factory'],
        projectHistory: [{ projectId: 'p1', completedAt: '2025-01-01' }],
      };

      localStorage.setItem('ai_manager_tycoon_save_slot_3', JSON.stringify(oldV4Save));

      const loaded = loadFromSlot('3');
      expect(loaded!.skillTrees).toEqual(oldV4Save.skillTrees);
      expect(loaded!.relationships).toEqual(oldV4Save.relationships);
      expect(loaded!.achievements).toEqual(oldV4Save.achievements);
      expect(loaded!.projectHistory).toEqual(oldV4Save.projectHistory);
    });
  });

  describe('v9 Save Migration and New Fields', () => {
    it('should save and load v9 fields (teamDynamics, performanceHistory, strategyPreferences)', () => {
      const v9Extra = {
        teamDynamics: { averageMorale: 75, totalFatigue: 30, averageLoyalty: 80 },
        performanceHistory: { bestSprintProgress: 25, worstSprintProgress: 5, averageSprintProgress: 15, totalBugsCreated: 12, totalBugsFixed: 8 },
        strategyPreferences: { 'aggressive': 3, 'balanced': 5 },
      };

      saveToSlot('2', 'v9存档', mockState, v9Extra);
      const loaded = loadFromSlot('2');

      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(SAVE_VERSION);
      expect(loaded!.teamDynamics).toEqual(v9Extra.teamDynamics);
      expect(loaded!.performanceHistory).toEqual(v9Extra.performanceHistory);
      expect(loaded!.strategyPreferences).toEqual(v9Extra.strategyPreferences);
    });

    it('should calculate teamDynamics from agents when not provided', () => {
      const stateWithAgents: GameState = {
        ...mockState,
        agents: [
          { id: 'a1', name: 'Alice', model: 'gpt-4', role: 'dev', avatar: '', skills: { coding: 80, debugging: 70, architecture: 60, creativity: 50, speed: 90 }, salary: 100, morale: 80, quirk: '', fatigue: 20, consecutiveSprints: 2, totalSprintsWorked: 5, locked: false },
          { id: 'a2', name: 'Bob', model: 'gpt-4', role: 'dev', avatar: '', skills: { coding: 70, debugging: 60, architecture: 80, creativity: 90, speed: 60 }, salary: 100, morale: 60, quirk: '', fatigue: 40, consecutiveSprints: 1, totalSprintsWorked: 3, locked: false },
        ],
      };

      saveToSlot('1', '有员工的存档', stateWithAgents);
      const loaded = loadFromSlot('1');

      expect(loaded!.teamDynamics).toBeDefined();
      expect(loaded!.teamDynamics!.averageMorale).toBe(70); // (80+60)/2
      expect(loaded!.teamDynamics!.totalFatigue).toBe(60); // 20+40
    });

    it('should calculate performanceHistory from history when not provided', () => {
      const stateWithHistory: GameState = {
        ...mockState,
        history: [
          { sprintNumber: 1, project: {} as any, agents: [], strategy: {} as any, progressDelta: 10, bugsDelta: 2, techDebtDelta: 1, moraleDelta: -5, cost: 500, incidents: [], summary: '' },
          { sprintNumber: 2, project: {} as any, agents: [], strategy: {} as any, progressDelta: 20, bugsDelta: -1, techDebtDelta: 0, moraleDelta: 3, cost: 600, incidents: [], summary: '' },
        ],
      };

      saveToSlot('1', '有历史的存档', stateWithHistory);
      const loaded = loadFromSlot('1');

      expect(loaded!.performanceHistory).toBeDefined();
      expect(loaded!.performanceHistory!.bestSprintProgress).toBe(20);
      expect(loaded!.performanceHistory!.worstSprintProgress).toBe(10);
      expect(loaded!.performanceHistory!.averageSprintProgress).toBe(15);
      expect(loaded!.performanceHistory!.totalBugsCreated).toBe(2); // only positive bugsDelta
    });

    it('should migrate v5 save to v7 with calculated v9 fields', () => {
      const oldV5Save = {
        version: 5,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        skillTrees: {},
        relationships: {},
        achievements: [],
        projectHistory: [],
        quarterlyEvaluations: [],
        reputationScore: 10,
        triggeredCheckpoints: ['seed'],
      };

      localStorage.setItem('ai_manager_tycoon_save_slot_1', JSON.stringify(oldV5Save));

      const loaded = loadFromSlot('1');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(7);
      expect(loaded!.teamDynamics).toBeDefined();
      expect(loaded!.teamDynamics!.averageMorale).toBe(0);
      expect(loaded!.performanceHistory).toBeDefined();
      expect(loaded!.strategyPreferences).toEqual({});
      // v5 fields preserved
      expect(loaded!.reputationScore).toBe(10);
      expect(loaded!.triggeredCheckpoints).toEqual(['seed']);
    });

    it('should migrate raw v2 GameState (no version wrapper) to v7', () => {
      const rawV2State = {
        funds: 3000,
        sprintCount: 7,
        agents: [],
        projects: [],
        completedProjectIds: ['p1'],
        unlockedAchievementIds: [],
        gameOver: false,
        history: [],
      };

      localStorage.setItem('ai_manager_tycoon_save_slot_2', JSON.stringify(rawV2State));

      const loaded = loadFromSlot('2');
      expect(loaded).not.toBeNull();
      expect(loaded!.version).toBe(7);
      expect(loaded!.gameState.funds).toBe(3000);
      expect(loaded!.gameState.sprintCount).toBe(7);
      expect(loaded!.teamDynamics).toBeDefined();
      expect(loaded!.performanceHistory).toBeDefined();
      expect(loaded!.strategyPreferences).toBeDefined();
    });
  });

  describe('Incremental Save', () => {
    it('should perform incremental save when data changes', () => {
      // Initial full save
      saveToSlot('1', '初始存档', mockState);

      // Modify state
      const updatedState = { ...mockState, funds: 6000, sprintCount: 4 };

      // Incremental save
      saveToSlot('1', '增量存档', updatedState, undefined, { incremental: true });

      const loaded = loadFromSlot('1');
      expect(loaded).not.toBeNull();
      expect(loaded!.gameState.funds).toBe(6000);
      expect(loaded!.gameState.sprintCount).toBe(4);
    });

    it('should skip save when no changes detected in incremental mode', () => {
      saveToSlot('1', '初始存档', mockState);

      // Reset the spy to only track calls from the incremental save
      vi.mocked(localStorage.setItem).mockClear();

      // Save again with same state in incremental mode
      saveToSlot('1', '相同存档', mockState, undefined, { incremental: true });

      // Should not have called setItem again (no changes detected)
      expect(localStorage.setItem).not.toHaveBeenCalled();
    });

    it('should include checksum in saved data', () => {
      saveToSlot('1', '校验和存档', mockState);

      const key = `ai_manager_tycoon_save_slot_1`;
      const saved = JSON.parse(localStorage.getItem(key)!);

      expect(saved.checksum).toBeDefined();
      expect(typeof saved.checksum).toBe('string');
    });

    it('should detect checksum mismatch and attempt recovery', () => {
      saveToSlot('1', '原始存档', mockState);

      // Corrupt the data
      const key = `ai_manager_tycoon_save_slot_1`;
      const saved = JSON.parse(localStorage.getItem(key)!);
      saved.gameState.funds = 99999;
      localStorage.setItem(key, JSON.stringify(saved));

      // Load should detect corruption
      const loaded = loadFromSlot('1');
      // Since there's no backup yet, it should still load but with warning
      expect(loaded).not.toBeNull();
    });
  });

  describe('Backup and Restore', () => {
    it('should create backup before overwriting', () => {
      saveToSlot('1', '原始存档', mockState);

      // Overwrite
      const updatedState = { ...mockState, funds: 6000 };
      saveToSlot('1', '覆盖存档', updatedState);

      // Restore from backup
      const restored = restoreFromBackup('1');
      expect(restored).toBe(true);

      const loaded = loadFromSlot('1');
      expect(loaded!.gameState.funds).toBe(5000);
      expect(loaded!.name).toBe('原始存档');
    });

    it('should return false when no backup exists', () => {
      const restored = restoreFromBackup('nonexistent');
      expect(restored).toBe(false);
    });

    it('should delete backup when slot is deleted', () => {
      saveToSlot('1', '测试存档', mockState);
      saveToSlot('1', '覆盖存档', { ...mockState, funds: 6000 });

      deleteSlot('1');

      const restored = restoreFromBackup('1');
      expect(restored).toBe(false);
    });
  });

  describe('Achievement Index', () => {
    it('should build achievement index from save data', () => {
      const stateWithAchievements = {
        ...mockState,
        unlockedAchievementIds: ['ach1', 'ach2', 'ach3'],
      };

      saveToSlot('1', '成就存档', stateWithAchievements);

      const index = getAchievementIndex('1');
      expect(index).not.toBeNull();
      expect(index!.count).toBe(3);
      expect(index!.unlockedIds.has('ach1')).toBe(true);
      expect(index!.unlockedIds.has('ach2')).toBe(true);
      expect(index!.unlockedIds.has('ach3')).toBe(true);
    });

    it('should check if achievement is unlocked', () => {
      const stateWithAchievements = {
        ...mockState,
        unlockedAchievementIds: ['ach1', 'ach2'],
      };

      saveToSlot('1', '成就存档', stateWithAchievements);

      expect(isAchievementUnlocked('1', 'ach1')).toBe(true);
      expect(isAchievementUnlocked('1', 'ach2')).toBe(true);
      expect(isAchievementUnlocked('1', 'ach3')).toBe(false);
    });

    it('should batch check achievements', () => {
      const stateWithAchievements = {
        ...mockState,
        unlockedAchievementIds: ['ach1', 'ach3'],
      };

      saveToSlot('1', '成就存档', stateWithAchievements);

      const results = batchCheckAchievements('1', ['ach1', 'ach2', 'ach3', 'ach4']);
      expect(results.get('ach1')).toBe(true);
      expect(results.get('ach2')).toBe(false);
      expect(results.get('ach3')).toBe(true);
      expect(results.get('ach4')).toBe(false);
    });

    it('should return null index for empty slot', () => {
      const index = getAchievementIndex('empty');
      expect(index).toBeNull();
    });
  });

  describe('Statistics Index', () => {
    it('should build statistics index from save data', () => {
      const stateWithHistory = {
        ...mockState,
        completedProjectIds: ['p1', 'p2', 'p3'],
        sprintCount: 10,
        history: [
          { sprintNumber: 1, project: {} as any, agents: [], strategy: {} as any, progressDelta: 10, bugsDelta: 2, techDebtDelta: 1, moraleDelta: -5, cost: 500, incidents: [], summary: '' },
          { sprintNumber: 2, project: {} as any, agents: [], strategy: {} as any, progressDelta: 20, bugsDelta: -1, techDebtDelta: 0, moraleDelta: 3, cost: 600, incidents: [], summary: '' },
        ],
        agents: [
          { id: 'a1', name: 'Alice', model: 'gpt-4', role: 'dev', avatar: '', skills: { coding: 80, debugging: 70, architecture: 60, creativity: 50, speed: 90 }, salary: 100, morale: 80, quirk: '', fatigue: 20, consecutiveSprints: 2, totalSprintsWorked: 10, locked: false },
          { id: 'a2', name: 'Bob', model: 'gpt-4', role: 'dev', avatar: '', skills: { coding: 70, debugging: 60, architecture: 80, creativity: 90, speed: 60 }, salary: 100, morale: 60, quirk: '', fatigue: 40, consecutiveSprints: 1, totalSprintsWorked: 5, locked: false },
        ],
      };

      saveToSlot('1', '统计存档', stateWithHistory);

      const index = getStatisticsIndex('1');
      expect(index).not.toBeNull();
      expect(index!.totalProjects).toBe(3);
      expect(index!.totalSprints).toBe(10);
      expect(index!.totalFundsSpent).toBe(1100); // 500 + 600
      expect(index!.averageProgress).toBe(15); // (10 + 20) / 2
      expect(index!.bugRate).toBe(0.2); // (2 + 0) / 10 (only positive bugsDelta)
      expect(index!.topAgents).toHaveLength(2);
      expect(index!.topAgents[0].name).toBe('Alice');
      expect(index!.topAgents[0].sprints).toBe(10);
    });

    it('should return null index for empty slot', () => {
      const index = getStatisticsIndex('empty');
      expect(index).toBeNull();
    });

    it('should rebuild indexes correctly', () => {
      saveToSlot('1', '测试存档', mockState);

      clearIndexCache();

      rebuildIndexes('1');

      const achIndex = getAchievementIndex('1');
      expect(achIndex).not.toBeNull();
      expect(achIndex!.count).toBe(1);

      const statIndex = getStatisticsIndex('1');
      expect(statIndex).not.toBeNull();
      expect(statIndex!.totalProjects).toBe(2);
    });
  });

  describe('Save Validation', () => {
    it('should validate a valid v7 save', () => {
      saveToSlot('1', '有效存档', mockState);
      const result = validateSlot('1');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null/empty data', () => {
      const result = validateSaveData(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-object data', () => {
      const result = validateSaveData('invalid');
      expect(result.valid).toBe(false);
    });

    it('should error on missing version', () => {
      const result = validateSaveData({ gameState: mockState });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少版本号字段');
    });

    it('should error on version too old', () => {
      const result = validateSaveData({ version: 1, gameState: mockState });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('过旧'))).toBe(true);
    });

    it('should warn on future version', () => {
      const result = validateSaveData({ version: 99, gameState: mockState, savedAt: new Date().toISOString() });
      expect(result.valid).toBe(true); // not an error, just a warning
      expect(result.warnings.some(w => w.includes('高于当前支持版本'))).toBe(true);
    });

    it('should error on missing gameState', () => {
      const result = validateSaveData({ version: 7 });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('缺少游戏状态数据');
    });

    it('should warn on missing optional gameState fields', () => {
      const result = validateSaveData({
        version: 7,
        gameState: { funds: 1000 },
        savedAt: new Date().toISOString(),
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should validate v5 quarterly fields format', () => {
      const result = validateSaveData({
        version: 5,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        quarterlyEvaluations: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('季度评估'))).toBe(true);
    });

    it('should validate v6 teamDynamics format', () => {
      const result = validateSaveData({
        version: 6,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        teamDynamics: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('团队动态'))).toBe(true);
    });

    it('should validate v6 strategyPreferences format', () => {
      const result = validateSaveData({
        version: 6,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        strategyPreferences: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('策略偏好'))).toBe(true);
    });

    it('should validate v7 delta format', () => {
      const result = validateSaveData({
        version: 7,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        delta: 'invalid',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('增量数据'))).toBe(true);
    });

    it('should return warnings for valid save with missing optional fields', () => {
      const result = validateSaveData({
        version: 7,
        gameState: mockState,
      });
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('保存时间戳'))).toBe(true);
    });

    it('should validate checksum when present', () => {
      const validData = {
        version: 7,
        gameState: mockState,
        savedAt: new Date().toISOString(),
        checksum: 'invalid_checksum',
      };
      const result = validateSaveData(validData);
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('校验和'))).toBe(true);
    });
  });
});
