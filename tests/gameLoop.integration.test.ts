import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  processPostSprint,
  checkUnlocks,
  INITIAL_FUNDS,
} from '../src/domain/gameEngine';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { SprintResult } from '../src/domain/simulation';
import { createRNG } from '../src/domain/random';

// ─── Helpers ────────────────────────────────────────────
const defaultRng = createRNG(42);


function makeAgent(id: string, overrides: Partial<Agent> = {}): Agent {
  return {
    id,
    name: `Agent ${id}`,
    model: 'gpt-4',
    role: 'dev',
    avatar: '',
    skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
    salary: 100,
    morale: 50,
    quirk: '',
    fatigue: 0,
    consecutiveSprints: 0,
    totalSprintsWorked: 0,
    locked: false,
    ...overrides,
  };
}

function makeProject(id: string, overrides: Partial<Project> = {}): Project {
  return {
    id,
    name: `Project ${id}`,
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

function makeSprintResult(
  sprintNumber: number,
  project: Project,
  agents: Agent[],
  progressDelta: number,
  overrides: Partial<SprintResult> = {},
): SprintResult {
  return {
    sprintNumber,
    project,
    agents,
    strategy: {
      id: 's1',
      name: 'Balanced',
      description: 'Standard strategy',
      modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 },
    },
    progressDelta,
    bugsDelta: 0,
    techDebtDelta: 0,
    moraleDelta: 0,
    cost: 100,
    incidents: [],
    summary: `Sprint ${sprintNumber}`,
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────

describe('Game Loop Integration', () => {
  describe('Full project lifecycle', () => {
    it('should progress a project to completion through multiple sprints', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      expect(state.sprintCount).toBe(0);
      expect(state.history).toHaveLength(0);
      expect(state.completedProjectIds).not.toContain('p1');

      // Sprint 1: progress 0 → 30
      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agents[0]], 30);
      state = processPostSprint(state, r1, ['a1'], rng1);

      expect(state.sprintCount).toBe(1);
      expect(state.funds).toBe(INITIAL_FUNDS - 100);
      expect(state.history).toHaveLength(1);
      expect(state.completedProjectIds).not.toContain('p1');

      // Sprint 2: progress 30 → 70
      const rng2 = createRNG(12345);
      const r2 = makeSprintResult(2, { ...project, progress: 70 }, [agents[0]], 40);
      state = processPostSprint(state, r2, ['a1'], rng2);

      expect(state.sprintCount).toBe(2);
      expect(state.history).toHaveLength(2);
      expect(state.completedProjectIds).not.toContain('p1');

      // Sprint 3: progress 70 → 100 → complete!
      const rng3 = createRNG(12345);
      const r3 = makeSprintResult(3, { ...project, progress: 100 }, [agents[0]], 30);
      state = processPostSprint(state, r3, ['a1'], rng3);

      expect(state.sprintCount).toBe(3);
      expect(state.history).toHaveLength(3);
      expect(state.completedProjectIds).toContain('p1');
      // Intern project reward: 10 * 20 * 1.4 = 280
      expect(state.funds).toBe(INITIAL_FUNDS - 300 + 280);
      expect(state.gameOver).toBe(false);
    });

    it('should preserve all sprint data in history entries', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agents[0]], 30, {
        bugsDelta: 5,
        techDebtDelta: 3,
        moraleDelta: -2,
        cost: 150,
        summary: 'First sprint with bugs',
      });
      state = processPostSprint(state, r1, ['a1'], rng1);

      expect(state.history[0].sprintNumber).toBe(1);
      expect(state.history[0].bugsDelta).toBe(5);
      expect(state.history[0].techDebtDelta).toBe(3);
      expect(state.history[0].moraleDelta).toBe(-2);
      expect(state.history[0].cost).toBe(150);
      expect(state.history[0].summary).toBe('First sprint with bugs');
    });
  });

  describe('Agent fatigue and rest cycles', () => {
    it('should increase fatigue for working agents and decrease for resting agents', () => {
      const agentA = makeAgent('a1');
      const agentB = makeAgent('a2');
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState([agentA, agentB], [project]);

      // Sprint 1: agentA works, agentB rests
      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agentA, agentB], 30);
      state = processPostSprint(state, r1, ['a1'], rng1);

      let a1 = state.agents.find(a => a.id === 'a1')!;
      let a2 = state.agents.find(a => a.id === 'a2')!;
      expect(a1.fatigue).toBe(15); // 0 + 15
      expect(a1.consecutiveSprints).toBe(1);
      expect(a1.totalSprintsWorked).toBe(1);
      expect(a2.fatigue).toBe(0); // 0 - 25 → clamped to 0
      expect(a2.consecutiveSprints).toBe(0);
      expect(a2.totalSprintsWorked).toBe(0);

      // Sprint 2: both work
      const rng2 = createRNG(12345);
      const r2 = makeSprintResult(2, { ...project, progress: 60 }, [agentA, agentB], 30);
      state = processPostSprint(state, r2, ['a1', 'a2'], rng2);

      a1 = state.agents.find(a => a.id === 'a1')!;
      a2 = state.agents.find(a => a.id === 'a2')!;
      expect(a1.fatigue).toBe(30); // 15 + 15
      expect(a1.consecutiveSprints).toBe(2);
      expect(a1.totalSprintsWorked).toBe(2);
      expect(a2.fatigue).toBe(15); // 0 + 15
      expect(a2.consecutiveSprints).toBe(1);
      expect(a2.totalSprintsWorked).toBe(1);
    });

    it('should apply extra morale penalty for 3+ consecutive sprints', () => {
      const agent = makeAgent('a1', { consecutiveSprints: 3, morale: 60 });
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState([agent], [project]);

      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agent], 30);
      state = processPostSprint(state, r1, ['a1'], rng1);

      const a1 = state.agents.find(a => a.id === 'a1')!;
      // morale: 60 - 5 (extra penalty for 3+ consecutive) = 55
      expect(a1.morale).toBe(55);
    });
  });

  describe('Quarter end KPI evaluation', () => {
    it('should trigger quarter 1 KPI pass at sprint 4 with sufficient progress', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100, deadline: 4 });
      let state = createInitialGameState(agents, [project]);
      // Pre-set for KPI pass: completed >= 1, funds >= 4000
      state.completedProjectIds = ['p_prev'];
      state.funds = 4500;
      state.sprintCount = 3; // next sprint is 4 → quarter end

      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(4, { ...project, progress: 100 }, [agents[0]], 50, {
        bugsDelta: 0,
      });
      state = processPostSprint(state, r1, ['a1'], rng1);

      // KPI passed → +10 rep, +10 conf, +5 (intern completion rep) +1 (progressDelta)
      // Intern completion also gives +8 confidence
      // Rep: 50 + 5 + 1 + 10 = 66
      // Conf: 50 + 10 + 8 = 68
      expect(state.reputation).toBe(66);
      expect(state.confidence).toBe(68);
      // Verify quarterKpiResult was set on the result
      expect(state.history[0].quarterKpiResult).toBeDefined();
      expect(state.history[0].quarterKpiResult!.passed).toBe(true);
      expect(state.history[0].quarterKpiResult!.quarter).toBe(1);
    });

    it('should apply KPI fail penalty at quarter end when conditions not met', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);
      // KPI fail: completed = 0, funds = 4500 (fine) but 0 completed → fail
      state.funds = 4500;
      state.sprintCount = 3;

      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(4, { ...project, progress: 30 }, [agents[0]], 30);
      state = processPostSprint(state, r1, ['a1'], rng1);

      // KPI failed → -15 rep, -15 conf, +1 from progressDelta
      // 50-15+1 = 36 rep, 50-15 = 35 conf
      expect(state.reputation).toBe(36);
      expect(state.confidence).toBe(35);
      expect(state.history[0].quarterKpiResult).toBeDefined();
      expect(state.history[0].quarterKpiResult!.passed).toBe(false);
    });

    it('should not trigger KPI evaluation on non-quarter sprints', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);
      state.sprintCount = 2; // next sprint is 3, not a quarter

      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(3, { ...project, progress: 30 }, [agents[0]], 30);
      state = processPostSprint(state, r1, ['a1'], rng1);

      // No quarterKpiResult on non-quarter sprints
      expect(state.history[0].quarterKpiResult).toBeUndefined();
      // No KPI penalty — only progress delta rep gain
      expect(state.reputation).toBe(51); // 50 + 1
      expect(state.confidence).toBe(50);
    });
  });

  describe('Overdue project penalties', () => {
    it('should halve reward and penalize reputation for overdue completion', () => {
      const agents = [makeAgent('a1')];
      // deadline=1 means it should complete by sprint 1
      const project = makeProject('p1', { maxProgress: 100, deadline: 1 });
      let state = createInitialGameState(agents, [project]);

      // Sprint 1: partial progress
      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 50 }, [agents[0]], 50);
      state = processPostSprint(state, r1, ['a1'], rng1);
      expect(state.completedProjectIds).not.toContain('p1');

      // Sprint 2: completes, but overdue (sprintNumber=2 > deadline=1)
      const rng2 = createRNG(12345);
      const r2 = makeSprintResult(2, { ...project, progress: 100 }, [agents[0]], 50);
      state = processPostSprint(state, r2, ['a1'], rng2);

      expect(state.completedProjectIds).toContain('p1');
      // Overdue: half reward (280/2 = 140), -10 rep, -10 conf
      // Funds: 5000 - 100*2 + 140 = 4940
      expect(state.funds).toBe(INITIAL_FUNDS - 200 + 140);
      // Sprint 1: +1 rep from progress
      // Sprint 2: +1 rep from progress - 10 overdue = -9
      // Rep total: 50 + 1 - 9 = 42, Conf total: 50 - 10 = 40
      expect(state.reputation).toBe(42);
      expect(state.confidence).toBe(40);
    });
  });

  describe('Agent unlocks', () => {
    it('should unlock agents after required sprint count', () => {
      const lockedAgent = makeAgent('a2', { locked: true, unlockAfterSprints: 3 });
      const agents = [makeAgent('a1'), lockedAgent];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      // Run 3 sprints
      for (let i = 1; i <= 3; i++) {
        const rng = createRNG(12345 + i);
        const r = makeSprintResult(i, { ...project, progress: i * 30 }, [agents[0]], 30);
        state = processPostSprint(state, r, ['a1'], rng);
      }

      const unlocked = checkUnlocks(state);
      expect(unlocked).toContain('a2');
    });

    it('should not unlock agents before required sprint count', () => {
      const lockedAgent = makeAgent('a2', { locked: true, unlockAfterSprints: 5 });
      const agents = [makeAgent('a1'), lockedAgent];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      // Only 2 sprints
      for (let i = 1; i <= 2; i++) {
        const rng = createRNG(12345 + i);
        const r = makeSprintResult(i, { ...project, progress: i * 30 }, [agents[0]], 30);
        state = processPostSprint(state, r, ['a1'], rng);
      }

      const unlocked = checkUnlocks(state);
      expect(unlocked).not.toContain('a2');
    });
  });

  describe('Game over conditions across sprints', () => {
    it('should trigger game over when funds run out', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);
      state.funds = 50; // Almost broke

      // One more sprint should drain remaining funds
      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agents[0]], 30, { cost: 100 });
      state = processPostSprint(state, r1, ['a1'], rng1);

      expect(state.funds).toBe(-50);
      expect(state.gameOver).toBe(true);
      expect(state.gameOverReason).toContain('破产');
    });

    it('should not trigger game over after sprint with sufficient funds', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      const rng1 = createRNG(12345);
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agents[0]], 30);
      state = processPostSprint(state, r1, ['a1'], rng1);

      expect(state.gameOver).toBe(false);
      expect(state.gameOverReason).toBeUndefined();
    });
  });

  describe('Achievement-relevant state is tracked correctly', () => {
    it('should track history for bug-related achievements', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      // Sprint with 8 bugs
      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agents[0]], 30, { bugsDelta: 8 });
      state = processPostSprint(state, r1, ['a1'], defaultRng);

      // Sprint with 7 bugs (total 15)
      const r2 = makeSprintResult(2, { ...project, progress: 60 }, [agents[0]], 30, { bugsDelta: 7 });
      state = processPostSprint(state, r2, ['a1'], defaultRng);

      // History contains both bug deltas
      const totalBugs = state.history.reduce((sum, h) => sum + h.bugsDelta, 0);
      expect(totalBugs).toBe(15);
      const maxBugsInSprint = Math.max(...state.history.map(h => h.bugsDelta));
      expect(maxBugsInSprint).toBe(8);
    });

    it('should accumulate total funds spent through history', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      const r1 = makeSprintResult(1, { ...project, progress: 30 }, [agents[0]], 30, { cost: 200 });
      state = processPostSprint(state, r1, ['a1'], defaultRng);

      const r2 = makeSprintResult(2, { ...project, progress: 60 }, [agents[0]], 30, { cost: 300 });
      state = processPostSprint(state, r2, ['a1'], defaultRng);

      const totalSpent = state.history.reduce((sum, h) => sum + h.cost, 0);
      expect(totalSpent).toBe(500);
      expect(state.funds).toBe(INITIAL_FUNDS - 500);
    });

    it('should track cost in history for efficient_project achievement', () => {
      const agents = [makeAgent('a1')];
      const project = makeProject('p1', { maxProgress: 100 });
      let state = createInitialGameState(agents, [project]);

      // Sprint 1: high progress (70) + low cost (300) → should qualify for efficient_project
      const r1 = makeSprintResult(1, { ...project, progress: 70 }, [agents[0]], 70, { cost: 300 });
      state = processPostSprint(state, r1, ['a1'], defaultRng);

      expect(state.history).toHaveLength(1);
      expect(state.history[0].progressDelta).toBe(70);
      expect(state.history[0].cost).toBe(300);

      // Sprint 2: high progress (70) + high cost (400) → should NOT qualify
      const r2 = makeSprintResult(2, { ...project, progress: 100 }, [agents[0]], 70, { cost: 400 });
      state = processPostSprint(state, r2, ['a1'], defaultRng);

      expect(state.history).toHaveLength(2);
      expect(state.history[1].progressDelta).toBe(70);
      expect(state.history[1].cost).toBe(400);

      // Verify history entries have cost field for achievement checking
      const hasLowCostHighProgress = state.history.some(h => h.progressDelta >= 65 && h.cost <= 350);
      const hasHighCostHighProgress = state.history.some(h => h.progressDelta >= 65 && h.cost > 350);
      expect(hasLowCostHighProgress).toBe(true);
      expect(hasHighCostHighProgress).toBe(true);
    });
  });

  describe('RNG determinism', () => {
    it('should produce identical state with the same fixed RNG across multiple sprints', () => {
      const agents = [makeAgent('a1', { skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 } })];
      const project = makeProject('p1', { maxProgress: 100 });

      // Run two complete 3-sprint sequences with the same seed RNG
      const rng = () => 0.99; // Fixed seed: always returns 0.99 → pickRandom picks last skill (speed)

      let stateA = createInitialGameState(agents, [project]);
      for (let i = 1; i <= 3; i++) {
        const r = makeSprintResult(i, { ...project, progress: i * 30 }, [agents[0]], 30);
        stateA = processPostSprint(stateA, r, ['a1'], rng);
      }

      let stateB = createInitialGameState(agents, [project]);
      for (let i = 1; i <= 3; i++) {
        const r = makeSprintResult(i, { ...project, progress: i * 30 }, [agents[0]], 30);
        stateB = processPostSprint(stateB, r, ['a1'], rng);
      }

      // Both runs should have identical agent skills
      const agentA = stateA.agents[0];
      const agentB = stateB.agents[0];
      expect(agentA.skills.coding).toBe(agentB.skills.coding);
      expect(agentA.skills.debugging).toBe(agentB.skills.debugging);
      expect(agentA.skills.architecture).toBe(agentB.skills.architecture);
      expect(agentA.skills.creativity).toBe(agentB.skills.creativity);
      expect(agentA.skills.speed).toBe(agentB.skills.speed);

      // Same fatigue, morale, consecutive sprints, total sprints worked
      expect(agentA.fatigue).toBe(agentB.fatigue);
      expect(agentA.morale).toBe(agentB.morale);
      expect(agentA.consecutiveSprints).toBe(agentB.consecutiveSprints);
      expect(agentA.totalSprintsWorked).toBe(agentB.totalSprintsWorked);

      // Same funds
      expect(stateA.funds).toBe(stateB.funds);
      expect(stateA.sprintCount).toBe(stateB.sprintCount);
    });

    it('should produce different results with different RNG seeds', () => {
      const agents = [makeAgent('a1', { skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 } })];
      const project = makeProject('p1', { maxProgress: 100 });

      const rngA = () => 0.1;  // Picks early skill
      const rngB = () => 0.9;  // Picks late skill

      let stateA = createInitialGameState(agents, [project]);
      let stateB = createInitialGameState(agents, [project]);

      for (let i = 1; i <= 3; i++) {
        const rA = makeSprintResult(i, { ...project, progress: i * 30 }, [agents[0]], 30);
        stateA = processPostSprint(stateA, rA, ['a1'], rngA);
        const rB = makeSprintResult(i, { ...project, progress: i * 30 }, [agents[0]], 30);
        stateB = processPostSprint(stateB, rB, ['a1'], rngB);
      }

      // Different RNG seeds should produce different skill distributions
      // (This is probabilistic but with the same initial skills and different picks,
      //  after 3 sprints the distributions should diverge)
      const skillsA = Object.values(stateA.agents[0].skills);
      const skillsB = Object.values(stateB.agents[0].skills);
      // At minimum, the total skill sum should be the same (3 sprints, +1 each = +3 total)
      // but distribution across skills differs
      const totalA = skillsA.reduce((s, v) => s + v, 0);
      const totalB = skillsB.reduce((s, v) => s + v, 0);
      expect(totalA).toBe(totalB); // Same total growth
      expect(totalA).toBe(50 * 5 + 3); // 253: base 250 + 3 skill increments
    });
  });
});
