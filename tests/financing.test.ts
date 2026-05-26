import { describe, it, expect } from 'vitest';
import {
  getDefaultCheckpoints,
  getCheckpointsForQuarter,
  checkFinancingCheckpoint,
  evaluateQuarterCheckpoints,
} from '../src/domain/financing';
import type { GameState } from '../src/domain/gameState';
import type { CompanyRating } from '../src/domain/rating';

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 5000,
  sprintCount: 4,
  agents: [],
  projects: [],
  completedProjectIds: [],
  unlockedAchievementIds: [],
  gameOver: false,
  history: [],
  relations: [],
  ...overrides,
});

describe('getDefaultCheckpoints', () => {
  it('returns 6 preset checkpoints', () => {
    const checkpoints = getDefaultCheckpoints();
    expect(checkpoints).toHaveLength(6);
  });

  it('each checkpoint has required fields', () => {
    const checkpoints = getDefaultCheckpoints();
    for (const cp of checkpoints) {
      expect(cp.id).toBeTruthy();
      expect(cp.quarterNumber).toBeGreaterThan(0);
      expect(cp.baseReward).toBeGreaterThan(0);
      expect(cp.description).toBeTruthy();
      expect(cp.condition).toHaveProperty('type');
      expect(cp.condition).toHaveProperty('threshold');
    }
  });

  it('checkpoints are ordered by quarter', () => {
    const checkpoints = getDefaultCheckpoints();
    for (let i = 1; i < checkpoints.length; i++) {
      expect(checkpoints[i].quarterNumber).toBeGreaterThanOrEqual(checkpoints[i - 1].quarterNumber);
    }
  });

  it('seed checkpoint requires 1 completed project', () => {
    const seed = getDefaultCheckpoints().find(c => c.id === 'seed')!;
    expect(seed.condition).toEqual({ type: 'min_completed_projects', threshold: 1 });
    expect(seed.baseReward).toBe(3000);
  });

  it('series-c checkpoint requires rating A (65)', () => {
    const seriesC = getDefaultCheckpoints().find(c => c.id === 'series-c')!;
    expect(seriesC.condition).toEqual({ type: 'min_rating', threshold: 65 });
    expect(seriesC.baseReward).toBe(20000);
  });
});

describe('getCheckpointsForQuarter', () => {
  it('returns checkpoints for the given quarter', () => {
    const all = getDefaultCheckpoints();
    const q1 = getCheckpointsForQuarter(all, 1);
    expect(q1).toHaveLength(1);
    expect(q1[0].id).toBe('seed');

    const q4 = getCheckpointsForQuarter(all, 4);
    expect(q4).toHaveLength(1);
    expect(q4[0].id).toBe('series-a');
  });

  it('returns empty array when no checkpoint for quarter', () => {
    const result = getCheckpointsForQuarter(getDefaultCheckpoints(), 99);
    expect(result).toHaveLength(0);
  });
});

describe('checkFinancingCheckpoint', () => {
  describe('min_completed_projects condition', () => {
    it('triggers when completed projects meet threshold', () => {
      const state = makeState({ completedProjectIds: ['p1', 'p2'] });
      const seed = getDefaultCheckpoints().find(c => c.id === 'seed')!;
      const result = checkFinancingCheckpoint(seed, state, 0);
      expect(result.triggered).toBe(true);
      expect(result.reward).toBe(3000);
    });

    it('does not trigger when completed projects are below threshold', () => {
      const state = makeState({ completedProjectIds: [] });
      const seed = getDefaultCheckpoints().find(c => c.id === 'seed')!;
      const result = checkFinancingCheckpoint(seed, state, 0);
      expect(result.triggered).toBe(false);
      expect(result.reward).toBe(0);
    });
  });

  describe('min_funds condition', () => {
    it('triggers when funds meet threshold', () => {
      const angelA = getDefaultCheckpoints().find(c => c.id === 'angel-a')!;
      const state = makeState({ funds: 2000 });
      const result = checkFinancingCheckpoint(angelA, state, 0);
      expect(result.triggered).toBe(true);
      expect(result.reward).toBe(4000);
    });

    it('does not trigger when funds are below threshold', () => {
      const angelA = getDefaultCheckpoints().find(c => c.id === 'angel-a')!;
      const state = makeState({ funds: 1999 });
      const result = checkFinancingCheckpoint(angelA, state, 0);
      expect(result.triggered).toBe(false);
      expect(result.reward).toBe(0);
    });
  });

  describe('min_reputation condition', () => {
    it('triggers when reputation score meets threshold', () => {
      const seriesA = getDefaultCheckpoints().find(c => c.id === 'series-a')!;
      const result = checkFinancingCheckpoint(seriesA, makeState(), 20);
      expect(result.triggered).toBe(true);
      expect(result.reward).toBe(8000);
    });

    it('does not trigger when reputation is below threshold', () => {
      const seriesA = getDefaultCheckpoints().find(c => c.id === 'series-a')!;
      const result = checkFinancingCheckpoint(seriesA, makeState(), 19);
      expect(result.triggered).toBe(false);
      expect(result.reward).toBe(0);
    });
  });

  describe('min_rating condition', () => {
    it('triggers when company rating meets threshold (A rating = 65)', () => {
      const seriesC = getDefaultCheckpoints().find(c => c.id === 'series-c')!;
      const result = checkFinancingCheckpoint(seriesC, makeState(), 0, 'A' as CompanyRating);
      expect(result.triggered).toBe(true);
      expect(result.reward).toBe(20000);
    });

    it('does not trigger when rating is below threshold (B rating = 50)', () => {
      const seriesC = getDefaultCheckpoints().find(c => c.id === 'series-c')!;
      const result = checkFinancingCheckpoint(seriesC, makeState(), 0, 'B' as CompanyRating);
      expect(result.triggered).toBe(false);
      expect(result.reward).toBe(0);
    });

    it('handles undefined rating as score 0', () => {
      const seriesC = getDefaultCheckpoints().find(c => c.id === 'series-c')!;
      const result = checkFinancingCheckpoint(seriesC, makeState(), 0, undefined);
      expect(result.triggered).toBe(false);
    });
  });
});

describe('evaluateQuarterCheckpoints', () => {
  it('evaluates all checkpoints for the given set', () => {
    const all = getDefaultCheckpoints();
    const state = makeState({
      funds: 5000,
      completedProjectIds: ['p1', 'p2', 'p3', 'p4'],
    });
    const results = evaluateQuarterCheckpoints(all, state, 50, 'S' as CompanyRating);

    expect(results).toHaveLength(6);
    const triggered = results.filter(r => r.triggered);
    expect(triggered.length).toBeGreaterThan(0);
  });

  it('returns triggered=false with 0 reward for all when nothing meets conditions', () => {
    const poorState = makeState({
      funds: 0,
      completedProjectIds: [],
      sprintCount: 0,
    });
    const all = getDefaultCheckpoints();
    const results = evaluateQuarterCheckpoints(all, poorState, -100, 'F' as CompanyRating);

    for (const r of results) {
      expect(r.triggered).toBe(false);
      expect(r.reward).toBe(0);
    }
  });
});
