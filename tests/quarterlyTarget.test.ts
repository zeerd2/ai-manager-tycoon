import { describe, it, expect } from 'vitest';
import {
  SPRINTS_PER_QUARTER,
  generateQuarterTarget,
  getQuarterNumber,
  isQuarterEnd,
  evaluateQuarterTarget,
  type QuarterTarget,
} from '../src/domain/quarterlyTarget';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';

const EMPTY_HISTORY: SprintResult[] = [];

const makeBaseState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 5000,
  sprintCount: 4,
  agents: [],
  projects: [],
  completedProjectIds: ['p1'],
  unlockedAchievementIds: [],
  gameOver: false,
  history: EMPTY_HISTORY,
  relations: [],
  ...overrides,
});

describe('getQuarterNumber', () => {
  it('returns 1 for sprintCount <= 0', () => {
    expect(getQuarterNumber(0)).toBe(1);
    expect(getQuarterNumber(-1)).toBe(1);
  });

  it('returns 1 for sprints 1-4', () => {
    expect(getQuarterNumber(1)).toBe(1);
    expect(getQuarterNumber(4)).toBe(1);
  });

  it('returns 2 for sprints 5-8', () => {
    expect(getQuarterNumber(5)).toBe(2);
    expect(getQuarterNumber(8)).toBe(2);
  });

  it('returns 3 for sprint 9', () => {
    expect(getQuarterNumber(9)).toBe(3);
  });
});

describe('isQuarterEnd', () => {
  it('returns true when sprintCount is a multiple of SPRINTS_PER_QUARTER', () => {
    expect(isQuarterEnd(SPRINTS_PER_QUARTER)).toBe(true);
    expect(isQuarterEnd(SPRINTS_PER_QUARTER * 2)).toBe(true);
    expect(isQuarterEnd(SPRINTS_PER_QUARTER * 3)).toBe(true);
  });

  it('returns false for non-multiples', () => {
    expect(isQuarterEnd(1)).toBe(false);
    expect(isQuarterEnd(3)).toBe(false);
    expect(isQuarterEnd(5)).toBe(false);
  });

  it('returns false for sprintCount 0', () => {
    expect(isQuarterEnd(0)).toBe(false);
  });
});

describe('generateQuarterTarget', () => {
  it('generates a target with a known type and threshold for quarter 1', () => {
    const target = generateQuarterTarget(1);
    expect(target).toHaveProperty('type');
    expect(target).toHaveProperty('threshold');
    expect(target).toHaveProperty('description');
    expect(target.threshold).toBeGreaterThan(0);
  });

  it('generates complete_projects target with threshold 1 for quarter 1', () => {
    const target = generateQuarterTarget(1);
    expect(target.type).toBe('complete_projects');
    expect(target.threshold).toBe(1);
  });

  it('generates earn_funds target for quarter 2', () => {
    const target = generateQuarterTarget(2);
    expect(target.type).toBe('earn_funds');
    expect(target.threshold).toBe(1500); // 1000 + (2-1)*500
  });

  it('generates control_bugs target for quarter 3', () => {
    const target = generateQuarterTarget(3);
    expect(target.type).toBe('control_bugs');
    expect(target.threshold).toBe(11); // max(5, 15-(3-1)*2)
  });

  it('generates achieve_rating target for quarter 4', () => {
    const target = generateQuarterTarget(4);
    expect(target.type).toBe('achieve_rating');
    expect(target.threshold).toBe(70); // max(20, 100-(4-1)*10)
  });

  it('generates complete_sprints target for quarter 5', () => {
    const target = generateQuarterTarget(5);
    expect(target.type).toBe('complete_sprints');
    expect(target.threshold).toBe(SPRINTS_PER_QUARTER);
  });

  it('cycles types after 5 quarters', () => {
    const q1 = generateQuarterTarget(1);
    const q6 = generateQuarterTarget(6);
    expect(q6.type).toBe(q1.type);
  });

  it('increases complete_projects threshold every 2 quarters, capped at 4', () => {
    const q1 = generateQuarterTarget(1);
    expect(q1.threshold).toBe(1);

    // Q6 is the next complete_projects cycle (6 ≡ 1 mod 5)
    const q6 = generateQuarterTarget(6);
    expect(q6.threshold).toBe(3); // floor((6-1)/2) + 1 = 3

    const q11 = generateQuarterTarget(11);
    expect(q11.threshold).toBe(4); // capped
  });

  it('caps complete_projects threshold at 4', () => {
    // Q11 and Q21 are complete_projects cycles (both ≡ 1 mod 5)
    // uncapped would be 6 and 11 respectively → both capped to 4
    const q11 = generateQuarterTarget(11);
    expect(q11.type).toBe('complete_projects');
    expect(q11.threshold).toBe(4);

    const q21 = generateQuarterTarget(21);
    expect(q21.type).toBe('complete_projects');
    expect(q21.threshold).toBe(4);
  });
});

describe('evaluateQuarterTarget', () => {
  it('returns achieved=true when complete_projects target is met', () => {
    const target: QuarterTarget = { type: 'complete_projects', description: '完成项目', threshold: 1 };
    const state = makeBaseState({
      sprintCount: 4,
      completedProjectIds: ['p1'],
      history: [
        {
          sprintNumber: 1,
          project: { id: 'p1', maxProgress: 100, progress: 100 } as SprintResult['project'],
          bugsDelta: 0,
          techDebtDelta: 0,
        } as SprintResult,
      ],
    });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(true);
    expect(result.quarterNumber).toBe(1);
  });

  it('returns achieved=false when complete_projects target is not met', () => {
    const target: QuarterTarget = { type: 'complete_projects', description: '完成项目', threshold: 3 };
    const state = makeBaseState({
      sprintCount: 4,
      completedProjectIds: ['p1'],
    });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(false);
    expect(result.actualValue).toBeLessThan(target.threshold);
  });

  it('returns achieved=true for complete_sprints target (always met)', () => {
    const target: QuarterTarget = { type: 'complete_sprints', description: '完成 Sprint', threshold: 4 };
    const state = makeBaseState({ sprintCount: 5 });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(true);
  });

  it('returns achieved=true for earn_funds when funds >= threshold', () => {
    const target: QuarterTarget = { type: 'earn_funds', description: '获得资金', threshold: 3000 };
    const state = makeBaseState({ funds: 5000 });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(true);
    expect(result.actualValue).toBe(5000);
  });

  it('returns achieved=false for earn_funds when funds < threshold', () => {
    const target: QuarterTarget = { type: 'earn_funds', description: '获得资金', threshold: 10000 };
    const state = makeBaseState({ funds: 500 });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(false);
  });

  it('returns achieved=true for control_bugs when bugs <= threshold', () => {
    const target: QuarterTarget = { type: 'control_bugs', description: '控制 Bug', threshold: 10 };
    const state = makeBaseState({ history: [] });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(true);
  });

  it('returns achieved=false for control_bugs when bugs exceed threshold', () => {
    const target: QuarterTarget = { type: 'control_bugs', description: '控制 Bug', threshold: 5 };
    const state = makeBaseState({
      history: [
        { sprintNumber: 1, bugsDelta: 8, techDebtDelta: 0 } as SprintResult,
        { sprintNumber: 2, bugsDelta: 3, techDebtDelta: 0 } as SprintResult,
      ],
    });
    const result = evaluateQuarterTarget(target, state);
    expect(result.achieved).toBe(false);
    expect(result.actualValue).toBeGreaterThan(target.threshold);
  });

  it('returns correct quarterNumber based on sprintCount', () => {
    const target: QuarterTarget = { type: 'complete_sprints', description: '完成 Sprint', threshold: 4 };
    const state = makeBaseState({ sprintCount: 9 });
    const result = evaluateQuarterTarget(target, state);
    expect(result.quarterNumber).toBe(3);
  });
});
