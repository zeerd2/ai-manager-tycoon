import { describe, it, expect } from 'vitest';
import { strategies } from '../src/data/strategies';
import type { Strategy } from '../src/domain/strategy';

describe('Strategy Config and Structure', () => {
  it('should have correct structure and valid properties for all defined strategies (normal)', () => {
    expect(strategies.length).toBeGreaterThan(0);

    for (const strategy of strategies) {
      expect(strategy.id).toBeTypeOf('string');
      expect(strategy.name).toBeTypeOf('string');
      expect(strategy.description).toBeTypeOf('string');
      expect(strategy.modifiers).toBeTypeOf('object');

      expect(strategy.modifiers.progressMul).toBeTypeOf('number');
      expect(strategy.modifiers.bugMul).toBeTypeOf('number');
      expect(strategy.modifiers.techDebtMul).toBeTypeOf('number');
      expect(strategy.modifiers.moraleDelta).toBeTypeOf('number');
      expect(strategy.modifiers.incidentChanceMul).toBeTypeOf('number');
    }
  });

  it('should have modifiers within reasonable bounds (boundary conditions)', () => {
    for (const strategy of strategies) {
      // progress multiplier should be positive and not ridiculously high
      expect(strategy.modifiers.progressMul).toBeGreaterThanOrEqual(0);
      expect(strategy.modifiers.progressMul).toBeLessThanOrEqual(5);

      // bug multiplier should be non-negative
      expect(strategy.modifiers.bugMul).toBeGreaterThanOrEqual(0);

      // incident chance multiplier should be non-negative
      expect(strategy.modifiers.incidentChanceMul).toBeGreaterThanOrEqual(0);

      // morale delta should be within a normal range
      expect(strategy.modifiers.moraleDelta).toBeGreaterThanOrEqual(-15);
      expect(strategy.modifiers.moraleDelta).toBeLessThanOrEqual(15);
    }
  });

  it('supports finding a strategy by ID and returns undefined for unknown IDs (exception/lookup)', () => {
    const findStrategyById = (id: string): Strategy | undefined => {
      return strategies.find(s => s.id === id);
    };

    // Valid search
    const moveFast = findStrategyById('move-fast');
    expect(moveFast).toBeDefined();
    expect(moveFast?.name).toBe('先冲再说');

    // Invalid search
    const invalidStrategy = findStrategyById('non-existent-id');
    expect(invalidStrategy).toBeUndefined();
  });
});
