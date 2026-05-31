import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  getSaveSlotsMetadata,
  getSlotDisplayName,
  MANUAL_SLOTS,
  AUTO_SLOT,
  SAVE_VERSION,
  validateSlot,
  restoreFromBackup,
  getAchievementIndex,
  getStatisticsIndex,
  isAchievementUnlocked,
  batchCheckAchievements,
  rebuildIndexes,
  clearIndexCache,
  resetStorageCheck,
  isFallbackStorageActive,
} from '../src/domain/saveSystem';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';

/**
 * saveApi.integration.test.ts — 黑盒集成测试
 *
 * 仅通过 saveSystem.ts 的公开 API 操作，不依赖内部实现。
 * Phase 4 拆分 saveSystem.ts 后，此文件应无需修改即可运行。
 */

function makeMinimalState(overrides: Partial<GameState> = {}): GameState {
  return {
    funds: 5000,
    sprintCount: 0,
    agents: [],
    projects: [],
    completedProjectIds: [],
    unlockedAchievementIds: [],
    gameOver: false,
    history: [],
    relations: [],
    reputation: 50,
    confidence: 50,
    ...overrides,
  };
}

describe('Save API — Full Lifecycle', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    });
    resetStorageCheck();
    clearIndexCache();
  });

  /* ─── Constants ─── */

  it('should export correct slot constants', () => {
    expect(MANUAL_SLOTS).toEqual(['1', '2', '3']);
    expect(AUTO_SLOT).toBe('auto');
    expect(SAVE_VERSION).toBe(7);
  });

  /* ─── Save → Load → Verify ─── */

  it('should save and load a complete state with all fields', () => {
    const state = makeMinimalState({
      funds: 9999,
      sprintCount: 5,
      completedProjectIds: ['p1', 'p2'],
      unlockedAchievementIds: ['ach1'],
      gameOver: false,
      reputation: 70,
      confidence: 60,
    });

    saveToSlot('1', 'full-test', state);
    const loaded = loadFromSlot('1');

    expect(loaded).not.toBeNull();
    expect(loaded!.name).toBe('full-test');
    expect(loaded!.version).toBe(SAVE_VERSION);
    expect(loaded!.gameState.funds).toBe(9999);
    expect(loaded!.gameState.sprintCount).toBe(5);
    expect(loaded!.gameState.completedProjectIds).toEqual(['p1', 'p2']);
    expect(loaded!.gameState.unlockedAchievementIds).toEqual(['ach1']);
    expect(loaded!.gameState.reputation).toBe(70);
    expect(loaded!.gameState.confidence).toBe(60);
  });

  /* ─── Slot isolation ─── */

  it('should keep all three manual slots and auto slot isolated', () => {
    const s1 = makeMinimalState({ funds: 1000, sprintCount: 1 });
    const s2 = makeMinimalState({ funds: 2000, sprintCount: 2 });
    const s3 = makeMinimalState({ funds: 3000, sprintCount: 3 });
    const sa = makeMinimalState({ funds: 4000, sprintCount: 4 });

    saveToSlot('1', 'slot-1', s1);
    saveToSlot('2', 'slot-2', s2);
    saveToSlot('3', 'slot-3', s3);
    saveToSlot('auto', 'auto-slot', sa);

    expect(loadFromSlot('1')!.gameState.funds).toBe(1000);
    expect(loadFromSlot('2')!.gameState.funds).toBe(2000);
    expect(loadFromSlot('3')!.gameState.funds).toBe(3000);
    expect(loadFromSlot('auto')!.gameState.funds).toBe(4000);
  });

  /* ─── Overwrite ─── */

  it('should overwrite existing slot with new data', () => {
    saveToSlot('1', 'original', makeMinimalState({ funds: 1000 }));
    expect(loadFromSlot('1')!.gameState.funds).toBe(1000);

    saveToSlot('1', 'updated', makeMinimalState({ funds: 8888 }));
    const loaded = loadFromSlot('1');
    expect(loaded!.name).toBe('updated');
    expect(loaded!.gameState.funds).toBe(8888);
  });

  /* ─── Delete ─── */

  it('should return null after slot is deleted', () => {
    saveToSlot('1', 'to-delete', makeMinimalState());
    expect(loadFromSlot('1')).not.toBeNull();

    deleteSlot('1');
    expect(loadFromSlot('1')).toBeNull();
  });

  it('should remove backup and indexes when slot is deleted', () => {
    saveToSlot('1', 'has-backup', makeMinimalState());
    saveToSlot('1', 'overwritten', makeMinimalState({ funds: 7777 }));

    // Should have backup + indexes before delete
    expect(restoreFromBackup('1')).toBe(true);

    deleteSlot('1');
    expect(restoreFromBackup('1')).toBe(false);
    expect(getAchievementIndex('1')).toBeNull();
    expect(getStatisticsIndex('1')).toBeNull();
  });

  /* ─── Load non-existent ─── */

  it('should return null for slots that were never saved', () => {
    expect(loadFromSlot('nonexistent')).toBeNull();
    expect(loadFromSlot('999')).toBeNull();
  });

  /* ─── Validate ─── */

  it('should validate a correctly saved slot', () => {
    saveToSlot('1', 'valid', makeMinimalState());
    const result = validateSlot('1');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should invalidate an empty slot', () => {
    const result = validateSlot('empty');
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('存档位为空');
  });

  /* ─── Metadata ─── */

  it('should update metadata through save/delete lifecycle', () => {
    expect(getSaveSlotsMetadata()).toHaveLength(0);

    saveToSlot('1', 'meta-1', makeMinimalState({ funds: 100, sprintCount: 2 }));
    let meta = getSaveSlotsMetadata();
    expect(meta).toHaveLength(1);
    expect(meta[0].id).toBe('1');
    expect(meta[0].funds).toBe(100);
    expect(meta[0].sprintCount).toBe(2);

    saveToSlot('2', 'meta-2', makeMinimalState({ funds: 200, sprintCount: 4 }));
    meta = getSaveSlotsMetadata();
    expect(meta).toHaveLength(2);

    deleteSlot('1');
    meta = getSaveSlotsMetadata();
    expect(meta).toHaveLength(1);
    expect(meta[0].id).toBe('2');
  });

  it('should include all slots in metadata after multiple saves', () => {
    ['1', '2', '3', 'auto'].forEach((id, i) => {
      saveToSlot(id, `slot-${id}`, makeMinimalState({ funds: (i + 1) * 1000 }));
    });

    const meta = getSaveSlotsMetadata();
    expect(meta).toHaveLength(4);
    expect(meta.find(m => m.id === 'auto')).toBeDefined();
    expect(meta.find(m => m.id === '1')!.funds).toBe(1000);
    expect(meta.find(m => m.id === '3')!.funds).toBe(3000);
  });

  /* ─── Backup / Restore ─── */

  it('should create backup on overwrite and allow restore', () => {
    saveToSlot('1', 'first', makeMinimalState({ funds: 1111 }));
    saveToSlot('1', 'second', makeMinimalState({ funds: 2222 }));

    expect(loadFromSlot('1')!.gameState.funds).toBe(2222);

    const restored = restoreFromBackup('1');
    expect(restored).toBe(true);

    expect(loadFromSlot('1')!.gameState.funds).toBe(1111);
    expect(loadFromSlot('1')!.name).toBe('first');
  });

  it('should return false when no backup exists', () => {
    expect(restoreFromBackup('nonexistent')).toBe(false);
  });

  /* ─── Indexes ─── */

  it('should build and retrieve achievement index', () => {
    const state = makeMinimalState({ unlockedAchievementIds: ['a1', 'a2', 'a3'] });
    saveToSlot('1', 'ach-test', state);

    const index = getAchievementIndex('1');
    expect(index).not.toBeNull();
    expect(index!.count).toBe(3);
    expect(index!.unlockedIds.has('a1')).toBe(true);
    expect(index!.unlockedIds.has('missing')).toBe(false);
  });

  it('should build and retrieve statistics index', () => {
    const state = makeMinimalState({
      completedProjectIds: ['p1'],
      sprintCount: 5,
      history: [
        { sprintNumber: 1, progressDelta: 10, cost: 100 } as SprintResult,
        { sprintNumber: 2, progressDelta: 20, cost: 200 } as SprintResult,
      ],
    });
    saveToSlot('1', 'stat-test', state);

    const index = getStatisticsIndex('1');
    expect(index).not.toBeNull();
    expect(index!.totalProjects).toBe(1);
    expect(index!.totalSprints).toBe(5);
    expect(index!.totalFundsSpent).toBe(300);
  });

  it('should check single and batch achievement unlock status', () => {
    const state = makeMinimalState({ unlockedAchievementIds: ['ach1', 'ach3'] });
    saveToSlot('1', 'unlock-test', state);

    expect(isAchievementUnlocked('1', 'ach1')).toBe(true);
    expect(isAchievementUnlocked('1', 'ach2')).toBe(false);
    expect(isAchievementUnlocked('1', 'ach3')).toBe(true);

    const batch = batchCheckAchievements('1', ['ach1', 'ach2', 'ach4']);
    expect(batch.get('ach1')).toBe(true);
    expect(batch.get('ach2')).toBe(false);
    expect(batch.get('ach4')).toBe(false);
  });

  it('should rebuild indexes after clear', () => {
    const state = makeMinimalState({ unlockedAchievementIds: ['a1'], completedProjectIds: ['p1'] });
    saveToSlot('1', 'rebuild-test', state);

    clearIndexCache();
    rebuildIndexes('1');

    const achIndex = getAchievementIndex('1');
    expect(achIndex).not.toBeNull();
    expect(achIndex!.count).toBe(1);

    const statIndex = getStatisticsIndex('1');
    expect(statIndex).not.toBeNull();
    expect(statIndex!.totalProjects).toBe(1);
  });

  it('should return null indexes for empty slots', () => {
    expect(getAchievementIndex('empty')).toBeNull();
    expect(getStatisticsIndex('empty')).toBeNull();
  });

  /* ─── getSlotDisplayName ─── */

  it('should return readable slot display names', () => {
    expect(getSlotDisplayName('auto')).toBe('自动存档');
    expect(getSlotDisplayName('1')).toBe('存档位 1');
    expect(getSlotDisplayName('auto', '我的存档')).toBe('我的存档');
    expect(getSlotDisplayName('1', 'Week 1')).toBe('Week 1');
  });

  /* ─── Storage fallback ─── */

  it('should report fallback active when localStorage throws', () => {
    expect(isFallbackStorageActive()).toBe(false);

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => { throw new Error('denied'); }),
      setItem: vi.fn(() => { throw new Error('denied'); }),
      removeItem: vi.fn(() => { throw new Error('denied'); }),
    });
    resetStorageCheck();

    expect(isFallbackStorageActive()).toBe(true);
  });

  it('should still save and load when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => { throw new Error('denied'); }),
      setItem: vi.fn(() => { throw new Error('denied'); }),
      removeItem: vi.fn(() => { throw new Error('denied'); }),
    });
    resetStorageCheck();

    saveToSlot('1', 'fallback', makeMinimalState({ funds: 1234 }));
    const loaded = loadFromSlot('1');
    expect(loaded).not.toBeNull();
    expect(loaded!.gameState.funds).toBe(1234);
    expect(loaded!.name).toBe('fallback');
  });
});

/* =====================================================
 * WS-103 P1: Scenario 2 — 保存后 load 仍保留 unlockedAchievementIds
 * (包括新 v9 成就)
 * ===================================================== */
describe('WS-103 P1: Achievement persistence across save/load (Scenario 2)', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: vi.fn((key: string) => { delete store[key]; }),
    });
    resetStorageCheck();
    clearIndexCache();
  });

  it('should preserve v9 achievement IDs after save and load', () => {
    const stateWithV9 = makeMinimalState({
      sprintCount: 22,
      unlockedAchievementIds: ['long-run-survivor', 'efficient-project'],
    });

    saveToSlot('1', 'v9-achievements', stateWithV9);
    const loaded = loadFromSlot('1');

    expect(loaded).not.toBeNull();
    expect(loaded!.gameState.unlockedAchievementIds).toEqual([
      'long-run-survivor',
      'efficient-project',
    ]);
  });

  it('should preserve mixed old and new achievement IDs after roundtrip', () => {
    const mixed = makeMinimalState({
      unlockedAchievementIds: ['first-blood', 'long-run-survivor', 'stable-team'],
    });

    saveToSlot('2', 'mixed-ach', mixed);
    const loaded = loadFromSlot('2');

    expect(loaded!.gameState.unlockedAchievementIds).toContain('long-run-survivor');
    expect(loaded!.gameState.unlockedAchievementIds).toContain('first-blood');
    expect(loaded!.gameState.unlockedAchievementIds).toHaveLength(3);
  });
});
