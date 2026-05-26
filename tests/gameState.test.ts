import { describe, it, expect } from 'vitest';
import type { GameState } from '../src/domain/gameState';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';

describe('GameState Types and Structures', () => {
  const createMockGameState = (overrides: Partial<GameState> = {}): GameState => {
    return {
      funds: 10000,
      sprintCount: 0,
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
    };
  };

  it('should initialize a valid game state with default properties', () => {
    const state = createMockGameState();
    expect(state.funds).toBe(10000);
    expect(state.sprintCount).toBe(0);
    expect(state.agents).toEqual([]);
    expect(state.projects).toEqual([]);
    expect(state.completedProjectIds).toEqual([]);
    expect(state.unlockedAchievementIds).toEqual([]);
    expect(state.gameOver).toBe(false);
    expect(state.history).toEqual([]);
    expect(state.relations).toEqual([]);
    expect(state.reputation).toBe(50);
    expect(state.confidence).toBe(50);
  });

  it('should support adding agents and projects to the state (normal transition)', () => {
    const state = createMockGameState();
    const mockAgent: Agent = {
      id: 'agent-1',
      name: 'Agent A',
      model: 'model-a',
      role: 'role-a',
      avatar: 'avatar-a',
      skills: { coding: 70, debugging: 70, architecture: 70, creativity: 70, speed: 70 },
      salary: 2000,
      morale: 100,
      quirk: '',
      fatigue: 0,
      consecutiveSprints: 0,
      totalSprintsWorked: 0,
      locked: false,
    };
    const mockProject: Project = {
      id: 'project-1',
      name: 'Project A',
      description: 'desc-a',
      difficulty: 50,
      urgency: 5,
      risk: 5,
      progress: 0,
      maxProgress: 100,
      bugs: 0,
      techDebt: 0,
      difficultyLevel: 'junior',
    };

    state.agents.push(mockAgent);
    state.projects.push(mockProject);

    expect(state.agents).toHaveLength(1);
    expect(state.agents[0].id).toBe('agent-1');
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].id).toBe('project-1');
  });

  it('should handle optional game over reasons and triggered checkpoints (boundary/optional fields)', () => {
    const state = createMockGameState({
      gameOver: true,
      gameOverReason: 'Bankruptcy',
      triggeredCheckpoints: ['checkpoint-1'],
    });

    expect(state.gameOver).toBe(true);
    expect(state.gameOverReason).toBe('Bankruptcy');
    expect(state.triggeredCheckpoints).toContain('checkpoint-1');
  });
});
