import { describe, it, expect } from 'vitest';
import {
  generateQuarterTarget,
  getQuarterNumber,
  isQuarterEnd,
  evaluateQuarterTarget,
  SPRINTS_PER_QUARTER,
  type QuarterTarget,
} from '../src/domain/quarterlyTarget';
import {
  calculateReputationDelta,
  calculateNewReputation,
  getReputationLevel,
  getReputationLabel,
  summarizeReputationFactors,
  MIN_REPUTATION,
  MAX_REPUTATION,
  DEFAULT_IMPACT,
} from '../src/domain/reputation';
import {
  getDefaultCheckpoints,
  getCheckpointsForQuarter,
  checkFinancingCheckpoint,
  evaluateQuarterCheckpoints,
} from '../src/domain/financing';
import { calculateRating } from '../src/domain/rating';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';
import type { CompanyRating } from '../src/domain/rating';

// ─── Helpers ───

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
  reputation: 50,
  confidence: 50,
  ...overrides,
});

const makeSprintResult = (overrides: Partial<SprintResult> = {}): SprintResult => ({
  sprintNumber: 1,
  project: { id: 'p1', name: 'P1', maxProgress: 100, progress: 30 } as SprintResult['project'],
  agents: [],
  strategy: { id: 's1', name: 'S1', description: 'D1', modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 } },
  progressDelta: 30,
  bugsDelta: 0,
  techDebtDelta: 0,
  moraleDelta: 0,
  cost: 100,
  incidents: [],
  summary: 'Test',
  ...overrides,
});

// ─── Integration: Quarterly KPI → Reputation → Financing ───

describe('Integration: Quarterly KPI pass/fail drives reputation which gates financing', () => {
  const checkpoints = getDefaultCheckpoints();
  const seriesA = checkpoints.find(c => c.id === 'series-a')!; // needs reputation >= 20

  it('KPI pass (+10 rep) can unlock series-a financing checkpoint', () => {
    // Start at reputation 12 — below the 20 threshold
    const state = makeState({ reputation: 12, funds: 5000, completedProjectIds: ['p1'] });

    // Simulate KPI pass: reputation goes from 12 → 22
    const sprintResult = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });
    const repDelta = calculateReputationDelta(sprintResult, true);
    const newRep = calculateNewReputation(12, sprintResult, true);

    // Reputation after project completion bonus
    expect(newRep).toBe(27); // 12 + 15

    // Now financing should trigger
    const finResult = checkFinancingCheckpoint(seriesA, state, newRep);
    expect(finResult.triggered).toBe(true);
    expect(finResult.reward).toBe(8000);
  });

  it('KPI fail (-15 rep) can block series-a financing checkpoint', () => {
    // Start at reputation 30 — above the 20 threshold
    const state = makeState({ reputation: 30, funds: 5000 });

    // Simulate heavy bugs causing reputation drop
    const sprintResult = makeSprintResult({ bugsDelta: 10, techDebtDelta: 5 });
    const newRep = calculateNewReputation(30, sprintResult, false);

    expect(newRep).toBe(5); // 30 + (10*-2 + 5*-1) = 30 - 25 = 5

    // Financing should NOT trigger
    const finResult = checkFinancingCheckpoint(seriesA, state, newRep);
    expect(finResult.triggered).toBe(false);
    expect(finResult.reward).toBe(0);
  });
});

// ─── Integration: Reputation level changes gate financing tiers ───

describe('Integration: Reputation level progression and financing tier access', () => {
  const checkpoints = getDefaultCheckpoints();

  it('reputation progression from very_low to very_high unlocks sequential financing tiers', () => {
    const state = makeState({ funds: 5000, completedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] });

    // very_low reputation — series-a (needs 20) should not trigger
    const r1 = checkFinancingCheckpoint(
      checkpoints.find(c => c.id === 'series-a')!, state, -80,
    );
    expect(r1.triggered).toBe(false);
    expect(getReputationLevel(-80)).toBe('very_low');

    // medium reputation — still below 20, series-a does NOT trigger
    const r2 = checkFinancingCheckpoint(
      checkpoints.find(c => c.id === 'series-a')!, state, 0,
    );
    expect(r2.triggered).toBe(false);
    expect(getReputationLevel(0)).toBe('medium');

    // high reputation — series-a triggers
    const r2b = checkFinancingCheckpoint(
      checkpoints.find(c => c.id === 'series-a')!, state, 25,
    );
    expect(r2b.triggered).toBe(true);

    // high reputation — still triggers
    const r3 = checkFinancingCheckpoint(
      checkpoints.find(c => c.id === 'series-a')!, state, 40,
    );
    expect(r3.triggered).toBe(true);
    expect(getReputationLevel(40)).toBe('high');
  });

  it('reputation label matches level for UI display consistency', () => {
    expect(getReputationLabel(80)).toBe(getReputationLabel(MAX_REPUTATION));
    expect(getReputationLevel(80)).toBe('very_high');

    expect(getReputationLabel(-80)).toBe(getReputationLabel(MIN_REPUTATION));
    expect(getReputationLevel(-80)).toBe('very_low');
  });
});

// ─── Integration: Quarterly target evaluation with financing checkpoints ───

describe('Integration: Quarterly target and financing checkpoint evaluated at quarter end', () => {
  it('quarter 1 end: complete_projects target + seed financing checkpoint both evaluate', () => {
    const q1Target = generateQuarterTarget(1);
    expect(q1Target.type).toBe('complete_projects');

    const state = makeState({
      sprintCount: SPRINTS_PER_QUARTER,
      completedProjectIds: ['p1'],
      history: [
        { sprintNumber: 1, project: { id: 'p1', maxProgress: 100, progress: 100 }, bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
      ],
    });

    // Quarterly target evaluation
    const targetResult = evaluateQuarterTarget(q1Target, state);
    expect(targetResult.achieved).toBe(true);

    // Financing checkpoint evaluation (seed = Q1)
    const allCheckpoints = getDefaultCheckpoints();
    const q1Checkpoints = getCheckpointsForQuarter(allCheckpoints, 1);
    expect(q1Checkpoints).toHaveLength(1);
    expect(q1Checkpoints[0].id).toBe('seed');

    const finResult = checkFinancingCheckpoint(q1Checkpoints[0], state, 0);
    expect(finResult.triggered).toBe(true);
    expect(finResult.reward).toBe(3000);
  });

  it('quarter 2 end: earn_funds target + angel-a checkpoint evaluate together', () => {
    const q2Target = generateQuarterTarget(2);
    expect(q2Target.type).toBe('earn_funds');
    expect(q2Target.threshold).toBe(1500);

    const state = makeState({
      sprintCount: SPRINTS_PER_QUARTER * 2,
      funds: 2000,
    });

    // Target evaluation
    const targetResult = evaluateQuarterTarget(q2Target, state);
    expect(targetResult.achieved).toBe(true);
    expect(targetResult.actualValue).toBe(2000);

    // Financing checkpoint
    const q2Checkpoints = getCheckpointsForQuarter(getDefaultCheckpoints(), 2);
    expect(q2Checkpoints[0].id).toBe('angel-a');

    const finResult = checkFinancingCheckpoint(q2Checkpoints[0], state, 0);
    expect(finResult.triggered).toBe(true);
    expect(finResult.reward).toBe(4000);
  });

  it('quarter 4 end: achieve_rating target + series-a checkpoint (needs reputation)', () => {
    const q4Target = generateQuarterTarget(4);
    expect(q4Target.type).toBe('achieve_rating');

    const state = makeState({
      sprintCount: SPRINTS_PER_QUARTER * 4,
      funds: 10000,
      completedProjectIds: ['p1', 'p2', 'p3'],
    });

    // Target evaluation
    const targetResult = evaluateQuarterTarget(q4Target, state);
    expect(targetResult.quarterNumber).toBe(4);

    // Financing: series-a needs reputation >= 20
    const q4Checkpoints = getCheckpointsForQuarter(getDefaultCheckpoints(), 4);
    expect(q4Checkpoints[0].id).toBe('series-a');

    // With high reputation
    const finHigh = checkFinancingCheckpoint(q4Checkpoints[0], state, 25);
    expect(finHigh.triggered).toBe(true);

    // With low reputation
    const finLow = checkFinancingCheckpoint(q4Checkpoints[0], state, 15);
    expect(finLow.triggered).toBe(false);
  });
});

// ─── Integration: Reputation clamping in full game loop ───

describe('Integration: Reputation clamping boundaries during game progression', () => {
  it('reputation cannot exceed MAX_REPUTATION even with multiple project completions', () => {
    let rep = 90;
    const result = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });

    // Each completion adds 15
    rep = calculateNewReputation(rep, result, true);
    expect(rep).toBe(MAX_REPUTATION); // 90 + 15 = 105 → clamped to 100

    // Further completions stay at max
    rep = calculateNewReputation(rep, result, true);
    expect(rep).toBe(MAX_REPUTATION);
  });

  it('reputation cannot drop below MIN_REPUTATION even with massive bugs', () => {
    let rep = -90;
    const result = makeSprintResult({ bugsDelta: 50, techDebtDelta: 50 });

    rep = calculateNewReputation(rep, result, false);
    expect(rep).toBe(MIN_REPUTATION); // -90 + (50*-2 + 50*-1) = -90 - 150 = -240 → clamped to -100
  });

  it('reputation oscillates correctly through a multi-sprint game', () => {
    let rep = 50;

    // Sprint 1: good sprint, project completed
    const goodSprint = makeSprintResult({ bugsDelta: 0, techDebtDelta: 0 });
    rep = calculateNewReputation(rep, goodSprint, true);
    expect(rep).toBe(65); // 50 + 15

    // Sprint 2: bad sprint, no completion
    const badSprint = makeSprintResult({ bugsDelta: 8, techDebtDelta: 4 });
    rep = calculateNewReputation(rep, badSprint, false);
    expect(rep).toBe(45); // 65 + (8*-2 + 4*-1) = 65 - 20 = 45

    // Sprint 3: another good sprint
    rep = calculateNewReputation(rep, goodSprint, true);
    expect(rep).toBe(60); // 45 + 15

    expect(getReputationLevel(rep)).toBe('very_high');
  });
});

// ─── Integration: Rating system feeds into financing ───

describe('Integration: Company rating calculation feeds into financing series-c checkpoint', () => {
  const seriesC = getDefaultCheckpoints().find(c => c.id === 'series-c')!;

  it('high-performing company gets S rating and unlocks series-c', () => {
    const ratingResult = calculateRating({
      completedProjects: 8,
      totalBugs: 2,
      totalTechDebt: 1,
      totalSprintsCost: 3000,
      fundsRemaining: 15000,
      sprintCount: 12,
    });

    expect(ratingResult.rating).toBe('S');

    const state = makeState({ funds: 15000 });
    const finResult = checkFinancingCheckpoint(seriesC, state, 0, ratingResult.rating);
    expect(finResult.triggered).toBe(true);
    expect(finResult.reward).toBe(20000);
  });

  it('low-performing company gets D/F rating and cannot unlock series-c', () => {
    const ratingResult = calculateRating({
      completedProjects: 1,
      totalBugs: 30,
      totalTechDebt: 20,
      totalSprintsCost: 5000,
      fundsRemaining: 500,
      sprintCount: 10,
    });

    expect(ratingResult.rating).toBe('F');

    const state = makeState({ funds: 500 });
    const finResult = checkFinancingCheckpoint(seriesC, state, 0, ratingResult.rating);
    expect(finResult.triggered).toBe(false);
  });

  it('B rating (score 50) is below series-c threshold (65)', () => {
    const state = makeState();
    const finResult = checkFinancingCheckpoint(seriesC, state, 0, 'B' as CompanyRating);
    expect(finResult.triggered).toBe(false);
  });

  it('A rating (score 65) exactly meets series-c threshold', () => {
    const state = makeState();
    const finResult = checkFinancingCheckpoint(seriesC, state, 0, 'A' as CompanyRating);
    expect(finResult.triggered).toBe(true);
    expect(finResult.reward).toBe(20000);
  });
});

// ─── Integration: evaluateQuarterCheckpoints batch evaluation ───

describe('Integration: Batch checkpoint evaluation across multiple conditions', () => {
  it('all checkpoints evaluated; only qualifying ones return rewards', () => {
    const allCheckpoints = getDefaultCheckpoints();
    const state = makeState({
      funds: 3000,
      completedProjectIds: ['p1'],
    });

    const results = evaluateQuarterCheckpoints(allCheckpoints, state, 25, 'A' as CompanyRating);

    // seed: completedProjects(1) >= 1 → triggered
    expect(results.find(r => r.checkpoint.id === 'seed')!.triggered).toBe(true);

    // angel-a: funds(3000) >= 2000 → triggered
    expect(results.find(r => r.checkpoint.id === 'angel-a')!.triggered).toBe(true);

    // angel-b: completedProjects(1) >= 3 → NOT triggered
    expect(results.find(r => r.checkpoint.id === 'angel-b')!.triggered).toBe(false);

    // series-a: reputation(25) >= 20 → triggered
    expect(results.find(r => r.checkpoint.id === 'series-a')!.triggered).toBe(true);

    // series-b: completedProjects(1) >= 6 → NOT triggered
    expect(results.find(r => r.checkpoint.id === 'series-b')!.triggered).toBe(false);

    // series-c: rating A (65) >= 65 → triggered
    expect(results.find(r => r.checkpoint.id === 'series-c')!.triggered).toBe(true);

    // Total reward from triggered checkpoints
    const totalReward = results.filter(r => r.triggered).reduce((s, r) => s + r.reward, 0);
    expect(totalReward).toBe(3000 + 4000 + 8000 + 20000);
  });

  it('poor state triggers zero checkpoints', () => {
    const allCheckpoints = getDefaultCheckpoints();
    const state = makeState({ funds: 0, completedProjectIds: [], sprintCount: 0 });

    const results = evaluateQuarterCheckpoints(allCheckpoints, state, -100, 'F' as CompanyRating);

    for (const r of results) {
      expect(r.triggered).toBe(false);
      expect(r.reward).toBe(0);
    }
  });
});

// ─── Integration: Quarterly target difficulty scaling ───

describe('Integration: Quarterly target difficulty scales across game progression', () => {
  it('complete_projects threshold increases every 2 quarters then caps', () => {
    const q1 = generateQuarterTarget(1);
    const q6 = generateQuarterTarget(6);
    const q11 = generateQuarterTarget(11);
    const q21 = generateQuarterTarget(21);

    expect(q1.threshold).toBe(1);
    expect(q6.threshold).toBe(3);
    expect(q11.threshold).toBe(4); // capped
    expect(q21.threshold).toBe(4); // still capped
  });

  it('earn_funds threshold increases linearly', () => {
    const q2 = generateQuarterTarget(2);
    const q7 = generateQuarterTarget(7);

    expect(q2.threshold).toBe(1500);
    expect(q7.threshold).toBe(4000); // 1000 + (7-1)*500
  });

  it('control_bugs threshold decreases then floors at 5', () => {
    const q3 = generateQuarterTarget(3);
    const q8 = generateQuarterTarget(8);

    expect(q3.threshold).toBe(11); // max(5, 15-(3-1)*2)
    expect(q8.threshold).toBe(5);  // max(5, 15-(8-1)*2) = max(5, 1) = 5
  });

  it('target type cycles every 5 quarters', () => {
    for (let q = 1; q <= 10; q++) {
      const t1 = generateQuarterTarget(q);
      const t6 = generateQuarterTarget(q + 5);
      expect(t1.type).toBe(t6.type);
    }
  });
});

// ─── Integration: summarizeReputationFactors with financing context ───

describe('Integration: Reputation factors summary informs financing decisions', () => {
  it('high bug count reduces reputation and blocks higher financing tiers', () => {
    const state = makeState({
      completedProjectIds: ['p1', 'p2'],
      history: [
        { bugsDelta: 10, techDebtDelta: 5 } as SprintResult,
        { bugsDelta: 8, techDebtDelta: 3 } as SprintResult,
      ],
    });

    const factors = summarizeReputationFactors(state);
    expect(factors.totalBugs).toBe(18);
    expect(factors.totalTechDebt).toBe(8);

    // Calculate cumulative reputation impact
    let rep = 50;
    for (const h of state.history) {
      rep = calculateNewReputation(rep, h as SprintResult, false);
    }
    // 50 + (10*-2 + 5*-1) = 50 - 25 = 25
    // 25 + (8*-2 + 3*-1) = 25 - 19 = 6
    expect(rep).toBe(6);

    // series-a needs reputation >= 20 — should NOT trigger
    const seriesA = getDefaultCheckpoints().find(c => c.id === 'series-a')!;
    const finResult = checkFinancingCheckpoint(seriesA, state, rep);
    expect(finResult.triggered).toBe(false);
  });

  it('clean sprints build reputation and unlock higher financing', () => {
    const state = makeState({
      completedProjectIds: ['p1', 'p2', 'p3'],
      history: [
        { bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
        { bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
        { bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
      ],
    });

    const factors = summarizeReputationFactors(state);
    expect(factors.totalBugs).toBe(0);
    expect(factors.totalTechDebt).toBe(0);
    expect(factors.totalCompleted).toBe(3);

    // With project completions, reputation grows
    let rep = 50;
    for (const h of state.history) {
      rep = calculateNewReputation(rep, h as SprintResult, true);
    }
    expect(rep).toBe(95); // 50 + 15*3 = 95

    // series-a triggers easily
    const seriesA = getDefaultCheckpoints().find(c => c.id === 'series-a')!;
    expect(checkFinancingCheckpoint(seriesA, state, rep).triggered).toBe(true);
  });
});

// ─── Integration: Quarter boundary detection with full pipeline ───

describe('Integration: Quarter boundary detection triggers full evaluation pipeline', () => {
  it('sprint 4 is quarter end → evaluate target + financing for Q1', () => {
    expect(isQuarterEnd(4)).toBe(true);
    expect(getQuarterNumber(4)).toBe(1);

    const target = generateQuarterTarget(1);
    const state = makeState({
      sprintCount: 4,
      completedProjectIds: ['p1'],
      history: [
        { sprintNumber: 1, project: { id: 'p1', maxProgress: 100, progress: 100 }, bugsDelta: 2, techDebtDelta: 1 } as SprintResult,
      ],
    });

    // Target evaluation
    const targetResult = evaluateQuarterTarget(target, state);
    expect(targetResult.achieved).toBe(true);

    // Reputation from history
    const rep = calculateNewReputation(50, state.history[0] as SprintResult, true);
    expect(rep).toBe(60); // delta = 15 - 4 - 1 = 10, 50 + 10 = 60

    // Financing
    const q1Financing = getCheckpointsForQuarter(getDefaultCheckpoints(), 1);
    const finResult = checkFinancingCheckpoint(q1Financing[0], state, rep);
    expect(finResult.triggered).toBe(true); // seed needs 1 completed project
  });

  it('sprint 8 is quarter end → evaluate target + financing for Q2', () => {
    expect(isQuarterEnd(8)).toBe(true);
    expect(getQuarterNumber(8)).toBe(2);

    const target = generateQuarterTarget(2);
    expect(target.type).toBe('earn_funds');

    const state = makeState({ sprintCount: 8, funds: 2000 });
    const targetResult = evaluateQuarterTarget(target, state);
    expect(targetResult.achieved).toBe(true);

    const q2Financing = getCheckpointsForQuarter(getDefaultCheckpoints(), 2);
    const finResult = checkFinancingCheckpoint(q2Financing[0], state, 0);
    expect(finResult.triggered).toBe(true); // angel-a needs funds >= 2000
  });

  it('non-quarter-end sprints do not trigger evaluation', () => {
    expect(isQuarterEnd(3)).toBe(false);
    expect(isQuarterEnd(7)).toBe(false);
    expect(isQuarterEnd(11)).toBe(false);
  });
});

// ─── Integration: Custom reputation impact affects financing outcomes ───

describe('Integration: Custom reputation impact multipliers change financing outcomes', () => {
  it('harsh impact multiplier causes faster reputation decay, blocking financing', () => {
    const harshImpact = { projectCompleted: 5, bugsPerSprint: -5, techDebtPerSprint: -3, fundMilestone: 0 };
    const result = makeSprintResult({ bugsDelta: 4, techDebtDelta: 3 });

    const normalDelta = calculateReputationDelta(result, false);
    const harshDelta = calculateReputationDelta(result, false, harshImpact);

    expect(normalDelta).toBe(-11); // 4*-2 + 3*-1
    expect(harshDelta).toBe(-29);  // 4*-5 + 3*-3

    // Starting at 30, harsh drops below series-a threshold (20)
    const normalRep = calculateNewReputation(30, result, false);
    const harshRep = calculateNewReputation(30, result, false, harshImpact);

    expect(normalRep).toBe(19);
    expect(harshRep).toBe(1); // 30 - 29

    const seriesA = getDefaultCheckpoints().find(c => c.id === 'series-a')!;
    expect(checkFinancingCheckpoint(seriesA, makeState(), normalRep).triggered).toBe(false);
    expect(checkFinancingCheckpoint(seriesA, makeState(), harshRep).triggered).toBe(false);
  });

  it('generous impact multiplier helps maintain financing eligibility', () => {
    const generousImpact = { projectCompleted: 25, bugsPerSprint: -1, techDebtPerSprint: -0.5, fundMilestone: 0 };
    const result = makeSprintResult({ bugsDelta: 3, techDebtDelta: 2 });

    const generousDelta = calculateReputationDelta(result, true, generousImpact);
    expect(generousDelta).toBe(21); // 25 + 3*-1 + 2*-0.5 = 21

    const rep = calculateNewReputation(10, result, true, generousImpact);
    expect(rep).toBe(31); // 10 + 21

    const seriesA = getDefaultCheckpoints().find(c => c.id === 'series-a')!;
    expect(checkFinancingCheckpoint(seriesA, makeState(), rep).triggered).toBe(true);
  });
});
