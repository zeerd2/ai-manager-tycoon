import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createInitialGameState, 
  processPostSprint, 
  checkGameOver, 
  checkUnlocks, 
  saveGame, 
  loadGame, 
  clearSave,
  INITIAL_FUNDS 
} from '../src/domain/gameEngine';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { SprintResult } from '../src/domain/simulation';

describe('Game Engine', () => {
  let mockAgents: Agent[];
  let mockProjects: Project[];
  let mockResult: SprintResult;

  beforeEach(() => {
    mockAgents = [
      {
        id: '1',
        name: 'Agent 1',
        model: 'model-1',
        role: 'Role 1',
        avatar: 'A',
        skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
        salary: 100,
        morale: 50,
        quirk: 'None',
        fatigue: 0,
        consecutiveSprints: 0,
        totalSprintsWorked: 0,
        locked: false,
      },
      {
        id: '2',
        name: 'Agent 2',
        model: 'model-2',
        role: 'Role 2',
        avatar: 'B',
        skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
        salary: 100,
        morale: 50,
        quirk: 'None',
        fatigue: 50,
        consecutiveSprints: 2,
        totalSprintsWorked: 5,
        locked: false,
      },
      {
        id: '3',
        name: 'Agent 3',
        model: 'model-3',
        role: 'Role 3',
        avatar: 'C',
        skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 },
        salary: 100,
        morale: 50,
        quirk: 'None',
        fatigue: 0,
        consecutiveSprints: 0,
        totalSprintsWorked: 0,
        locked: true,
        unlockAfterSprints: 2,
      }
    ];

    mockProjects = [
      {
        id: 'p1',
        name: 'Project 1',
        description: 'Desc 1',
        difficulty: 10,
        urgency: 5,
        risk: 5,
        progress: 0,
        maxProgress: 100,
        bugs: 0,
        techDebt: 0,
        difficultyLevel: 'intern' as const,
      }
    ];

    mockResult = {
      sprintNumber: 1,
      project: mockProjects[0],
      agents: [mockAgents[0]],
      strategy: { id: 's1', name: 'S1', description: 'D1', modifiers: { progressMul: 1, bugChanceMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 } },
      progressDelta: 10,
      bugsDelta: 0,
      techDebtDelta: 0,
      moraleDelta: 0,
      cost: 100,
      incidents: [],
      summary: 'Summary',
    };
  });

  describe('createInitialGameState', () => {
    it('should create initial state with correct funds and agents', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      expect(state.funds).toBe(INITIAL_FUNDS);
      expect(state.sprintCount).toBe(0);
      expect(state.agents).toEqual(mockAgents);
      expect(state.projects).toEqual(mockProjects);
      expect(state.gameOver).toBe(false);
    });
  });

  describe('processPostSprint', () => {
    it('should deduct salary cost from funds', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      expect(newState.funds).toBe(INITIAL_FUNDS - mockResult.cost);
    });

    it('should increase fatigue and consecutive sprints for participating agents', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      const agent1 = newState.agents.find(a => a.id === '1')!;
      expect(agent1.fatigue).toBe(15);
      expect(agent1.consecutiveSprints).toBe(1);
      expect(agent1.totalSprintsWorked).toBe(1);
    });

    it('should decrease fatigue and increase morale for resting agents', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      const agent2 = newState.agents.find(a => a.id === '2')!;
      expect(agent2.fatigue).toBe(25); // 50 - 25
      expect(agent2.consecutiveSprints).toBe(0);
      expect(agent2.morale).toBe(58); // 50 + 8
    });

    it('should apply extra morale penalty for 3+ consecutive sprints', () => {
      mockAgents[0].consecutiveSprints = 3;
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      const agent1 = newState.agents.find(a => a.id === '1')!;
      expect(agent1.morale).toBe(45); // 50 - 5
    });

    it('should cap skill growth at 100', () => {
      mockAgents[0].skills.coding = 100;
      mockAgents[0].skills.debugging = 100;
      mockAgents[0].skills.architecture = 100;
      mockAgents[0].skills.creativity = 100;
      mockAgents[0].skills.speed = 100;
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      const agent1 = newState.agents.find(a => a.id === '1')!;
      expect(Object.values(agent1.skills).every(s => s <= 100)).toBe(true);
    });

    it('should add bonus funds when project completes', () => {
      mockResult.project.progress = 100; // max is 100
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      expect(newState.funds).toBe(INITIAL_FUNDS - mockResult.cost + (10 * 20 * 1.4));
      expect(newState.completedProjectIds).toContain('p1');
    });

    it('should initialize reputation and confidence to 50', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      expect(state.reputation).toBe(50);
      expect(state.confidence).toBe(50);
    });

    it('should gain reputation and confidence when project is completed on time', () => {
      mockResult.project.progress = 100;
      mockResult.project.deadline = 2; // sprintNumber is 1, so on time
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      expect(newState.reputation).toBeGreaterThan(50);
      expect(newState.confidence).toBeGreaterThan(50);
    });

    it('should penalize reputation and confidence and halve reward when project is completed overdue', () => {
      mockResult.project.progress = 100;
      mockResult.project.deadline = 0; // sprintNumber is 1, so overdue
      const state = createInitialGameState(mockAgents, mockProjects);
      const newState = processPostSprint(state, mockResult, ['1']);
      expect(newState.reputation).toBe(41); // 50 - 10 + 1 (from progress)
      expect(newState.confidence).toBe(40); // 50 - 10
      // Half of getDifficultyReward(mockProjects[0]) which is (10 * 20 * 1.4) = 280. Half is 140.
      expect(newState.funds).toBe(INITIAL_FUNDS - mockResult.cost + 140);
    });

    it('should evaluate quarterly KPIs and reward/penalize accordingly', () => {
      // Sprint 4 evaluation (multiple of 4)
      mockResult.sprintNumber = 4;

      // Let's test KPI Pass: completed projects >= 1 and funds >= 4000
      const statePass = createInitialGameState(mockAgents, mockProjects);
      statePass.sprintCount = 3; // next sprint is 4
      statePass.completedProjectIds = ['p1'];
      statePass.funds = 4500;
      // History entry showing project completed in sprint 1 (Q1)
      statePass.history = [{
        sprintNumber: 1,
        project: { ...mockProjects[0], progress: 100, maxProgress: 100 },
        agents: [mockAgents[0]],
        strategy: mockResult.strategy,
        progressDelta: 100,
        bugsDelta: 0,
        techDebtDelta: 0,
        moraleDelta: 0,
        cost: 100,
        incidents: [],
        summary: 'Project completed',
      }];
      const newStatePass = processPostSprint(statePass, mockResult, ['1']);
      expect(newStatePass.reputation).toBe(61); // 50 + 10 (pass) + 1 (from progress)
      expect(newStatePass.confidence).toBe(60); // 50 + 10 (pass)

      // Let's test KPI Fail: completed projects < 1
      const stateFail = createInitialGameState(mockAgents, mockProjects);
      stateFail.sprintCount = 3; // next sprint is 4
      stateFail.completedProjectIds = [];
      const newStateFail = processPostSprint(stateFail, mockResult, ['1']);
      expect(newStateFail.reputation).toBe(36); // 50 - 15 (fail) + 1 (from progress)
      expect(newStateFail.confidence).toBe(35); // 50 - 15 (fail)
    });
  });

  describe('checkGameOver', () => {
    it('should return game over when funds <= 0', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      state.funds = 0;
      const result = checkGameOver(state);
      expect(result.gameOver).toBe(true);
      expect(result.reason).toContain('公司破产了');
    });

    it('should return game over when all unlocked agents have morale <= 0', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      state.agents[0].morale = 0;
      state.agents[1].morale = 0;
      // agent 3 is locked, so it shouldn't matter
      const result = checkGameOver(state);
      expect(result.gameOver).toBe(true);
      expect(result.reason).toContain('所有员工集体罢工');
    });

    it('should not return game over otherwise', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      const result = checkGameOver(state);
      expect(result.gameOver).toBe(false);
    });
  });

  describe('checkUnlocks', () => {
    it('should return newly unlocked agent ids', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      state.sprintCount = 2;
      const unlocked = checkUnlocks(state);
      expect(unlocked).toContain('3');
    });
  });

  describe('save/load/clear', () => {
    beforeEach(() => {
      // Mock localStorage
      const store: Record<string, string> = {};
      vi.stubGlobal('localStorage', {
        getItem: vi.fn((key) => store[key] || null),
        setItem: vi.fn((key, value) => { store[key] = value.toString() }),
        removeItem: vi.fn((key) => { delete store[key] }),
      });
    });

    it('should save and load state correctly', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      saveGame(state);
      const loaded = loadGame();
      expect(loaded).toEqual(state);
    });

    it('should clear save correctly', () => {
      const state = createInitialGameState(mockAgents, mockProjects);
      saveGame(state);
      clearSave();
      const loaded = loadGame();
      expect(loaded).toBeNull();
    });
  });

  describe('quarterly target integration', () => {
    it('should use generateQuarterTarget for KPI evaluation instead of hardcoded logic', () => {
      // Q1 target is complete_projects with threshold 1
      mockResult.sprintNumber = 4;
      const state = createInitialGameState(mockAgents, mockProjects);
      state.sprintCount = 3;
      state.funds = 5000;
      // Complete a project in Q1 history
      state.completedProjectIds = ['p1'];
      state.history = [{
        sprintNumber: 1,
        project: { ...mockProjects[0], progress: 100, maxProgress: 100 },
        agents: [mockAgents[0]],
        strategy: mockResult.strategy,
        progressDelta: 100,
        bugsDelta: 0,
        techDebtDelta: 0,
        moraleDelta: 0,
        cost: 100,
        incidents: [],
        summary: 'Done',
      }];

      const newState = processPostSprint(state, mockResult, ['1']);
      expect(newState.reputation).toBeGreaterThan(50);
      expect(newState.confidence).toBeGreaterThan(50);
      expect(mockResult.quarterKpiResult).toBeDefined();
      expect(mockResult.quarterKpiResult!.passed).toBe(true);
      expect(mockResult.quarterKpiResult!.quarter).toBe(1);
    });

    it('should track evaluatedQuarters to prevent duplicate evaluation', () => {
      mockResult.sprintNumber = 4;
      const state = createInitialGameState(mockAgents, mockProjects);
      state.sprintCount = 3;
      state.completedProjectIds = ['p1'];
      state.history = [{
        sprintNumber: 1,
        project: { ...mockProjects[0], progress: 100, maxProgress: 100 },
        agents: [mockAgents[0]],
        strategy: mockResult.strategy,
        progressDelta: 100,
        bugsDelta: 0,
        techDebtDelta: 0,
        moraleDelta: 0,
        cost: 100,
        incidents: [],
        summary: 'Done',
      }];
      // Mark Q1 as already evaluated (simulating save/load)
      state.evaluatedQuarters = [1];

      const newState = processPostSprint(state, mockResult, ['1']);
      // Should NOT have quarterKpiResult since Q1 was already evaluated
      expect(mockResult.quarterKpiResult).toBeUndefined();
      // evaluatedQuarters should still contain only [1]
      expect(newState.evaluatedQuarters).toEqual([1]);
    });
  });

  describe('financing checkpoint integration', () => {
    it('should evaluate financing checkpoints at even quarter ends', () => {
      // Q2 end = sprint 8
      mockResult.sprintNumber = 8;
      const state = createInitialGameState(mockAgents, mockProjects);
      state.sprintCount = 7;
      state.funds = 3000;
      state.completedProjectIds = ['p1', 'p2', 'p3'];
      // Add history for Q1 and Q2
      state.history = [
        { sprintNumber: 1, project: { ...mockProjects[0], progress: 100, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 100, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Done' },
        { sprintNumber: 2, project: { ...mockProjects[0], id: 'p2', progress: 100, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 100, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Done' },
        { sprintNumber: 3, project: { ...mockProjects[0], id: 'p3', progress: 100, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 100, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Done' },
        { sprintNumber: 4, project: { ...mockProjects[0], id: 'p4', progress: 50, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 50, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Progress' },
        { sprintNumber: 5, project: { ...mockProjects[0], id: 'p5', progress: 50, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 50, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Progress' },
        { sprintNumber: 6, project: { ...mockProjects[0], id: 'p6', progress: 50, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 50, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Progress' },
        { sprintNumber: 7, project: { ...mockProjects[0], id: 'p7', progress: 50, maxProgress: 100 }, agents: [mockAgents[0]], strategy: mockResult.strategy, progressDelta: 50, bugsDelta: 0, techDebtDelta: 0, moraleDelta: 0, cost: 100, incidents: [], summary: 'Progress' },
      ];

      const newState = processPostSprint(state, mockResult, ['1']);
      // Q2 has angel-a checkpoint (min_funds >= 2000), funds were 3000, so triggered
      // After cost deduction (100), funds become 2900, still >= 2000
      expect(newState.funds).toBeGreaterThan(2900); // got financing reward on top
      expect(mockResult.summary).toContain('融资成功');
    });

    it('should not trigger financing checkpoints at odd quarter ends', () => {
      // Q1 end = sprint 4 (odd quarter)
      mockResult.sprintNumber = 4;
      const state = createInitialGameState(mockAgents, mockProjects);
      state.sprintCount = 3;
      state.completedProjectIds = ['p1'];
      state.history = [{
        sprintNumber: 1,
        project: { ...mockProjects[0], progress: 100, maxProgress: 100 },
        agents: [mockAgents[0]],
        strategy: mockResult.strategy,
        progressDelta: 100,
        bugsDelta: 0,
        techDebtDelta: 0,
        moraleDelta: 0,
        cost: 100,
        incidents: [],
        summary: 'Done',
      }];

      const newState = processPostSprint(state, mockResult, ['1']);
      // Q1 (odd) should not trigger any financing checkpoint
      expect(mockResult.summary).not.toContain('融资成功');
    });
  });
});
