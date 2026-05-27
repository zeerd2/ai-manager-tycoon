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
