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
});
