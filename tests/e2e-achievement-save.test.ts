import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAchievement, getAchievementProgress } from '../src/domain/achievement';
import { achievements } from '../src/data/achievements';
import {
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  getSaveSlotsMetadata,
  checkAndMigrateOldSave,
  SAVE_VERSION,
  resetStorageCheck,
  getAutosaveConfig,
  setAutosaveConfig,
} from '../src/domain/saveSystem';
import { createInitialGameState, processPostSprint, checkGameOver } from '../src/domain/gameEngine';
import type { AchievementContext } from '../src/domain/achievement';
import type { GameState } from '../src/domain/gameState';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { SprintResult } from '../src/domain/simulation';
import type { Strategy } from '../src/domain/strategy';

// ── Helpers ──────────────────────────────────────────────

function makeAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    name: 'TestAgent',
    model: 'gpt-4',
    role: 'Developer',
    avatar: 'A',
    skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
    salary: 100,
    morale: 80,
    quirk: 'None',
    fatigue: 0,
    consecutiveSprints: 0,
    totalSprintsWorked: 0,
    locked: false,
    ...overrides,
  };
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'proj-1',
    name: 'Test Project',
    description: 'A test project',
    difficulty: 10,
    urgency: 5,
    risk: 5,
    progress: 0,
    maxProgress: 100,
    bugs: 0,
    techDebt: 0,
    difficultyLevel: 'intern',
    ...overrides,
  };
}

function makeStrategy(): Strategy {
  return {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced strategy',
    modifiers: {
      progressMul: 1,
      bugChanceMul: 1,
      techDebtMul: 1,
      moraleDelta: 0,
      incidentChanceMul: 1,
    },
  };
}

function makeSprintResult(overrides: Partial<SprintResult> = {}): SprintResult {
  return {
    sprintNumber: 1,
    project: makeProject(),
    agents: [makeAgent()],
    strategy: makeStrategy(),
    progressDelta: 20,
    bugsDelta: 0,
    techDebtDelta: 0,
    moraleDelta: 0,
    cost: 100,
    incidents: [],
    summary: 'Test sprint',
    ...overrides,
  };
}

const getAchievement = (id: string) => achievements.find(a => a.id === id)!;

/** Build an AchievementContext from a GameState snapshot */
function contextFromState(state: GameState, opts?: {
  currentSprintBugs?: number;
  cheapestAgentOnly?: boolean;
}): AchievementContext {
  const totalSpent = state.history.reduce((sum, h) => sum + h.cost, 0);
  return {
    completedProjectIds: state.completedProjectIds,
    currentSprintBugs: opts?.currentSprintBugs,
    fundsRemaining: state.funds,
    totalFundsSpent: totalSpent,
    agents: state.agents.map(a => ({
      morale: a.morale,
      locked: a.locked,
      salary: a.salary,
      isCheapest: a.salary <= 80,
      consecutiveSprints: a.consecutiveSprints,
      consecutiveWorkCount: a.consecutiveSprints,
      skills: a.skills,
    })),
    sprintCount: state.sprintCount,
    projectsInOneGame: state.completedProjectIds.length,
    history: state.history.map(h => ({
      bugsDelta: h.bugsDelta,
      progressDelta: h.progressDelta,
      cost: h.cost,
    })),
    cheapestAgentOnly: opts?.cheapestAgentOnly,
  };
}

// ── E2E: Achievement Unlock Flow ─────────────────────────

describe('E2E: Achievement Unlock Flow', () => {
  let agents: Agent[];
  let projects: Project[];

  beforeEach(() => {
    agents = [
      makeAgent({ id: 'a1', salary: 80, morale: 80 }),
      makeAgent({ id: 'a2', salary: 100, morale: 80, locked: true, unlockAfterSprints: 2 }),
    ];
    projects = [
      makeProject({ id: 'easy', difficulty: 10, maxProgress: 60, difficultyLevel: 'intern' }),
      makeProject({ id: 'medium', difficulty: 20, maxProgress: 100, difficultyLevel: 'normal' }),
      makeProject({ id: 'hard', difficulty: 30, maxProgress: 120, difficultyLevel: 'hard' }),
    ];
  });

  it('unlocks "first-blood" after completing the first project', () => {
    let state = createInitialGameState(agents, projects);

    // Simulate a sprint that completes the project
    const result = makeSprintResult({
      project: { ...projects[0], progress: 60 }, // completes it
      progressDelta: 60,
      cost: 80,
    });
    state = processPostSprint(state, result, ['a1']);

    expect(state.completedProjectIds).toContain('easy');

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('first-blood'), ctx)).toBe(true);
  });

  it('unlocks "speed-run" when completing a project within 5 sprints', () => {
    let state = createInitialGameState(agents, projects);
    state.sprintCount = 3; // been running 3 sprints

    const result = makeSprintResult({
      project: { ...projects[0], progress: 60 },
      progressDelta: 60,
      sprintNumber: 4,
      cost: 80,
    });
    state = processPostSprint(state, result, ['a1']);

    expect(state.sprintCount).toBe(4);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('speed-run'), ctx)).toBe(true);
  });

  it('does NOT unlock "speed-run" if sprintCount > 5', () => {
    let state = createInitialGameState(agents, projects);
    state.sprintCount = 5;

    const result = makeSprintResult({
      project: { ...projects[0], progress: 60 },
      progressDelta: 60,
      sprintNumber: 6,
      cost: 80,
    });
    state = processPostSprint(state, result, ['a1']);

    expect(state.sprintCount).toBe(6);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('speed-run'), ctx)).toBe(false);
  });

  it('unlocks "10x-company" after completing 3 projects in one game', () => {
    let state = createInitialGameState(agents, projects);

    // Complete 3 projects sequentially
    for (const projId of ['easy', 'medium', 'hard']) {
      const proj = projects.find(p => p.id === projId)!;
      const result = makeSprintResult({
        project: { ...proj, progress: proj.maxProgress },
        progressDelta: proj.maxProgress,
        cost: 80,
      });
      state = processPostSprint(state, result, ['a1']);
    }

    expect(state.completedProjectIds).toHaveLength(3);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('10x-company'), ctx)).toBe(true);
  });

  it('unlocks "iron-man" when an agent works 6 consecutive sprints', () => {
    const hardWorker = makeAgent({
      id: 'hard-worker',
      consecutiveSprints: 5,
      morale: 80,
    });
    let state = createInitialGameState([hardWorker], projects);

    // One more sprint brings consecutive to 6
    const result = makeSprintResult({
      agents: [hardWorker],
      cost: 100,
    });
    state = processPostSprint(state, result, ['hard-worker']);

    const agent = state.agents.find(a => a.id === 'hard-worker')!;
    expect(agent.consecutiveSprints).toBe(6);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('iron-man'), ctx)).toBe(true);
  });

  it('unlocks "team-wipe" when all unlocked agents reach 0 morale', () => {
    const lowMoraleAgents = [
      makeAgent({ id: 'a1', morale: 0 }),
      makeAgent({ id: 'a2', morale: 0 }),
    ];
    const state = createInitialGameState(lowMoraleAgents, projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('team-wipe'), ctx)).toBe(true);
  });

  it('unlocks "big-team" when 6+ agents are unlocked', () => {
    const manyAgents = Array.from({ length: 6 }, (_, i) =>
      makeAgent({ id: `a${i}`, locked: false }),
    );
    const state = createInitialGameState(manyAgents, projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('big-team'), ctx)).toBe(true);
  });

  it('unlocks "financial-freedom" when funds reach 8000', () => {
    let state = createInitialGameState(agents, projects);
    state.funds = 8000;

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('financial-freedom'), ctx)).toBe(true);
  });

  it('unlocks "survivor" when a project is completed after a 15+ bug sprint', () => {
    let state = createInitialGameState(agents, projects);
    // Simulate a sprint with lots of bugs
    state.history.push(makeSprintResult({ bugsDelta: 15, cost: 100 }));
    // Then complete a project
    state.completedProjectIds.push('easy');

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('survivor'), ctx)).toBe(true);
  });

  it('unlocks "murphy-law" when total bugs reach 50', () => {
    let state = createInitialGameState(agents, projects);
    state.history = [
      makeSprintResult({ bugsDelta: 20, cost: 100 }),
      makeSprintResult({ bugsDelta: 15, cost: 100 }),
      makeSprintResult({ bugsDelta: 15, cost: 100 }),
    ];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('murphy-law'), ctx)).toBe(true);
  });

  it('unlocks "max-skill" when an agent has all skills at 100', () => {
    const maxedAgent = makeAgent({
      id: 'maxed',
      skills: { coding: 100, debugging: 100, architecture: 100, creativity: 100, speed: 100 },
    });
    const state = createInitialGameState([maxedAgent], projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('max-skill'), ctx)).toBe(true);
  });

  it('unlocks "talent-scout" when an agent total skills >= 450', () => {
    const starAgent = makeAgent({
      id: 'star',
      skills: { coding: 90, debugging: 90, architecture: 90, creativity: 90, speed: 90 },
    });
    const state = createInitialGameState([starAgent], projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('talent-scout'), ctx)).toBe(true);
  });

  it('unlocks "legendary-project" when autopilot project is completed', () => {
    let state = createInitialGameState(agents, projects);
    state.completedProjectIds = ['autopilot'];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('legendary-project'), ctx)).toBe(true);
  });

  it('unlocks "big-spender" when total funds spent reaches 10000', () => {
    let state = createInitialGameState(agents, projects);
    state.history = Array.from({ length: 100 }, () =>
      makeSprintResult({ cost: 100 }),
    );

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('big-spender'), ctx)).toBe(true);
  });

  it('unlocks "under-budget" when completing a project with >80% funds remaining', () => {
    let state = createInitialGameState(agents, projects);
    // Start with 5000, spend very little
    state.funds = 4800;
    state.completedProjectIds = ['easy'];
    state.history = [makeSprintResult({ cost: 200 })];

    const ctx = contextFromState(state);
    // 4800 / (4800 + 200) = 0.96 > 0.8
    expect(checkAchievement(getAchievement('under-budget'), ctx)).toBe(true);
  });

  it('does NOT unlock "under-budget" when funds < 80% of total', () => {
    let state = createInitialGameState(agents, projects);
    state.funds = 2000;
    state.completedProjectIds = ['easy'];
    state.history = [makeSprintResult({ cost: 3000 })];

    const ctx = contextFromState(state);
    // 2000 / (2000 + 3000) = 0.4 < 0.8
    expect(checkAchievement(getAchievement('under-budget'), ctx)).toBe(false);
  });

  it('unlocks "penny-pincher" when only cheapest agents used for a project', () => {
    const cheapAgents = [
      makeAgent({ id: 'c1', salary: 60 }),
      makeAgent({ id: 'c2', salary: 80 }),
    ];
    let state = createInitialGameState(cheapAgents, projects);
    state.completedProjectIds = ['easy'];

    const ctx = contextFromState(state, { cheapestAgentOnly: true });
    expect(checkAchievement(getAchievement('penny-pincher'), ctx)).toBe(true);
  });

  it('does NOT unlock "penny-pincher" when expensive agents are used', () => {
    let state = createInitialGameState(agents, projects);
    state.completedProjectIds = ['easy'];

    // a2 has salary 100, which is > 80
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('penny-pincher'), ctx)).toBe(false);
  });

  it('unlocks "bug-factory" when a single sprint produces 15+ bugs', () => {
    let state = createInitialGameState(agents, projects);

    const ctx = contextFromState(state);
    ctx.currentSprintBugs = 15;
    expect(checkAchievement(getAchievement('bug-factory'), ctx)).toBe(true);

    ctx.currentSprintBugs = 20;
    expect(checkAchievement(getAchievement('bug-factory'), ctx)).toBe(true);
  });

  it('does NOT unlock "bug-factory" when bugs < 15', () => {
    let state = createInitialGameState(agents, projects);

    const ctx = contextFromState(state);
    ctx.currentSprintBugs = 14;
    expect(checkAchievement(getAchievement('bug-factory'), ctx)).toBe(false);
  });

  it('tracks achievement progress correctly through game state changes', () => {
    let state = createInitialGameState(agents, projects);

    // Initially no progress
    let progress = getAchievementProgress(getAchievement('first-blood'), state);
    expect(progress).toEqual({ current: 0, target: 1, display: '0 / 1' });

    // After completing a project
    state.completedProjectIds = ['easy'];
    progress = getAchievementProgress(getAchievement('first-blood'), state);
    expect(progress).toEqual({ current: 1, target: 1, display: '1 / 1' });

    // Financial freedom progress
    state.funds = 6500;
    progress = getAchievementProgress(getAchievement('financial-freedom'), state);
    expect(progress).toEqual({ current: 6500, target: 8000, display: '6500 / 8000' });
  });

  // ── Boundary conditions ──────────────────────────────────

  it('unlocks "speed-run" at exactly 5 sprints (boundary)', () => {
    let state = createInitialGameState(agents, projects);
    state.sprintCount = 4;

    const result = makeSprintResult({
      project: { ...projects[0], progress: 60 },
      progressDelta: 60,
      sprintNumber: 5,
      cost: 80,
    });
    state = processPostSprint(state, result, ['a1']);

    expect(state.sprintCount).toBe(5);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('speed-run'), ctx)).toBe(true);
  });

  it('unlocks "financial-freedom" at exactly 8000 funds (boundary)', () => {
    let state = createInitialGameState(agents, projects);
    state.funds = 8000;

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('financial-freedom'), ctx)).toBe(true);
  });

  it('does NOT unlock "financial-freedom" at 7999 funds', () => {
    let state = createInitialGameState(agents, projects);
    state.funds = 7999;

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('financial-freedom'), ctx)).toBe(false);
  });

  it('unlocks "big-team" at exactly 6 agents (boundary)', () => {
    const sixAgents = Array.from({ length: 6 }, (_, i) =>
      makeAgent({ id: `a${i}`, locked: false }),
    );
    const state = createInitialGameState(sixAgents, projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('big-team'), ctx)).toBe(true);
  });

  it('does NOT unlock "big-team" with only 5 agents', () => {
    const fiveAgents = Array.from({ length: 5 }, (_, i) =>
      makeAgent({ id: `a${i}`, locked: false }),
    );
    const state = createInitialGameState(fiveAgents, projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('big-team'), ctx)).toBe(false);
  });

  it('unlocks "iron-man" at exactly 6 consecutive sprints (boundary)', () => {
    const worker = makeAgent({ id: 'w1', consecutiveSprints: 5 });
    let state = createInitialGameState([worker], projects);

    const result = makeSprintResult({ agents: [worker], cost: 100 });
    state = processPostSprint(state, result, ['w1']);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('iron-man'), ctx)).toBe(true);
  });

  it('does NOT unlock "iron-man" at 5 consecutive sprints', () => {
    const worker = makeAgent({ id: 'w1', consecutiveSprints: 5 });
    const state = createInitialGameState([worker], projects);

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('iron-man'), ctx)).toBe(false);
  });

  it('unlocks "bug-factory" at exactly 15 bugs (boundary)', () => {
    let state = createInitialGameState(agents, projects);
    const ctx = contextFromState(state);
    ctx.currentSprintBugs = 15;
    expect(checkAchievement(getAchievement('bug-factory'), ctx)).toBe(true);
  });

  it('does NOT unlock "bug-factory" at 14 bugs', () => {
    let state = createInitialGameState(agents, projects);
    const ctx = contextFromState(state);
    ctx.currentSprintBugs = 14;
    expect(checkAchievement(getAchievement('bug-factory'), ctx)).toBe(false);
  });

  it('unlocks "murphy-law" at exactly 50 total bugs (boundary)', () => {
    let state = createInitialGameState(agents, projects);
    state.history = [
      makeSprintResult({ bugsDelta: 25, cost: 100 }),
      makeSprintResult({ bugsDelta: 25, cost: 100 }),
    ];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('murphy-law'), ctx)).toBe(true);
  });

  it('does NOT unlock "murphy-law" at 49 total bugs', () => {
    let state = createInitialGameState(agents, projects);
    state.history = [
      makeSprintResult({ bugsDelta: 25, cost: 100 }),
      makeSprintResult({ bugsDelta: 24, cost: 100 }),
    ];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('murphy-law'), ctx)).toBe(false);
  });

  it('unlocks "big-spender" at exactly 10000 total spent (boundary)', () => {
    let state = createInitialGameState(agents, projects);
    state.history = Array.from({ length: 100 }, () =>
      makeSprintResult({ cost: 100 }),
    );

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('big-spender'), ctx)).toBe(true);
  });

  it('does NOT unlock "big-spender" at 9900 total spent', () => {
    let state = createInitialGameState(agents, projects);
    state.history = Array.from({ length: 99 }, () =>
      makeSprintResult({ cost: 100 }),
    );

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('big-spender'), ctx)).toBe(false);
  });

  // ── Negative / edge cases ────────────────────────────────

  it('does NOT unlock "team-wipe" when agents array is empty', () => {
    const state = createInitialGameState([], projects);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('team-wipe'), ctx)).toBe(false);
  });

  it('does NOT unlock "team-wipe" when only locked agents have 0 morale', () => {
    const mixedAgents = [
      makeAgent({ id: 'a1', morale: 50, locked: false }),
      makeAgent({ id: 'a2', morale: 0, locked: true }),
    ];
    const state = createInitialGameState(mixedAgents, projects);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('team-wipe'), ctx)).toBe(false);
  });

  it('does NOT unlock "max-skill" when one skill is below 100', () => {
    const almostMaxed = makeAgent({
      id: 'almost',
      skills: { coding: 100, debugging: 100, architecture: 100, creativity: 100, speed: 99 },
    });
    const state = createInitialGameState([almostMaxed], projects);
    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('max-skill'), ctx)).toBe(false);
  });

  it('does NOT unlock "talent-scout" when total skills < 450', () => {
    const notQuiteStar = makeAgent({
      id: 'not-star',
      skills: { coding: 89, debugging: 89, architecture: 89, creativity: 89, speed: 89 },
    });
    const state = createInitialGameState([notQuiteStar], projects);
    const ctx = contextFromState(state);
    // 89 * 5 = 445 < 450
    expect(checkAchievement(getAchievement('talent-scout'), ctx)).toBe(false);
  });

  it('does NOT unlock "survivor" when no bugs in history', () => {
    let state = createInitialGameState(agents, projects);
    state.completedProjectIds = ['easy'];
    state.history = [makeSprintResult({ bugsDelta: 0, cost: 100 })];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('survivor'), ctx)).toBe(false);
  });

  it('does NOT unlock "survivor" when bugs exist but no project completed', () => {
    let state = createInitialGameState(agents, projects);
    state.completedProjectIds = [];
    state.history = [makeSprintResult({ bugsDelta: 20, cost: 100 })];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('survivor'), ctx)).toBe(false);
  });

  it('does NOT unlock "under-budget" at exactly 80% funds (needs > 80%)', () => {
    let state = createInitialGameState(agents, projects);
    // 4000 / (4000 + 1000) = 0.8 exactly, not > 0.8
    state.funds = 4000;
    state.completedProjectIds = ['easy'];
    state.history = [makeSprintResult({ cost: 1000 })];

    const ctx = contextFromState(state);
    expect(checkAchievement(getAchievement('under-budget'), ctx)).toBe(false);
  });

  // ── getAchievementProgress coverage ──────────────────────

  it('tracks progress for all achievement types', () => {
    const state = createInitialGameState(
      [
        makeAgent({ id: 'a1', morale: 50, consecutiveSprints: 3 }),
        makeAgent({ id: 'a2', morale: 0, locked: false }),
      ],
      [
        makeProject({ id: 'p1', progress: 0 }),
      ],
    );
    state.funds = 5000;
    state.sprintCount = 4;
    state.completedProjectIds = [];
    state.history = [
      makeSprintResult({ bugsDelta: 10, cost: 200 }),
      makeSprintResult({ bugsDelta: 20, cost: 300 }),
    ];

    // bug-factory: max single-sprint bugs = 20, capped at 15
    let progress = getAchievementProgress(getAchievement('bug-factory'), state);
    expect(progress).toEqual({ current: 15, target: 15, display: '20 / 15' });

    // team-wipe: 1 of 2 active agents at 0 morale
    progress = getAchievementProgress(getAchievement('team-wipe'), state);
    expect(progress).toEqual({ current: 1, target: 2, display: '1 / 2' });

    // 10x-company: 0 of 3
    progress = getAchievementProgress(getAchievement('10x-company'), state);
    expect(progress).toEqual({ current: 0, target: 3, display: '0 / 3' });

    // speed-run: 4 of 5 sprints
    progress = getAchievementProgress(getAchievement('speed-run'), state);
    expect(progress).toEqual({ current: 4, target: 5, display: '4 / 5' });

    // iron-man: max consecutive = 3, target 6
    progress = getAchievementProgress(getAchievement('iron-man'), state);
    expect(progress).toEqual({ current: 3, target: 6, display: '3 / 6' });

    // big-team: 2 unlocked, target 6
    progress = getAchievementProgress(getAchievement('big-team'), state);
    expect(progress).toEqual({ current: 2, target: 6, display: '2 / 6' });

    // big-spender: 500 spent, target 10000
    progress = getAchievementProgress(getAchievement('big-spender'), state);
    expect(progress).toEqual({ current: 500, target: 10000, display: '500 / 10000' });

    // murphy-law: 30 total bugs, target 50
    progress = getAchievementProgress(getAchievement('murphy-law'), state);
    expect(progress).toEqual({ current: 30, target: 50, display: '30 / 50' });

    // survivor: max bugs = 20, capped at 15
    progress = getAchievementProgress(getAchievement('survivor'), state);
    expect(progress).toEqual({ current: 15, target: 15, display: '20 / 15' });

    // legendary-project: 0 of 1
    progress = getAchievementProgress(getAchievement('legendary-project'), state);
    expect(progress).toEqual({ current: 0, target: 1, display: '0 / 1' });

    // max-skill: 0 of 5 skills at 100
    progress = getAchievementProgress(getAchievement('max-skill'), state);
    expect(progress).toEqual({ current: 0, target: 5, display: '0 / 5' });

    // talent-scout: max total = 250 (50*5), target 450
    progress = getAchievementProgress(getAchievement('talent-scout'), state);
    expect(progress).toEqual({ current: 250, target: 450, display: '250 / 450' });
  });

  it('getAchievementProgress returns null for unknown conditionType', () => {
    const state = createInitialGameState(agents, projects);
    const fakeAchievement = {
      id: 'fake',
      name: 'Fake',
      emoji: '?',
      description: 'Unknown',
      conditionType: 'nonexistent_type',
      category: 'project' as const,
      rarity: 'common' as const,
    };
    expect(getAchievementProgress(fakeAchievement, state)).toBeNull();
  });

  it('getAchievementProgress caps current values at target', () => {
    const state = createInitialGameState(agents, projects);
    state.funds = 20000; // way above 8000 target

    const progress = getAchievementProgress(getAchievement('financial-freedom'), state);
    expect(progress).toEqual({ current: 8000, target: 8000, display: '20000 / 8000' });
  });

  it('checkAchievement returns false for unknown conditionType', () => {
    const state = createInitialGameState(agents, projects);
    const ctx = contextFromState(state);
    const fakeAchievement = {
      id: 'fake',
      name: 'Fake',
      emoji: '?',
      description: 'Unknown',
      conditionType: 'nonexistent_type',
      category: 'project' as const,
      rarity: 'common' as const,
    };
    expect(checkAchievement(fakeAchievement, ctx)).toBe(false);
  });
});

// ── E2E: Save Migration ─────────────────────────────────

describe('E2E: Save Migration', () => {
  let mockState: GameState;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
    });
    resetStorageCheck();

    mockState = createInitialGameState(
      [makeAgent({ id: 'a1' })],
      [makeProject({ id: 'p1' })],
    );
  });

  it('migrates v2 raw GameState to v5 SaveData with all fields', () => {
    // Old v2 format: raw GameState stored directly
    const v2Data = {
      funds: 3000,
      sprintCount: 5,
      agents: [makeAgent()],
      projects: [makeProject()],
      completedProjectIds: ['p1'],
      unlockedAchievementIds: ['first-blood'],
      gameOver: false,
      history: [makeSprintResult()],
      relations: [],
      reputation: 50,
      confidence: 50,
    };
    localStorage.setItem('ai_manager_tycoon_save_v2', JSON.stringify(v2Data));

    const migrated = checkAndMigrateOldSave();
    expect(migrated).toBe(true);

    const loaded = loadFromSlot('1');
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(SAVE_VERSION);
    expect(loaded!.gameState.funds).toBe(3000);
    expect(loaded!.gameState.sprintCount).toBe(5);
    expect(loaded!.gameState.completedProjectIds).toEqual(['p1']);
    expect(loaded!.gameState.unlockedAchievementIds).toEqual(['first-blood']);
    // v5 defaults
    expect(loaded!.quarterlyEvaluations).toEqual([]);
    expect(loaded!.reputationScore).toBe(0);
    expect(loaded!.triggeredCheckpoints).toEqual([]);
  });

  it('migrates v4 SaveData to v5 preserving existing fields', () => {
    const v4Data = {
      version: 4,
      gameState: mockState,
      savedAt: new Date().toISOString(),
      skillTrees: { tree1: { unlocked: true } },
      relationships: { agent1: { trust: 80 } },
      achievements: ['first-blood', 'bug-factory'],
      projectHistory: [{ projectId: 'p1', completedAt: '2025-01-01' }],
    };
    localStorage.setItem('ai_manager_tycoon_save_slot_2', JSON.stringify(v4Data));

    const loaded = loadFromSlot('2');
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(SAVE_VERSION);
    // Preserves v4 fields
    expect(loaded!.skillTrees).toEqual(v4Data.skillTrees);
    expect(loaded!.relationships).toEqual(v4Data.relationships);
    expect(loaded!.achievements).toEqual(v4Data.achievements);
    expect(loaded!.projectHistory).toEqual(v4Data.projectHistory);
    // Adds v5 defaults
    expect(loaded!.quarterlyEvaluations).toEqual([]);
    expect(loaded!.reputationScore).toBe(0);
    expect(loaded!.triggeredCheckpoints).toEqual([]);
  });

  it('migrates v2 SaveData wrapper (version=2 with gameState key) to v5', () => {
    const v2Wrapped = {
      version: 2,
      gameState: mockState,
      savedAt: '2025-06-01T00:00:00Z',
    };
    localStorage.setItem('ai_manager_tycoon_save_slot_3', JSON.stringify(v2Wrapped));

    const loaded = loadFromSlot('3');
    expect(loaded).not.toBeNull();
    expect(loaded!.version).toBe(SAVE_VERSION);
    expect(loaded!.gameState.funds).toBe(mockState.funds);
    expect(loaded!.skillTrees).toEqual({});
    expect(loaded!.relationships).toEqual({});
    expect(loaded!.quarterlyEvaluations).toEqual([]);
  });

  it('does NOT overwrite slot 1 if already occupied during old save migration', () => {
    // Save to slot 1 first
    saveToSlot('1', 'Existing Save', mockState);

    // Try migrating old v2 save
    localStorage.setItem('ai_manager_tycoon_save_v2', JSON.stringify({ funds: 9999 }));
    const migrated = checkAndMigrateOldSave();
    expect(migrated).toBe(false);

    // Slot 1 should be untouched
    const loaded = loadFromSlot('1');
    expect(loaded!.gameState.funds).toBe(mockState.funds);
  });

  it('returns false when no old v2 save exists', () => {
    const migrated = checkAndMigrateOldSave();
    expect(migrated).toBe(false);
  });

  it('handles corrupted save data gracefully', () => {
    localStorage.setItem('ai_manager_tycoon_save_slot_1', 'not valid json{{{');

    expect(() => loadFromSlot('1')).toThrow('加载存档失败');
  });
});

// ── E2E: Data Consistency ────────────────────────────────

describe('E2E: Data Consistency', () => {
  let mockState: GameState;

  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => store[key] || null),
      setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
      removeItem: vi.fn((key) => { delete store[key]; }),
    });
    resetStorageCheck();

    mockState = createInitialGameState(
      [
        makeAgent({ id: 'a1', morale: 70, salary: 80 }),
        makeAgent({ id: 'a2', morale: 60, salary: 120, locked: true, unlockAfterSprints: 3 }),
      ],
      [
        makeProject({ id: 'p1', progress: 0, maxProgress: 100 }),
        makeProject({ id: 'p2', progress: 0, maxProgress: 120 }),
      ],
    );
  });

  it('preserves full GameState through save → load → save → load cycle', () => {
    // First cycle
    saveToSlot('1', 'Cycle 1', mockState);
    const loaded1 = loadFromSlot('1')!;

    // Mutate and save again
    loaded1.gameState.funds = 1234;
    loaded1.gameState.sprintCount = 7;
    loaded1.gameState.completedProjectIds = ['p1'];
    saveToSlot('1', 'Cycle 2', loaded1.gameState);

    // Second load
    const loaded2 = loadFromSlot('1')!;
    expect(loaded2.gameState.funds).toBe(1234);
    expect(loaded2.gameState.sprintCount).toBe(7);
    expect(loaded2.gameState.completedProjectIds).toEqual(['p1']);
    // Original fields preserved
    expect(loaded2.gameState.agents).toHaveLength(2);
    expect(loaded2.gameState.projects).toHaveLength(2);
  });

  it('preserves extra fields (skillTrees, achievements, etc.) across cycles', () => {
    const extra = {
      skillTrees: { backend: { level: 3, perks: ['fast-api'] } },
      relationships: { a1: { a2: 75 } },
      achievements: ['first-blood', 'speed-run'],
      projectHistory: [{ id: 'p1', completedSprint: 4 }],
      quarterlyEvaluations: [{ quarter: 1, passed: true }],
      reputationScore: 42,
      triggeredCheckpoints: ['seed', 'series-a'],
    };

    saveToSlot('2', 'Extra Data', mockState, extra);
    const loaded = loadFromSlot('2')!;

    expect(loaded.skillTrees).toEqual(extra.skillTrees);
    expect(loaded.relationships).toEqual(extra.relationships);
    expect(loaded.achievements).toEqual(extra.achievements);
    expect(loaded.projectHistory).toEqual(extra.projectHistory);
    expect(loaded.quarterlyEvaluations).toEqual(extra.quarterlyEvaluations);
    expect(loaded.reputationScore).toBe(42);
    expect(loaded.triggeredCheckpoints).toEqual(extra.triggeredCheckpoints);
  });

  it('metadata stays consistent with actual save data', () => {
    saveToSlot('1', 'Meta Test', mockState);

    const metadata = getSaveSlotsMetadata();
    const slot = metadata.find(m => m.id === '1')!;

    expect(slot.name).toBe('Meta Test');
    expect(slot.funds).toBe(mockState.funds);
    expect(slot.sprintCount).toBe(mockState.sprintCount);
    expect(slot.completedProjectsCount).toBe(mockState.completedProjectIds.length);
    expect(slot.version).toBe(SAVE_VERSION);
  });

  it('metadata updates correctly after overwrite', () => {
    saveToSlot('1', 'Original', mockState);

    const updated = { ...mockState, funds: 9999, sprintCount: 20, completedProjectIds: ['p1', 'p2'] };
    saveToSlot('1', 'Updated', updated);

    const metadata = getSaveSlotsMetadata();
    const slot = metadata.find(m => m.id === '1')!;

    expect(slot.name).toBe('Updated');
    expect(slot.funds).toBe(9999);
    expect(slot.sprintCount).toBe(20);
    expect(slot.completedProjectsCount).toBe(2);
  });

  it('multiple slots remain independent', () => {
    const state1 = { ...mockState, funds: 1000 };
    const state2 = { ...mockState, funds: 2000 };
    const state3 = { ...mockState, funds: 3000 };

    saveToSlot('1', 'Slot 1', state1);
    saveToSlot('2', 'Slot 2', state2);
    saveToSlot('3', 'Slot 3', state3);

    expect(loadFromSlot('1')!.gameState.funds).toBe(1000);
    expect(loadFromSlot('2')!.gameState.funds).toBe(2000);
    expect(loadFromSlot('3')!.gameState.funds).toBe(3000);

    // Delete slot 2, others should be unaffected
    deleteSlot('2');
    expect(loadFromSlot('1')!.gameState.funds).toBe(1000);
    expect(loadFromSlot('2')).toBeNull();
    expect(loadFromSlot('3')!.gameState.funds).toBe(3000);
  });

  it('achievement state in save matches achievement check against game state', () => {
    // Set up a state that should unlock "first-blood"
    mockState.completedProjectIds = ['p1'];
    mockState.unlockedAchievementIds = ['first-blood'];
    mockState.history = [makeSprintResult({ cost: 100 })];

    saveToSlot('1', 'Ach Consistency', mockState);
    const loaded = loadFromSlot('1')!;

    // The saved achievement list should match what checkAchievement says
    const ctx = contextFromState(loaded.gameState);
    const firstBlood = getAchievement('first-blood');
    expect(checkAchievement(firstBlood, ctx)).toBe(true);
    expect(loaded.gameState.unlockedAchievementIds).toContain('first-blood');
  });

  it('game state integrity after processPostSprint → save → load', () => {
    let state = createInitialGameState(
      [makeAgent({ id: 'a1', morale: 80 })],
      [makeProject({ id: 'p1', progress: 80, maxProgress: 100 })],
    );

    // Run a sprint that completes the project
    // SprintResult.project.progress already reflects the post-sprint value (as runSprint does)
    const result = makeSprintResult({
      project: { ...state.projects[0], progress: 100 },
      progressDelta: 20,
      cost: 100,
    });
    state = processPostSprint(state, result, ['a1']);

    expect(state.completedProjectIds).toContain('p1');
    expect(state.sprintCount).toBe(1);
    expect(state.history).toHaveLength(1);

    // Save and reload
    saveToSlot('1', 'Post Sprint', state);
    const loaded = loadFromSlot('1')!.gameState;

    expect(loaded.completedProjectIds).toEqual(state.completedProjectIds);
    expect(loaded.sprintCount).toBe(state.sprintCount);
    expect(loaded.funds).toBe(state.funds);
    expect(loaded.history).toHaveLength(1);
    expect(loaded.history[0].bugsDelta).toBe(state.history[0].bugsDelta);
    expect(loaded.agents[0].morale).toBe(state.agents[0].morale);
    expect(loaded.agents[0].fatigue).toBe(state.agents[0].fatigue);
    expect(loaded.agents[0].consecutiveSprints).toBe(state.agents[0].consecutiveSprints);
  });

  it('game over detection is consistent after save/load', () => {
    mockState.funds = 0;
    mockState.gameOver = true;
    mockState.gameOverReason = '公司破产了！';

    saveToSlot('1', 'Game Over', mockState);
    const loaded = loadFromSlot('1')!.gameState;

    expect(loaded.funds).toBe(0);
    expect(loaded.gameOver).toBe(true);
    const gameOverResult = checkGameOver(loaded);
    expect(gameOverResult.gameOver).toBe(true);
  });

  it('v5 extended fields (quarterly, reputation, checkpoints) survive full cycle', () => {
    const extra = {
      quarterlyEvaluations: [
        { quarter: 1, passed: true, desc: 'Q1 KPI' },
        { quarter: 2, passed: false, desc: 'Q2 KPI' },
      ],
      reputationScore: 73,
      triggeredCheckpoints: ['seed', 'angel-a', 'series-a'],
    };

    saveToSlot('1', 'v5 Fields', mockState, extra);

    // Overwrite with updated state
    const updatedState = { ...mockState, funds: 8888 };
    saveToSlot('1', 'v5 Updated', updatedState, {
      ...extra,
      reputationScore: 85,
      triggeredCheckpoints: [...extra.triggeredCheckpoints, 'series-b'],
    });

    const loaded = loadFromSlot('1')!;
    expect(loaded.reputationScore).toBe(85);
    expect(loaded.triggeredCheckpoints).toEqual(['seed', 'angel-a', 'series-a', 'series-b']);
    expect(loaded.quarterlyEvaluations).toEqual(extra.quarterlyEvaluations);
    expect(loaded.gameState.funds).toBe(8888);
  });

  it('agents unlocked state persists through save/load', () => {
    // Unlock agent a2 by setting sprint count high enough
    mockState.sprintCount = 5;
    mockState.agents[1].locked = false;

    saveToSlot('1', 'Agents', mockState);
    const loaded = loadFromSlot('1')!.gameState;

    expect(loaded.agents[0].locked).toBe(false);
    expect(loaded.agents[1].locked).toBe(false);
    expect(loaded.sprintCount).toBe(5);
  });

  it('relations data survives save/load cycle', () => {
    mockState.relations = [
      { agent1Id: 'a1', agent2Id: 'a2', trust: 75, events: [] },
    ];

    saveToSlot('1', 'Relations', mockState);
    const loaded = loadFromSlot('1')!.gameState;

    expect(loaded.relations).toHaveLength(1);
    expect(loaded.relations[0].agent1Id).toBe('a1');
    expect(loaded.relations[0].trust).toBe(75);
  });

  it('autosave config persists through save/load', () => {
    setAutosaveConfig({ enabled: false, interval: 10 });
    const config = getAutosaveConfig();
    expect(config.enabled).toBe(false);
    expect(config.interval).toBe(10);

    // Overwrite with different values
    setAutosaveConfig({ enabled: true, interval: 3 });
    const updated = getAutosaveConfig();
    expect(updated.enabled).toBe(true);
    expect(updated.interval).toBe(3);
  });

  it('multiple achievements unlock and persist through save/load', () => {
    // Set up state that triggers multiple achievements
    mockState.completedProjectIds = ['p1'];
    mockState.unlockedAchievementIds = ['first-blood', 'speed-run'];
    mockState.funds = 8500;
    mockState.sprintCount = 4;
    mockState.history = [
      makeSprintResult({ cost: 100, bugsDelta: 20 }),
      makeSprintResult({ cost: 100, bugsDelta: 15 }),
      makeSprintResult({ cost: 100, bugsDelta: 15 }),
    ];

    saveToSlot('1', 'Multi Achievement', mockState);
    const loaded = loadFromSlot('1')!.gameState;

    // Verify all achievements are preserved
    expect(loaded.unlockedAchievementIds).toContain('first-blood');
    expect(loaded.unlockedAchievementIds).toContain('speed-run');

    // Verify the loaded state still satisfies achievement conditions
    const ctx = contextFromState(loaded);
    expect(checkAchievement(getAchievement('first-blood'), ctx)).toBe(true);
    expect(checkAchievement(getAchievement('speed-run'), ctx)).toBe(true);
    expect(checkAchievement(getAchievement('financial-freedom'), ctx)).toBe(true);
    expect(checkAchievement(getAchievement('murphy-law'), ctx)).toBe(true);
  });

  it('achievement unlock after save does not corrupt existing save data', () => {
    // Save initial state
    mockState.completedProjectIds = [];
    mockState.unlockedAchievementIds = [];
    saveToSlot('1', 'Before', mockState);

    // Simulate unlocking an achievement
    mockState.completedProjectIds = ['p1'];
    mockState.unlockedAchievementIds = ['first-blood'];
    saveToSlot('1', 'After', mockState);

    const loaded = loadFromSlot('1')!.gameState;
    expect(loaded.completedProjectIds).toEqual(['p1']);
    expect(loaded.unlockedAchievementIds).toEqual(['first-blood']);
    // Original fields untouched
    expect(loaded.agents).toHaveLength(2);
    expect(loaded.projects).toHaveLength(2);
  });

  // ── Auto-save slot ───────────────────────────────────────

  it('auto-save slot works like manual slots', () => {
    saveToSlot('auto', 'Auto Save', mockState);
    const loaded = loadFromSlot('auto');
    expect(loaded).not.toBeNull();
    expect(loaded!.gameState.funds).toBe(mockState.funds);
    expect(loaded!.name).toBe('Auto Save');
  });

  it('auto-save appears in metadata alongside manual slots', () => {
    saveToSlot('1', 'Manual', mockState);
    saveToSlot('auto', 'Auto Save', mockState);

    const metadata = getSaveSlotsMetadata();
    const ids = metadata.map(m => m.id);
    expect(ids).toContain('1');
    expect(ids).toContain('auto');
  });

  // ── Edge cases ───────────────────────────────────────────

  it('loading from nonexistent slot returns null', () => {
    expect(loadFromSlot('nonexistent')).toBeNull();
  });

  it('loading from empty slot returns null', () => {
    expect(loadFromSlot('1')).toBeNull();
  });

  it('save with no extra fields uses defaults', () => {
    saveToSlot('1', 'No Extra', mockState);
    const loaded = loadFromSlot('1')!;

    expect(loaded.skillTrees).toEqual({});
    expect(loaded.relationships).toEqual({});
    expect(loaded.quarterlyEvaluations).toEqual([]);
    expect(loaded.reputationScore).toBe(0);
    expect(loaded.triggeredCheckpoints).toEqual([]);
  });

  it('saveToSlot falls back to memory storage when localStorage fails', () => {
    // Override localStorage to throw on setItem
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => { throw new Error('QuotaExceeded'); }),
      removeItem: vi.fn(),
    });
    resetStorageCheck();

    // Should not throw — falls back silently
    expect(() => saveToSlot('1', 'Fallback', mockState)).not.toThrow();

    // Data is still loadable from the fallback cache
    const loaded = loadFromSlot('1');
    expect(loaded).not.toBeNull();
    expect(loaded!.gameState.funds).toBe(mockState.funds);
  });

  it('deleteSlot on nonexistent slot does not throw', () => {
    expect(() => deleteSlot('nonexistent')).not.toThrow();
  });

  it('getSaveSlotsMetadata returns empty array when no slots exist', () => {
    const metadata = getSaveSlotsMetadata();
    expect(metadata).toEqual([]);
  });

  it('concurrent saves to different slots do not interfere', () => {
    const state1 = { ...mockState, funds: 1111 };
    const state2 = { ...mockState, funds: 2222 };
    const state3 = { ...mockState, funds: 3333 };

    saveToSlot('1', 'A', state1);
    saveToSlot('2', 'B', state2);
    saveToSlot('3', 'C', state3);

    // Overwrite slot 2
    saveToSlot('2', 'B2', { ...state2, funds: 9999 });

    expect(loadFromSlot('1')!.gameState.funds).toBe(1111);
    expect(loadFromSlot('2')!.gameState.funds).toBe(9999);
    expect(loadFromSlot('3')!.gameState.funds).toBe(3333);
  });

  it('save/load preserves agent quirks and fatigue', () => {
    mockState.agents[0].quirk = 'Perfectionist';
    mockState.agents[0].fatigue = 42;

    saveToSlot('1', 'Quirks', mockState);
    const loaded = loadFromSlot('1')!.gameState;

    expect(loaded.agents[0].quirk).toBe('Perfectionist');
    expect(loaded.agents[0].fatigue).toBe(42);
  });
});
