import { describe, it, expect } from 'vitest';
import { sampleProjects } from '../src/data/sampleProjects';
import { calculateSprintScores } from '../src/domain/scoring';
import { DIFFICULTY_CONFIGS, getDifficultyReward, type DifficultyLevel } from '../src/domain/project';
import type { Agent } from '../src/domain/agent';
import type { Project } from '../src/domain/project';
import type { Strategy } from '../src/domain/strategy';

const beginnerAgent: Agent = {
  id: 'beginner',
  name: 'Beginner Agent',
  model: 'test-model',
  role: 'Tester',
  avatar: 'B',
  skills: { coding: 55, debugging: 55, architecture: 50, creativity: 50, speed: 55 },
  salary: 100,
  morale: 80,
  quirk: 'none',
  fatigue: 0,
  consecutiveSprints: 0,
  totalSprintsWorked: 0,
  locked: false,
};

const neutralStrategy: Strategy = {
  id: 'neutral',
  name: 'Neutral',
  description: 'test',
  modifiers: { progressMul: 1, bugMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 1 },
};

function projectsByLevel(level: DifficultyLevel): Project[] {
  return sampleProjects.filter(project => project.difficultyLevel === level);
}

describe('difficulty balance curves', () => {
  it('uses the four supported difficulty levels in a playable progression', () => {
    expect(Object.keys(DIFFICULTY_CONFIGS)).toEqual(['intern', 'normal', 'hard', 'legend']);
    expect(DIFFICULTY_CONFIGS.intern.requiredCompletedProjects).toBe(0);
    expect(DIFFICULTY_CONFIGS.normal.requiredCompletedProjects).toBe(2);
    expect(DIFFICULTY_CONFIGS.hard.requiredCompletedProjects).toBe(5);
    expect(DIFFICULTY_CONFIGS.legend.requiredCompletedProjects).toBe(10);
  });

  it('keeps intern projects forgiving for new players', () => {
    const internProjects = projectsByLevel('intern');

    expect(internProjects.length).toBeGreaterThan(0);
    expect(Math.max(...internProjects.map(project => project.difficulty))).toBeLessThanOrEqual(35);
    expect(Math.max(...internProjects.map(project => project.risk))).toBeLessThanOrEqual(20);
    expect(Math.max(...internProjects.map(project => project.maxProgress))).toBeLessThanOrEqual(70);

    for (const project of internProjects) {
      const sprint = calculateSprintScores([beginnerAgent], project, neutralStrategy);
      expect(sprint.rawProgress).toBeGreaterThanOrEqual(55);
      expect(getDifficultyReward(project)).toBeGreaterThanOrEqual(sprint.totalCost * 3);
    }
  });

  it('keeps legend projects costly but possible for a strong late-game team', () => {
    const legendProjects = projectsByLevel('legend');
    const lateGameTeam = [
      { ...beginnerAgent, id: 'lead', salary: 320, skills: { coding: 95, debugging: 90, architecture: 95, creativity: 90, speed: 90 }, morale: 90 },
      { ...beginnerAgent, id: 'debugger', salary: 280, skills: { coding: 88, debugging: 98, architecture: 86, creativity: 80, speed: 85 }, morale: 88 },
      { ...beginnerAgent, id: 'architect', salary: 300, skills: { coding: 86, debugging: 85, architecture: 98, creativity: 86, speed: 82 }, morale: 90 },
    ];

    expect(legendProjects.length).toBeGreaterThan(0);
    expect(Math.min(...legendProjects.map(project => project.difficulty))).toBeGreaterThanOrEqual(92);
    expect(Math.max(...legendProjects.map(project => project.risk))).toBeLessThanOrEqual(92);

    for (const project of legendProjects) {
      const sprint = calculateSprintScores(lateGameTeam, project, neutralStrategy);
      const estimatedSprints = Math.ceil(project.maxProgress / sprint.rawProgress);
      expect(estimatedSprints).toBeLessThanOrEqual(5);
      expect(getDifficultyReward(project)).toBeGreaterThanOrEqual(sprint.totalCost * estimatedSprints);
      expect(getDifficultyReward(project)).toBeLessThanOrEqual(sprint.totalCost * (estimatedSprints + 2));
    }
  });

  it('raises sprint operating cost with project difficulty, urgency, and risk', () => {
    const baseProject: Project = {
      id: 'base',
      name: 'Base',
      description: 'test',
      difficulty: 25,
      urgency: 25,
      risk: 15,
      progress: 0,
      bugs: 0,
      techDebt: 0,
      maxProgress: 60,
      difficultyLevel: 'intern',
    };
    const harderProject: Project = {
      ...baseProject,
      difficulty: 90,
      urgency: 85,
      risk: 90,
      maxProgress: 220,
      difficultyLevel: 'legend',
    };

    const baseCost = calculateSprintScores([beginnerAgent], baseProject, neutralStrategy).totalCost;
    const harderCost = calculateSprintScores([beginnerAgent], harderProject, neutralStrategy).totalCost;

    expect(baseCost).toBeGreaterThan(100);
    expect(harderCost).toBeGreaterThan(baseCost * 2);
  });
});
