import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  getSaveSlotsMetadata,
  getAutosaveConfig,
  setAutosaveConfig,
  checkAndMigrateOldSave,
  SAVE_VERSION
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
      history: []
    };

    // Mock localStorage
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString() }),
      removeItem: vi.fn((key) => { delete store[key] }),
    });
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

    it('should auto migrate older version load format to version 4 format', () => {
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
});
