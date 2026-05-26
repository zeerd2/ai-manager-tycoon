import { describe, it, expect } from 'vitest';
import { agentEffectiveness, Agent } from '../src/domain/agent';

describe('agentEffectiveness', () => {
  const createMockAgent = (overrides: Partial<Agent> = {}): Agent => {
    return {
      id: 'agent-1',
      name: 'Test Agent',
      model: 'gemini-3.5-flash',
      role: 'developer',
      avatar: 'avatar.png',
      skills: {
        coding: 80,
        debugging: 80,
        architecture: 80,
        creativity: 80,
        speed: 80,
      },
      salary: 1000,
      morale: 100,
      quirk: '',
      fatigue: 0,
      consecutiveSprints: 0,
      totalSprintsWorked: 0,
      locked: false,
      ...overrides,
    };
  };

  it('calculates effectiveness correctly for normal values', () => {
    const agent = createMockAgent({
      morale: 100,
      fatigue: 0,
    });
    // Base = 80
    // moraleMod = 0.5 + 100 / 200 = 1.0
    // fatigueMod = 1 - 0 / 200 = 1.0
    // Result = 80 * 1.0 * 1.0 = 80
    expect(agentEffectiveness(agent)).toBeCloseTo(80);
  });

  it('reduces effectiveness when fatigue is high (boundary: max fatigue)', () => {
    const agent = createMockAgent({
      morale: 100,
      fatigue: 100, // fatigueMod = 1 - 100 / 200 = 0.5
    });
    // Result = 80 * 1.0 * 0.5 = 40
    expect(agentEffectiveness(agent)).toBeCloseTo(40);
  });

  it('reduces effectiveness when morale is low (boundary: min morale)', () => {
    const agent = createMockAgent({
      morale: 0, // moraleMod = 0.5 + 0 / 200 = 0.5
      fatigue: 0,
    });
    // Result = 80 * 0.5 * 1.0 = 40
    expect(agentEffectiveness(agent)).toBeCloseTo(40);
  });

  it('increases effectiveness when morale is very high', () => {
    const agent = createMockAgent({
      morale: 150, // moraleMod = 0.5 + 150 / 200 = 1.25
      fatigue: 20,  // fatigueMod = 1 - 20 / 200 = 0.9
    });
    // Result = 80 * 1.25 * 0.9 = 90
    expect(agentEffectiveness(agent)).toBeCloseTo(90);
  });
});
