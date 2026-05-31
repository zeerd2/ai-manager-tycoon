import { describe, expect, it } from 'vitest';
import { processQuarterSettlement } from '../src/domain/quarterSettlement';
import { createInitialGameState, processPostSprint } from '../src/domain/gameEngine';
import { createRNG } from '../src/domain/random';
import type { GameState } from '../src/domain/gameState';
import type { Project } from '../src/domain/project';
import type { SprintResult } from '../src/domain/simulation';
import type { Agent } from '../src/domain/agent';

const completedProject: Project = {
  id: 'p1',
  name: 'Completed Project',
  description: 'Done',
  difficulty: 10,
  urgency: 5,
  risk: 5,
  progress: 100,
  bugs: 0,
  techDebt: 0,
  maxProgress: 100,
  difficultyLevel: 'intern',
};

const completedSprint: SprintResult = {
  sprintNumber: 4,
  project: completedProject,
  agents: [],
  strategy: {
    id: 's1',
    name: 'Strategy',
    description: 'Strategy',
    modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 },
  },
  progressDelta: 20,
  bugsDelta: 0,
  techDebtDelta: 0,
  moraleDelta: 0,
  cost: 100,
  incidents: [],
  summary: 'Done',
};

function makeQuarterEndState(): GameState {
  return {
    funds: 4500,
    sprintCount: 4,
    agents: [],
    projects: [completedProject],
    completedProjectIds: ['p1'],
    unlockedAchievementIds: [],
    gameOver: false,
    history: [completedSprint],
    relations: [],
    reputationScore: 35,
    quarterlyEvaluations: [],
    triggeredCheckpoints: [],
  };
}

function makeAgent(id: string, overrides: Partial<Agent> = {}): Agent {
  return {
    id, name: `Agent ${id}`, model: 'gpt-4', role: 'dev', avatar: '',
    skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
    salary: 100, morale: 50, quirk: '', fatigue: 0,
    consecutiveSprints: 0, totalSprintsWorked: 0, locked: false,
    ...overrides,
  };
}

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id, name: `Project ${id}`, description: '', difficulty: 10, urgency: 5, risk: 5,
    progress: 0, maxProgress: 100, bugs: 0, techDebt: 0, difficultyLevel: 'intern',
    ...overrides,
  };
}

function makeSprintResult(
  sprintNumber: number, project: Project, agents: Agent[], progressDelta: number,
  overrides: Partial<SprintResult> = {},
): SprintResult {
  return {
    sprintNumber, project, agents,
    strategy: { id: 's1', name: 'Balanced', description: 'Standard', modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 } },
    progressDelta, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100,
    incidents: [], summary: `Sprint ${sprintNumber}`,
    ...overrides,
  };
}

describe('processQuarterSettlement', () => {
  it('settles quarter targets and financing from the same state snapshot', () => {
    const state = makeQuarterEndState();

    const settlement = processQuarterSettlement(state, state.reputationScore ?? 0);

    expect(settlement.quarterNumber).toBe(1);
    expect(settlement.targetEvaluation).toMatchObject({
      quarterNumber: 1,
      achieved: true,
      actualValue: 1,
    });
    expect(settlement.financingResults).toHaveLength(1);
    expect(settlement.financingResults[0].checkpoint.id).toBe('seed');
    expect(settlement.financingResults[0].triggered).toBe(true);
    expect(settlement.totalFinancingReward).toBe(3000);
    expect(settlement.triggeredCheckpointIds).toEqual(['seed']);
  });

  it('reports KPI fail when no projects completed at quarter end', () => {
    // State with no history → no completed project in this quarter
    const state: GameState = {
      ...makeQuarterEndState(),
      completedProjectIds: [],
      history: [], // No history → getCompletedProjectsThisQuarter returns 0
    };

    const settlement = processQuarterSettlement(state, state.reputationScore ?? 0);
    expect(settlement.quarterNumber).toBe(1);
    expect(settlement.targetEvaluation.achieved).toBe(false);
    expect(settlement.targetEvaluation.actualValue).toBe(0);
  });

  it('produces consistent result with processPostSprint for the same quarter', () => {
    const agents = [makeAgent('a1')];
    const project = makeProject('p1', { maxProgress: 100, deadline: 4 });
    let state = createInitialGameState(agents, [project]);
    state.completedProjectIds = ['p_prev'];
    state.funds = 4500;
    state.sprintCount = 3;

    const rng4 = createRNG(12345);
    const r4 = makeSprintResult(4, { ...project, progress: 100 }, [agents[0]], 100);
    state = processPostSprint(state, r4, ['a1'], rng4);

    // After processPostSprint, the state should have quarterlyEvaluations and triggeredCheckpoints
    const settlement = processQuarterSettlement(state, state.reputationScore ?? 0);

    expect(settlement.quarterNumber).toBe(1);
    // processPostSprint computed KPI passed (completed >= 1, funds >= 4000) → +10 rep
    // so reputationScore should reflect this
    expect(state.reputation).toBeGreaterThan(50);
    expect(settlement.targetEvaluation.achieved).toBe(true);
  });

  it('can settle multiple quarters without throwing', () => {
    const state: GameState = makeQuarterEndState();

    // Quarter 1
    const q1 = processQuarterSettlement(state, 35);
    expect(q1.quarterNumber).toBe(1);
    expect(q1.targetEvaluation).toBeDefined();

    // Quarter 2 (artificially set sprintCount to 8)
    const q2State: GameState = { ...state, sprintCount: 8 };
    const q2 = processQuarterSettlement(q2State, 50);
    expect(q2.quarterNumber).toBe(2);
    expect(q2.targetEvaluation).toBeDefined();
  });
});
