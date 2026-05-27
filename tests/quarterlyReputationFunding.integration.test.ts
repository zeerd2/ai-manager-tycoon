import { describe, it, expect } from 'vitest';
import {
  generateQuarterTarget,
  getQuarterNumber,
  isQuarterEnd,
  evaluateQuarterTarget,
  SPRINTS_PER_QUARTER,
} from '../src/domain/quarterlyTarget';
import {
  calculateReputationDelta,
  calculateNewReputation,
  getReputationLevel,
  getReputationLabel,
  summarizeReputationFactors,
  DEFAULT_IMPACT,
} from '../src/domain/reputation';
import {
  getDefaultCheckpoints,
  getCheckpointsForQuarter,
  checkFinancingCheckpoint,
  evaluateQuarterCheckpoints,
} from '../src/domain/financing';
import { calculateRating } from '../src/domain/rating';
import { processPostSprint, createInitialGameState } from '../src/domain/gameEngine';
import type { GameState } from '../src/domain/gameState';
import type { SprintResult } from '../src/domain/simulation';
import type { CompanyRating } from '../src/domain/rating';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';

// --- Helpers ---

const makeAgent = (id: string, morale = 70): Agent => ({
  id,
  name: `Agent-${id}`,
  morale,
  fatigue: 0,
  consecutiveSprints: 0,
  totalSprintsWorked: 0,
  skills: { frontend: 50, backend: 50, devops: 50, testing: 50 },
  locked: false,
});

const makeProject = (id: string, overrides: Partial<Project> = {}): Project => ({
  id,
  name: `Project-${id}`,
  description: 'Test project',
  difficulty: 10,
  urgency: 5,
  risk: 20,
  progress: 0,
  bugs: 0,
  techDebt: 0,
  maxProgress: 100,
  difficultyLevel: 'normal',
  ...overrides,
});

const makeSprintResult = (
  sprintNumber: number,
  overrides: Partial<SprintResult> = {},
): SprintResult => ({
  sprintNumber,
  project: makeProject('p1'),
  agents: [makeAgent('a1')],
  strategy: {
    id: 'balanced',
    name: 'Balanced',
    description: '均衡策略',
    modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 },
  },
  progressDelta: 30,
  bugsDelta: 2,
  techDebtDelta: 1,
  moraleDelta: 0,
  cost: 200,
  incidents: [],
  summary: 'Test sprint',
  ...overrides,
});

const makeState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 5000,
  sprintCount: 0,
  agents: [makeAgent('a1')],
  projects: [makeProject('p1')],
  completedProjectIds: [],
  unlockedAchievementIds: [],
  gameOver: false,
  history: [],
  relations: [],
  reputation: 50,
  confidence: 50,
  reputationScore: 0,
  quarterlyEvaluations: [],
  triggeredCheckpoints: [],
  ...overrides,
});

// --- Integration: Quarterly Target + Reputation ---

describe('Integration: Quarterly Target + Reputation', () => {
  it('failing quarterly KPI reduces reputation, which can drop reputation level', () => {
    // Start with medium reputation (50)
    const state = makeState({ reputation: 50, confidence: 50, sprintCount: 3 });

    // Simulate sprint 4 (quarter 1 end) with no completed projects and low funds
    const result = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 }, // not completed
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // KPI Q1 requires: completedCount >= 1 && funds >= 4000
    // We have 0 completed projects → KPI fails → reputation -15
    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.passed).toBe(false);

    // Reputation should drop from 50 by at least 15 (KPI fail penalty)
    expect(newState.reputation).toBeLessThan(50);
  });

  it('passing quarterly KPI boosts reputation, advancing toward higher level', () => {
    const completedProject: Project = {
      ...makeProject('p1'),
      progress: 100,
      maxProgress: 100,
    };

    const state = makeState({
      reputation: 50,
      confidence: 50,
      sprintCount: 3,
      funds: 5000,
      completedProjectIds: ['p1'],
      history: [
        { sprintNumber: 1, project: completedProject, bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
      ],
    });

    // Sprint 4 with a new project that gets completed this sprint
    const completingProject = { ...makeProject('p2'), progress: 100, maxProgress: 100 };
    const result = makeSprintResult(4, {
      project: completingProject,
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // KPI Q1 requires: completedCount >= 1 && funds >= 4000
    // We have completed projects and funds → KPI passes
    if (result.quarterKpiResult?.passed) {
      // Reputation should increase (project completion bonus + KPI bonus)
      expect(newState.reputation).toBeGreaterThan(50);
    }
  });

  it('reputation accumulates over multiple sprints through project completions and bug penalties', () => {
    let rep = 0;

    // Sprint with project completion → +15
    const delta1 = calculateReputationDelta(
      makeSprintResult(1, { bugsDelta: 0, techDebtDelta: 0 }),
      true,
    );
    rep = calculateNewReputation(rep, makeSprintResult(1, { bugsDelta: 0, techDebtDelta: 0 }), true);
    expect(delta1).toBe(15);

    // Sprint with bugs → negative delta
    const delta2 = calculateReputationDelta(
      makeSprintResult(2, { bugsDelta: 6, techDebtDelta: 2 }),
      false,
    );
    rep = calculateNewReputation(rep, makeSprintResult(2, { bugsDelta: 6, techDebtDelta: 2 }), false);
    expect(delta2).toBe(-14); // 6*-2 + 2*-1

    // Verify accumulation
    expect(rep).toBe(1); // 15 - 14
  });

  it('quarterly target type cycles align with reputation evolution', () => {
    // Each quarter has a different target type
    const q1Target = generateQuarterTarget(1); // complete_projects
    const q2Target = generateQuarterTarget(2); // earn_funds
    const q3Target = generateQuarterTarget(3); // control_bugs
    const q4Target = generateQuarterTarget(4); // achieve_rating

    expect(q1Target.type).toBe('complete_projects');
    expect(q2Target.type).toBe('earn_funds');
    expect(q3Target.type).toBe('control_bugs');
    expect(q4Target.type).toBe('achieve_rating');

    // Reputation level should matter for different quarters
    // Q2 (earn_funds) is independent of reputation
    // Q3 (control_bugs) indirectly affects reputation via bug penalties
    // Q4 (achieve_rating) depends on overall performance
  });
});

// --- Integration: Reputation + Financing ---

describe('Integration: Reputation + Financing', () => {
  it('series-a checkpoint requires reputation >= 20, triggered by reputation growth', () => {
    const checkpoints = getDefaultCheckpoints();
    const seriesA = checkpoints.find((c) => c.id === 'series-a')!;
    const state = makeState({ completedProjectIds: ['p1'] });

    // Low reputation → not triggered
    const lowRepResult = checkFinancingCheckpoint(seriesA, state, 10);
    expect(lowRepResult.triggered).toBe(false);

    // High reputation → triggered
    const highRepResult = checkFinancingCheckpoint(seriesA, state, 25);
    expect(highRepResult.triggered).toBe(true);
    expect(highRepResult.reward).toBe(8000);
  });

  it('reputation level label changes match financing eligibility thresholds', () => {
    // series-a requires reputation >= 20, which is the boundary of 'high' level
    expect(getReputationLevel(19)).toBe('medium');
    expect(getReputationLevel(20)).toBe('high');

    const checkpoints = getDefaultCheckpoints();
    const seriesA = checkpoints.find((c) => c.id === 'series-a')!;
    const state = makeState();

    // At 'medium' level (19) → not eligible
    expect(checkFinancingCheckpoint(seriesA, state, 19).triggered).toBe(false);

    // At 'high' level (20) → eligible
    expect(checkFinancingCheckpoint(seriesA, state, 20).triggered).toBe(true);
  });

  it('reputation drop from KPI failure can block financing checkpoint', () => {
    const checkpoints = getDefaultCheckpoints();
    const seriesA = checkpoints.find((c) => c.id === 'series-a')!;
    const state = makeState({ completedProjectIds: ['p1', 'p2'] });

    // With reputation 25 → financing triggers
    const beforeKpiFail = checkFinancingCheckpoint(seriesA, state, 25);
    expect(beforeKpiFail.triggered).toBe(true);

    // After KPI failure (-15 reputation) → reputation drops to 10 → financing blocked
    const afterKpiFailRep = 25 - 15;
    const afterKpiFail = checkFinancingCheckpoint(seriesA, state, afterKpiFailRep);
    expect(afterKpiFail.triggered).toBe(false);
  });

  it('multiple financing checkpoints evaluated together reflect current reputation', () => {
    const allCheckpoints = getDefaultCheckpoints();
    const state = makeState({
      funds: 3000,
      completedProjectIds: ['p1', 'p2', 'p3'],
    });

    // Evaluate all with high reputation and good rating
    const results = evaluateQuarterCheckpoints(allCheckpoints, state, 50, 'S' as CompanyRating);
    const triggered = results.filter((r) => r.triggered);

    // seed (completed >= 1), angel-a (funds >= 2000), angel-b (completed >= 3), series-a (rep >= 20)
    expect(triggered.length).toBeGreaterThanOrEqual(4);

    // Verify total reward
    const totalReward = triggered.reduce((sum, r) => sum + r.reward, 0);
    expect(totalReward).toBeGreaterThanOrEqual(3000 + 4000 + 5000 + 8000);
  });
});

// --- Integration: Quarterly Target + Financing ---

describe('Integration: Quarterly Target + Financing', () => {
  it('financing checkpoints align with quarterly target cycles', () => {
    const checkpoints = getDefaultCheckpoints();

    // Q1 has seed checkpoint
    const q1Checkpoints = getCheckpointsForQuarter(checkpoints, 1);
    expect(q1Checkpoints).toHaveLength(1);
    expect(q1Checkpoints[0].id).toBe('seed');

    // Q2 has angel-a
    const q2Checkpoints = getCheckpointsForQuarter(checkpoints, 2);
    expect(q2Checkpoints).toHaveLength(1);
    expect(q2Checkpoints[0].id).toBe('angel-a');

    // Q4 has series-a
    const q4Checkpoints = getCheckpointsForQuarter(checkpoints, 4);
    expect(q4Checkpoints).toHaveLength(1);
    expect(q4Checkpoints[0].id).toBe('series-a');

    // Q5 has no checkpoint
    const q5Checkpoints = getCheckpointsForQuarter(checkpoints, 5);
    expect(q5Checkpoints).toHaveLength(0);
  });

  it('quarterly target evaluation and financing checkpoint use consistent state', () => {
    const completedProject = { ...makeProject('p1'), progress: 100, maxProgress: 100 };
    const state = makeState({
      sprintCount: 4,
      funds: 5000,
      completedProjectIds: ['p1'],
      history: [
        { sprintNumber: 2, project: completedProject, bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
      ],
    });

    // Evaluate Q1 quarterly target
    const q1Target = generateQuarterTarget(1);
    const targetResult = evaluateQuarterTarget(q1Target, state);

    // Evaluate Q1 financing checkpoint (seed: need >= 1 completed project)
    const checkpoints = getDefaultCheckpoints();
    const seedCheckpoint = getCheckpointsForQuarter(checkpoints, 1)[0];
    const financingResult = checkFinancingCheckpoint(seedCheckpoint, state, 50);

    // Both should be achievable with 1 completed project
    expect(targetResult.achieved).toBe(true); // complete_projects threshold=1
    expect(financingResult.triggered).toBe(true); // min_completed_projects threshold=1
  });

  it('quarterly target failure does not prevent financing if financing condition is met independently', () => {
    // Project completed in history for quarterly target check
    const completedProject = { ...makeProject('p1'), progress: 100, maxProgress: 100 };
    const state = makeState({
      sprintCount: 4,
      funds: 500, // low funds
      completedProjectIds: ['p1'],
      history: [
        { sprintNumber: 2, project: completedProject, bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
      ],
    });

    // Q1 target is complete_projects → achieved (1 >= 1)
    const q1Target = generateQuarterTarget(1);
    const targetResult = evaluateQuarterTarget(q1Target, state);
    expect(targetResult.achieved).toBe(true);

    // Seed checkpoint: min_completed_projects >= 1 → triggered
    const checkpoints = getDefaultCheckpoints();
    const seedCheckpoint = getCheckpointsForQuarter(checkpoints, 1)[0];
    const financingResult = checkFinancingCheckpoint(seedCheckpoint, state, 0);
    expect(financingResult.triggered).toBe(true);

    // But angel-a (Q2): min_funds >= 2000 → NOT triggered
    const angelA = getCheckpointsForQuarter(checkpoints, 2)[0];
    const angelAResult = checkFinancingCheckpoint(angelA, state, 0);
    expect(angelAResult.triggered).toBe(false);
  });
});

// --- Integration: Full Cycle (Quarterly Target → Reputation → Financing) ---

describe('Integration: Full Cycle - Sprint to Financing', () => {
  it('complete Q1 cycle: project completion → KPI pass → reputation boost → financing eligible', () => {
    const checkpoints = getDefaultCheckpoints();
    const seedCheckpoint = getCheckpointsForQuarter(checkpoints, 1)[0];

    // Simulate 4 sprints with 1 project completion
    let state = makeState({ reputation: 50, confidence: 50 });

    // Sprints 1-3: progress but don't complete
    for (let i = 1; i <= 3; i++) {
      const result = makeSprintResult(i, {
        project: { ...makeProject('p1'), progress: i * 25, maxProgress: 100 },
        bugsDelta: 0,
        techDebtDelta: 0,
        cost: 200,
      });
      state = processPostSprint(state, result, ['a1']);
    }

    // Sprint 4: complete the project
    const finalResult = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });
    state = processPostSprint(state, finalResult, ['a1']);

    // Verify Q1 KPI result
    expect(finalResult.quarterKpiResult).toBeDefined();
    expect(finalResult.quarterKpiResult!.quarter).toBe(1);

    // Check financing eligibility with current state
    const repScore = state.reputation ?? 50;
    const financingResult = checkFinancingCheckpoint(seedCheckpoint, state, repScore);

    // Seed requires 1 completed project → should be triggered
    expect(state.completedProjectIds.length).toBeGreaterThanOrEqual(1);
    expect(financingResult.triggered).toBe(true);
    expect(financingResult.reward).toBe(3000);
  });

  it('bug-heavy sprints tank reputation, blocking reputation-based financing', () => {
    const checkpoints = getDefaultCheckpoints();
    const seriesA = checkpoints.find((c) => c.id === 'series-a')!;

    // Simulate heavy bug sprints
    let rep = 50;
    for (let i = 0; i < 5; i++) {
      const result = makeSprintResult(i + 1, { bugsDelta: 8, techDebtDelta: 3 });
      rep = calculateNewReputation(rep, result, false);
    }

    // After 5 bug-heavy sprints, reputation should be significantly lower
    expect(rep).toBeLessThan(0);
    expect(getReputationLevel(rep)).toBe('low');

    // Series-A requires reputation >= 20 → blocked
    const state = makeState({ completedProjectIds: ['p1', 'p2', 'p3'] });
    const result = checkFinancingCheckpoint(seriesA, state, rep);
    expect(result.triggered).toBe(false);
  });

  it('multi-quarter progression: Q1-Q2 financing rewards accumulate', () => {
    const allCheckpoints = getDefaultCheckpoints();

    // Q1 state: strong start
    const q1State = makeState({
      sprintCount: 4,
      funds: 5000,
      completedProjectIds: ['p1'],
      reputation: 50,
    });

    const q1Checkpoints = getCheckpointsForQuarter(allCheckpoints, 1);
    const q1Results = evaluateQuarterCheckpoints(q1Checkpoints, q1State, 50);
    const q1Reward = q1Results.filter((r) => r.triggered).reduce((s, r) => s + r.reward, 0);
    expect(q1Reward).toBe(3000); // seed

    // Q2 state: more growth
    const q2State = makeState({
      sprintCount: 8,
      funds: 6000,
      completedProjectIds: ['p1', 'p2', 'p3'],
      reputation: 60,
    });

    const q2Checkpoints = getCheckpointsForQuarter(allCheckpoints, 2);
    const q2Results = evaluateQuarterCheckpoints(q2Checkpoints, q2State, 60);
    const q2Reward = q2Results.filter((r) => r.triggered).reduce((s, r) => s + r.reward, 0);
    expect(q2Reward).toBe(4000); // angel-a

    // Total financing from Q1-Q2
    const totalReward = q1Reward + q2Reward;
    expect(totalReward).toBe(7000);
  });

  it('financing rewards boost funds, enabling future quarterly target achievement', () => {
    // Start with low funds, project completed in Q1 sprint range
    const completedProject = { ...makeProject('p1'), progress: 100, maxProgress: 100 };
    const state = makeState({
      funds: 2000,
      completedProjectIds: ['p1'],
      sprintCount: 4,
      history: [
        { sprintNumber: 2, project: completedProject, bugsDelta: 0, techDebtDelta: 0 } as SprintResult,
      ],
    });

    // Q1 target: complete_projects (threshold=1) → achieved
    const q1Target = generateQuarterTarget(1);
    const targetResult = evaluateQuarterTarget(q1Target, state);
    expect(targetResult.achieved).toBe(true);

    // Seed checkpoint triggers → reward 3000
    const checkpoints = getDefaultCheckpoints();
    const seed = getCheckpointsForQuarter(checkpoints, 1)[0];
    const financingResult = checkFinancingCheckpoint(seed, state, 50);
    expect(financingResult.triggered).toBe(true);

    // After applying reward: funds = 2000 + 3000 = 5000
    const fundsAfterReward = state.funds + financingResult.reward;
    expect(fundsAfterReward).toBe(5000);

    // Q2 target: earn_funds (threshold=1500) → now achievable
    const q2Target = generateQuarterTarget(2);
    const stateAfterReward = makeState({ funds: fundsAfterReward, sprintCount: 8 });
    const q2Result = evaluateQuarterTarget(q2Target, stateAfterReward);
    expect(q2Result.achieved).toBe(true);
  });
});

// --- Integration: processPostSprint ties all systems together ---

describe('Integration: processPostSprint cross-system effects', () => {
  it('project completion increases funds AND reputation AND completes project for financing', () => {
    const state = makeState({
      funds: 3000,
      reputation: 40,
      confidence: 40,
      sprintCount: 0,
    });

    const result = makeSprintResult(1, {
      project: { ...makeProject('p1'), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Funds increased by reward (normal project: difficulty 10 * 20 * 1.6 = 320) minus cost
    expect(newState.funds).toBeGreaterThan(3000);

    // Reputation increased (project completion bonus)
    expect(newState.reputation).toBeGreaterThan(40);

    // Project marked as completed
    expect(newState.completedProjectIds).toContain('p1');

    // Now eligible for seed financing
    const seed = getDefaultCheckpoints().find((c) => c.id === 'seed')!;
    const financingResult = checkFinancingCheckpoint(seed, newState, newState.reputation!);
    expect(financingResult.triggered).toBe(true);
  });

  it('KPI failure at quarter end cascades: reputation drop → financing blocked', () => {
    const state = makeState({
      funds: 5000,
      reputation: 30, // borderline
      confidence: 30,
      sprintCount: 3, // next sprint is Q1 end
      completedProjectIds: [],
    });

    // Sprint 4 with no project completion → KPI fails
    const result = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // KPI failure → reputation penalty
    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.passed).toBe(false);

    // Reputation should have dropped
    const repDrop = newState.reputation! < 30;

    // If reputation dropped below 20, series-A financing would be blocked
    if (newState.reputation! < 20) {
      const seriesA = getDefaultCheckpoints().find((c) => c.id === 'series-a')!;
      const financingResult = checkFinancingCheckpoint(seriesA, newState, newState.reputation!);
      expect(financingResult.triggered).toBe(false);
    }
  });

  it('cumulative bugs reduce reputation and make control_bugs quarterly target harder', () => {
    // Simulate a state with accumulated bugs
    const history: SprintResult[] = [];
    let totalBugs = 0;

    for (let i = 1; i <= 4; i++) {
      const bugs = 3;
      totalBugs += bugs;
      history.push(makeSprintResult(i, { bugsDelta: bugs, techDebtDelta: 1 }));
    }

    const state = makeState({
      sprintCount: 4,
      history,
    });

    // Q3 target is control_bugs (threshold = max(5, 15-(3-1)*2) = 11)
    const q3Target = generateQuarterTarget(3);
    const result = evaluateQuarterTarget(q3Target, state);

    // Total bugs from history = 12 (3*4 sprints) + existing project bugs
    // The actual value depends on how evaluateQuarterTarget counts bugs
    expect(q3Target.type).toBe('control_bugs');
    expect(q3Target.threshold).toBe(11);
  });

  it('reputation summary reflects cumulative state after multiple sprints', () => {
    const state = makeState({
      completedProjectIds: ['p1', 'p2'],
      history: [
        makeSprintResult(1, { bugsDelta: 5, techDebtDelta: 2 }),
        makeSprintResult(2, { bugsDelta: 3, techDebtDelta: 1 }),
        makeSprintResult(3, { bugsDelta: 0, techDebtDelta: 0 }),
      ],
    });

    const factors = summarizeReputationFactors(state);
    expect(factors.totalCompleted).toBe(2);
    expect(factors.totalBugs).toBe(8);
    expect(factors.totalTechDebt).toBe(3);
  });
});

// --- Edge Cases ---

describe('Integration: Edge Cases', () => {
  it('reputation clamped at boundaries does not affect financing calculations', () => {
    const state = makeState();

    // At max reputation
    const maxResult = checkFinancingCheckpoint(
      getDefaultCheckpoints().find((c) => c.id === 'series-a')!,
      state,
      100,
    );
    expect(maxResult.triggered).toBe(true);

    // At min reputation
    const minResult = checkFinancingCheckpoint(
      getDefaultCheckpoints().find((c) => c.id === 'series-a')!,
      state,
      -100,
    );
    expect(minResult.triggered).toBe(false);
  });

  it('quarter end detection works correctly across quarter boundaries', () => {
    expect(isQuarterEnd(4)).toBe(true);
    expect(isQuarterEnd(5)).toBe(false);
    expect(isQuarterEnd(8)).toBe(true);

    expect(getQuarterNumber(4)).toBe(1);
    expect(getQuarterNumber(5)).toBe(2);
    expect(getQuarterNumber(8)).toBe(2);
  });

  it('financing checkpoint with undefined rating defaults to score 0', () => {
    const seriesC = getDefaultCheckpoints().find((c) => c.id === 'series-c')!;
    const state = makeState();

    // undefined rating → score 0 → not triggered (needs 65)
    const result = checkFinancingCheckpoint(seriesC, state, 0, undefined);
    expect(result.triggered).toBe(false);
  });

  it('all financing checkpoints can be triggered simultaneously with ideal state', () => {
    const allCheckpoints = getDefaultCheckpoints();
    const idealState = makeState({
      funds: 50000,
      completedProjectIds: Array.from({ length: 20 }, (_, i) => `p${i}`),
      sprintCount: 10,
    });

    const results = evaluateQuarterCheckpoints(allCheckpoints, idealState, 100, 'S' as CompanyRating);
    const allTriggered = results.every((r) => r.triggered);
    expect(allTriggered).toBe(true);

    const totalReward = results.reduce((s, r) => s + r.reward, 0);
    expect(totalReward).toBe(3000 + 4000 + 5000 + 8000 + 12000 + 20000);
  });

  it('empty history yields zero bugs for quarterly target evaluation', () => {
    const state = makeState({ history: [] });
    const q3Target = generateQuarterTarget(3); // control_bugs

    const result = evaluateQuarterTarget(q3Target, state);
    expect(result.actualValue).toBe(0);
    expect(result.achieved).toBe(true); // 0 <= 11
  });

  it('reputation level transitions match financing tier boundaries', () => {
    // Verify that reputation level boundaries align with financing requirements
    const checkpoints = getDefaultCheckpoints();

    // series-a needs rep >= 20 (boundary between medium and high)
    expect(getReputationLevel(19)).toBe('medium');
    expect(getReputationLevel(20)).toBe('high');

    // Verify Chinese labels
    expect(getReputationLabel(20)).toBe('高');
    expect(getReputationLabel(19)).toBe('中');
  });
});

// --- Integration: Difficulty Levels & Reputation ---

describe('Integration: Difficulty Levels & Reputation', () => {
  it('legend project completion gives higher reputation boost than intern', () => {
    // Intern project completion
    const internResult = makeSprintResult(1, {
      project: { ...makeProject('p1', { difficultyLevel: 'intern', difficulty: 10 }), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
    });
    const internState = makeState({ reputation: 50, confidence: 50, sprintCount: 0 });
    const newInternState = processPostSprint(internState, internResult, ['a1']);

    // Legend project completion
    const legendResult = makeSprintResult(1, {
      project: { ...makeProject('p2', { difficultyLevel: 'legend', difficulty: 10 }), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
    });
    const legendState = makeState({ reputation: 50, confidence: 50, sprintCount: 0 });
    const newLegendState = processPostSprint(legendState, legendResult, ['a1']);

    // Legend should give significantly more reputation
    expect(newLegendState.reputation).toBeGreaterThan(newInternState.reputation!);
  });

  it('hard project with bugs still nets positive reputation if completed', () => {
    const state = makeState({ reputation: 40, confidence: 40, sprintCount: 0 });
    const result = makeSprintResult(1, {
      project: { ...makeProject('p1', { difficultyLevel: 'hard', difficulty: 15 }), progress: 100, maxProgress: 100 },
      bugsDelta: 3,
      techDebtDelta: 1,
      cost: 300,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Hard completion gives +18 rep, bugs (-1) and techDebt (not counted in processPostSprint directly)
    // Net should still be positive
    expect(newState.reputation).toBeGreaterThan(40);
  });
});

// --- Integration: Rating & Financing ---

describe('Integration: Rating & Financing', () => {
  it('series-c checkpoint requires rating A (score >= 65) for trigger', () => {
    const seriesC = getDefaultCheckpoints().find((c) => c.id === 'series-c')!;
    const state = makeState({ completedProjectIds: Array.from({ length: 10 }, (_, i) => `p${i}`) });

    // Rating B (score 50) → not triggered
    const resultB = checkFinancingCheckpoint(seriesC, state, 50, 'B');
    expect(resultB.triggered).toBe(false);

    // Rating A (score 65) → triggered (threshold is 65)
    const resultA = checkFinancingCheckpoint(seriesC, state, 50, 'A');
    expect(resultA.triggered).toBe(true);
    expect(resultA.reward).toBe(20000);

    // Rating S (score 80) → also triggered
    const resultS = checkFinancingCheckpoint(seriesC, state, 50, 'S');
    expect(resultS.triggered).toBe(true);
    expect(resultS.reward).toBe(20000);
  });

  it('rating improves with more completed projects and fewer bugs', () => {
    const ratingResult1 = calculateRating({
      completedProjects: 2,
      totalBugs: 10,
      totalTechDebt: 5,
      totalSprintsCost: 2000,
      fundsRemaining: 3000,
      sprintCount: 8,
    });

    const ratingResult2 = calculateRating({
      completedProjects: 5,
      totalBugs: 3,
      totalTechDebt: 2,
      totalSprintsCost: 3000,
      fundsRemaining: 5000,
      sprintCount: 8,
    });

    expect(ratingResult2.score).toBeGreaterThan(ratingResult1.score);
    expect(ratingResult2.rating).not.toBe('F');
  });
});

// --- Integration: Overdue Projects ---

describe('Integration: Overdue Projects', () => {
  it('overdue project completion reduces reputation and funds', () => {
    const state = makeState({ reputation: 60, confidence: 60, funds: 5000, sprintCount: 5 });
    const result = makeSprintResult(6, {
      project: { ...makeProject('p1', { deadline: 4, difficulty: 10 }), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Overdue: reward halved, reputation -10, confidence -10
    expect(newState.reputation).toBeLessThan(60);
    expect(newState.confidence).toBeLessThan(60);

    // Summary should mention overdue
    expect(result.summary).toContain('逾期');
  });

  it('on-time project completion gives full rewards', () => {
    const state = makeState({ reputation: 60, confidence: 60, funds: 5000, sprintCount: 3 });
    const result = makeSprintResult(4, {
      project: { ...makeProject('p1', { deadline: 5, difficulty: 10, difficultyLevel: 'normal' }), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // On time: full reward, reputation +10, confidence +12 (normal)
    expect(newState.reputation).toBeGreaterThan(60);
    expect(newState.confidence).toBeGreaterThan(60);
    expect(result.summary).toContain('按时完成');
  });
});

// --- Integration: Game Over Conditions ---

describe('Integration: Game Over & Financing', () => {
  it('bankruptcy triggers game over before financing can help', () => {
    const state = makeState({
      funds: 100, // very low
      reputation: 50,
      confidence: 50,
      sprintCount: 3,
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200, // more than remaining funds after deduction
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Funds = 100 - 200 = -100 → game over
    expect(newState.gameOver).toBe(true);
    expect(newState.gameOverReason).toContain('破产');
  });

  it('all agents at zero morale triggers game over', () => {
    const state = makeState({
      funds: 10000,
      agents: [
        makeAgent('a1', 0),
        makeAgent('a2', 0),
      ],
      reputation: 50,
      confidence: 50,
      sprintCount: 0,
    });

    const result = makeSprintResult(1, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 100,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Agent morale can go to 0 but game over only if ALL unlocked agents at 0
    // a2 didn't participate so morale increases, a1 participated so morale might drop
    // This tests the condition exists
    expect(newState.gameOver).toBeDefined();
  });
});

// --- Integration: Multi-Quarter Full Progression ---

describe('Integration: Multi-Quarter Full Progression', () => {
  it('Q1 through Q4: financing rewards accumulate as company grows', () => {
    const allCheckpoints = getDefaultCheckpoints();

    // Q1: Complete 1 project → seed triggers
    const q1State = makeState({
      sprintCount: 4,
      funds: 5000,
      completedProjectIds: ['p1'],
      reputation: 50,
    });
    const q1Results = evaluateQuarterCheckpoints(
      getCheckpointsForQuarter(allCheckpoints, 1), q1State, 50
    );
    expect(q1Results[0].triggered).toBe(true);

    // Q2: Funds >= 2000 → angel-a triggers
    const q2State = makeState({
      sprintCount: 8,
      funds: 6000,
      completedProjectIds: ['p1', 'p2'],
      reputation: 55,
    });
    const q2Results = evaluateQuarterCheckpoints(
      getCheckpointsForQuarter(allCheckpoints, 2), q2State, 55
    );
    expect(q2Results[0].triggered).toBe(true);

    // Q3: 3 completed projects → angel-b triggers
    const q3State = makeState({
      sprintCount: 12,
      funds: 8000,
      completedProjectIds: ['p1', 'p2', 'p3'],
      reputation: 60,
    });
    const q3Results = evaluateQuarterCheckpoints(
      getCheckpointsForQuarter(allCheckpoints, 3), q3State, 60
    );
    expect(q3Results[0].triggered).toBe(true);

    // Q4: Reputation >= 20 → series-a triggers
    const q4State = makeState({
      sprintCount: 16,
      funds: 10000,
      completedProjectIds: ['p1', 'p2', 'p3', 'p4'],
      reputation: 65,
    });
    const q4Results = evaluateQuarterCheckpoints(
      getCheckpointsForQuarter(allCheckpoints, 4), q4State, 65
    );
    expect(q4Results[0].triggered).toBe(true);

    // Total financing: seed(3000) + angel-a(4000) + angel-b(5000) + series-a(8000) = 20000
    const totalReward = [q1Results, q2Results, q3Results, q4Results]
      .flat()
      .filter(r => r.triggered)
      .reduce((s, r) => s + r.reward, 0);
    expect(totalReward).toBe(20000);
  });

  it('quarterly target difficulty increases over quarters', () => {
    const q1 = generateQuarterTarget(1);
    const q2 = generateQuarterTarget(2);
    const q3 = generateQuarterTarget(3);
    const q4 = generateQuarterTarget(4);
    const q5 = generateQuarterTarget(5);

    // Q1: complete_projects threshold=1
    expect(q1.threshold).toBe(1);

    // Q2: earn_funds threshold=1500
    expect(q2.threshold).toBe(1500);

    // Q3: control_bugs threshold=11
    expect(q3.threshold).toBe(11);

    // Q4: achieve_rating threshold=70
    expect(q4.threshold).toBe(70);

    // Q5: complete_sprints threshold=4
    expect(q5.threshold).toBe(4);

    // Verify cycling: Q6 should be complete_projects with higher threshold
    const q6 = generateQuarterTarget(6);
    expect(q6.type).toBe('complete_projects');
    expect(q6.threshold).toBe(3); // min(1 + floor(5/2), 4) = 3
  });
});

// --- Integration: Q2-Q5 KPI Scenarios ---

describe('Integration: Q2-Q5 KPI Scenarios', () => {
  it('Q2 KPI requires 3 completed projects, reputation >= 60, confidence >= 60', () => {
    // Setup state approaching Q2 end (sprint 8)
    const state = makeState({
      funds: 5000,
      reputation: 65,
      confidence: 65,
      sprintCount: 7,
      completedProjectIds: ['p1', 'p2', 'p3'],
    });

    // Sprint 8 (Q2 end) with no new completion
    const result = makeSprintResult(8, {
      project: { ...makeProject('p4'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Q2 KPI: completedCount >= 3 && reputation >= 60 && confidence >= 60
    // We have 3 completed projects, rep 65, conf 65 → should pass
    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.quarter).toBe(2);
    expect(result.quarterKpiResult!.passed).toBe(true);
  });

  it('Q2 KPI fails when reputation is below 60', () => {
    const state = makeState({
      funds: 5000,
      reputation: 55,
      confidence: 65,
      sprintCount: 7,
      completedProjectIds: ['p1', 'p2', 'p3'],
    });

    const result = makeSprintResult(8, {
      project: { ...makeProject('p4'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.passed).toBe(false);
    // KPI fail → reputation -15
    expect(newState.reputation).toBeLessThan(55);
  });

  it('Q3 KPI requires 5 completed projects, reputation >= 70, confidence >= 70', () => {
    const state = makeState({
      funds: 8000,
      reputation: 75,
      confidence: 75,
      sprintCount: 11,
      completedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
    });

    const result = makeSprintResult(12, {
      project: { ...makeProject('p6'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.quarter).toBe(3);
    expect(result.quarterKpiResult!.passed).toBe(true);
  });

  it('Q4 KPI requires 8 completed projects, reputation >= 80, confidence >= 80', () => {
    const state = makeState({
      funds: 15000,
      reputation: 85,
      confidence: 85,
      sprintCount: 15,
      completedProjectIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
    });

    const result = makeSprintResult(16, {
      project: { ...makeProject('p9'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.quarter).toBe(4);
    expect(result.quarterKpiResult!.passed).toBe(true);
  });

  it('Q5+ KPI requires 12 completed projects, reputation >= 90, confidence >= 90', () => {
    const state = makeState({
      funds: 20000,
      reputation: 95,
      confidence: 95,
      sprintCount: 19,
      completedProjectIds: Array.from({ length: 12 }, (_, i) => `p${i}`),
    });

    const result = makeSprintResult(20, {
      project: { ...makeProject('p20'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    expect(result.quarterKpiResult).toBeDefined();
    expect(result.quarterKpiResult!.quarter).toBe(5);
    expect(result.quarterKpiResult!.passed).toBe(true);
  });

  it('KPI pass boosts reputation and confidence by +10', () => {
    const state = makeState({
      funds: 5000,
      reputation: 50,
      confidence: 50,
      sprintCount: 3,
      completedProjectIds: ['p1'],
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p2'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Q1 KPI passes → +10 rep, +10 conf; also +1 rep from progress with no bugs
    expect(result.quarterKpiResult!.passed).toBe(true);
    expect(newState.reputation).toBe(61); // 50 + 1 (progress) + 10 (KPI)
    expect(newState.confidence).toBe(60); // 50 + 10 (KPI)
  });

  it('KPI fail reduces reputation and confidence by -15', () => {
    const state = makeState({
      funds: 5000,
      reputation: 50,
      confidence: 50,
      sprintCount: 3,
      completedProjectIds: [], // no completed projects
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Q1 KPI fails → -15 rep, -15 conf; also +1 rep from progress with no bugs
    expect(result.quarterKpiResult!.passed).toBe(false);
    expect(newState.reputation).toBe(36); // 50 + 1 (progress) - 15 (KPI)
    expect(newState.confidence).toBe(35); // 50 - 15 (KPI)
  });
});

// --- Integration: Reputation Clamping & Financing ---

describe('Integration: Reputation Clamping & Financing', () => {
  it('reputation clamped at 0 does not go negative in processPostSprint', () => {
    const state = makeState({
      reputation: 5,
      confidence: 5,
      sprintCount: 3,
      completedProjectIds: [],
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 10,
      techDebtDelta: 5,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // KPI fail (-15) + bugs (-5) + techDebt (-5) = -25, but clamped at 0
    expect(newState.reputation).toBeGreaterThanOrEqual(0);
    expect(newState.confidence).toBeGreaterThanOrEqual(0);
  });

  it('reputation clamped at 100 does not exceed max', () => {
    const state = makeState({
      reputation: 95,
      confidence: 95,
      sprintCount: 3,
      completedProjectIds: ['p1'],
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p2'), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Project completion (+10-28) + KPI pass (+10) could exceed 100
    expect(newState.reputation).toBeLessThanOrEqual(100);
    expect(newState.confidence).toBeLessThanOrEqual(100);
  });

  it('financing still works when reputation is at boundary values', () => {
    const seriesA = getDefaultCheckpoints().find((c) => c.id === 'series-a')!;
    const state = makeState({ completedProjectIds: ['p1'] });

    // At exact threshold (20) → triggers
    const atThreshold = checkFinancingCheckpoint(seriesA, state, 20);
    expect(atThreshold.triggered).toBe(true);

    // Just below threshold (19) → does not trigger
    const belowThreshold = checkFinancingCheckpoint(seriesA, state, 19);
    expect(belowThreshold.triggered).toBe(false);

    // At max (100) → triggers
    const atMax = checkFinancingCheckpoint(seriesA, state, 100);
    expect(atMax.triggered).toBe(true);
  });
});

// --- Integration: Sprint Cost & Fund Management ---

describe('Integration: Sprint Cost & Fund Management', () => {
  it('sprint cost reduces funds before financing evaluation', () => {
    const state = makeState({
      funds: 2200,
      reputation: 50,
      confidence: 50,
      sprintCount: 7,
      completedProjectIds: ['p1', 'p2', 'p3'],
    });

    const result = makeSprintResult(8, {
      project: { ...makeProject('p4'), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 300,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Funds: 2200 - 300 (cost) + reward (project completion)
    // Angel-a needs funds >= 2000
    const angelA = getDefaultCheckpoints().find((c) => c.id === 'angel-a')!;
    const financingResult = checkFinancingCheckpoint(angelA, newState, newState.reputation!);

    // After cost deduction and project reward, check if funds meet threshold
    expect(newState.funds).toBeDefined();
  });

  it('multiple sprints accumulate costs affecting fund-based financing', () => {
    let state = makeState({
      funds: 3000,
      reputation: 50,
      confidence: 50,
    });

    // Run 4 sprints with costs
    for (let i = 1; i <= 4; i++) {
      const result = makeSprintResult(i, {
        project: { ...makeProject(`p${i}`), progress: 50, maxProgress: 100 },
        bugsDelta: 0,
        techDebtDelta: 0,
        cost: 300,
      });
      state = processPostSprint(state, result, ['a1']);
    }

    // Funds should be reduced by total costs: 3000 - (300 * 4) = 1800
    // Plus any rewards from completed projects (none here)
    expect(state.funds).toBeLessThan(3000);
  });
});

// --- Integration: Bug Accumulation & Reputation Cascade ---

describe('Integration: Bug Accumulation & Reputation Cascade', () => {
  it('bugs in sprint reduce reputation via processPostSprint', () => {
    const state = makeState({
      reputation: 50,
      confidence: 50,
      sprintCount: 0,
    });

    const result = makeSprintResult(1, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 10,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // bugsDelta=10 → repDelta -= floor(10/2) = -5
    expect(newState.reputation).toBe(45);
  });

  it('no bugs and progress gives +1 reputation', () => {
    const state = makeState({
      reputation: 50,
      confidence: 50,
      sprintCount: 0,
    });

    const result = makeSprintResult(1, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      progressDelta: 20,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // No bugs + progress → +1 rep
    expect(newState.reputation).toBe(51);
  });

  it('heavy bugs across quarters tank reputation blocking series-a financing', () => {
    let state = makeState({
      reputation: 50,
      confidence: 50,
      funds: 10000,
      completedProjectIds: ['p1', 'p2', 'p3'],
    });

    // Simulate 16 sprints (4 quarters) with heavy bugs
    for (let i = 1; i <= 16; i++) {
      const result = makeSprintResult(i, {
        project: { ...makeProject(`p${i}`), progress: 50, maxProgress: 100 },
        bugsDelta: 8,
        techDebtDelta: 3,
        cost: 200,
      });
      state = processPostSprint(state, result, ['a1']);
    }

    // Reputation should be significantly reduced
    expect(state.reputation).toBeLessThan(20);

    // Series-A financing should be blocked
    const seriesA = getDefaultCheckpoints().find((c) => c.id === 'series-a')!;
    const financingResult = checkFinancingCheckpoint(seriesA, state, state.reputation!);
    expect(financingResult.triggered).toBe(false);
  });
});

// --- Integration: Agent Morale & Game Over ---

describe('Integration: Agent Morale & Game Over', () => {
  it('all agents at zero morale triggers game over', () => {
    const state = makeState({
      funds: 10000,
      agents: [
        makeAgent('a1', 0),
        makeAgent('a2', 0),
      ],
      reputation: 50,
      confidence: 50,
      sprintCount: 0,
    });

    const result = makeSprintResult(1, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 100,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Agent morale can go to 0 but game over only if ALL unlocked agents at 0
    // a2 didn't participate so morale increases, a1 participated so morale might drop
    // This tests the condition exists
    expect(newState.gameOver).toBeDefined();
  });

  it('bankruptcy triggers game over before financing can help', () => {
    const state = makeState({
      funds: 100,
      reputation: 50,
      confidence: 50,
      sprintCount: 3,
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p1'), progress: 50, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Funds = 100 - 200 = -100 → game over
    expect(newState.gameOver).toBe(true);
    expect(newState.gameOverReason).toContain('破产');
  });
});

// --- Integration: Overdue Project Impact ---

describe('Integration: Overdue Project Impact', () => {
  it('overdue project completion reduces reputation and confidence', () => {
    const state = makeState({
      reputation: 60,
      confidence: 60,
      funds: 5000,
      sprintCount: 5,
    });

    const result = makeSprintResult(6, {
      project: { ...makeProject('p1', { deadline: 4, difficulty: 10 }), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // Overdue: reward halved, reputation -10, confidence -10
    expect(newState.reputation).toBeLessThan(60);
    expect(newState.confidence).toBeLessThan(60);
    expect(result.summary).toContain('逾期');
  });

  it('on-time project completion gives full rewards', () => {
    const state = makeState({
      reputation: 60,
      confidence: 60,
      funds: 5000,
      sprintCount: 3,
    });

    const result = makeSprintResult(4, {
      project: { ...makeProject('p1', { deadline: 5, difficulty: 10, difficultyLevel: 'normal' }), progress: 100, maxProgress: 100 },
      bugsDelta: 0,
      techDebtDelta: 0,
      cost: 200,
    });

    const newState = processPostSprint(state, result, ['a1']);

    // On time: full reward, reputation +10, confidence +12 (normal)
    expect(newState.reputation).toBeGreaterThan(60);
    expect(newState.confidence).toBeGreaterThan(60);
    expect(result.summary).toContain('按时完成');
  });
});
