import { describe, it, expect } from 'vitest';
import { detectCombos } from '../src/domain/comboIncident';
import type { Incident, ComboIncidentTemplate } from '../src/domain/incident';
import { runSprint } from '../src/domain/simulation';
import type { Strategy } from '../src/domain/strategy';

describe('Combo Incidents', () => {
  const templates: ComboIncidentTemplate[] = [
    {
      id: 'test_combo',
      triggerTypes: ['bug', 'overengineering'],
      severity: 'high',
      titleTemplate: 'Test Combo',
      descriptionTemplate: (actors) => `${actors[0]} and ${actors[1]} combo`,
      effects: { progress: -10, bugs: 5, techDebt: 5, morale: -5 },
    },
  ];

  it('triggers combo when types match', () => {
    // Assuming rollChance(0.5) returns true for some values. We'll mock RNG.
    const mockRng = () => 0.1; // Will pass rollChance(rng, 0.5)

    const incidents: Incident[] = [
      { type: 'bug', severity: 'low', actor: 'A', title: '1', description: '1', effects: { progress: 0, bugs: 0, techDebt: 0, morale: 0 } },
      { type: 'overengineering', severity: 'low', actor: 'B', title: '2', description: '2', effects: { progress: 0, bugs: 0, techDebt: 0, morale: 0 } },
    ];

    const combos = detectCombos(incidents, templates, mockRng);
    expect(combos).toHaveLength(1);
    expect(combos[0].isCombo).toBe(true);
    expect(combos[0].title).toBe('Test Combo');
  });

  it('does not trigger combo when types do not match', () => {
    const mockRng = () => 0.1;
    const incidents: Incident[] = [
      { type: 'bug', severity: 'low', actor: 'A', title: '1', description: '1', effects: { progress: 0, bugs: 0, techDebt: 0, morale: 0 } },
      { type: 'burnout', severity: 'low', actor: 'B', title: '2', description: '2', effects: { progress: 0, bugs: 0, techDebt: 0, morale: 0 } },
    ];
    const combos = detectCombos(incidents, templates, mockRng);
    expect(combos).toHaveLength(0);
  });
  
  it('does not trigger if roll fails', () => {
    const mockRng = () => 0.9;
    const incidents: Incident[] = [
      { type: 'bug', severity: 'low', actor: 'A', title: '1', description: '1', effects: { progress: 0, bugs: 0, techDebt: 0, morale: 0 } },
      { type: 'overengineering', severity: 'low', actor: 'B', title: '2', description: '2', effects: { progress: 0, bugs: 0, techDebt: 0, morale: 0 } },
    ];
    const combos = detectCombos(incidents, templates, mockRng);
    expect(combos).toHaveLength(0);
  });
});

describe('Rare Incidents Integration', () => {
  it('rare incidents are properly marked', () => {
    // Mock RNG to force rare incident (0.03 chance)
    const mockRng = () => 0.01; 
    
    const strategy: Strategy = { id: 's1', name: 's1', description: 's1', costMul: 1, modifiers: { progressMul: 1, bugChanceMul: 1, techDebtMul: 1, moraleDelta: 0, incidentChanceMul: 0 } };
    
    const result = runSprint(
      1,
      [],
      { id: 'p', name: 'p', maxProgress: 100, progress: 0, bugs: 0, techDebt: 0, risk: 0 },
      strategy,
      [],
      mockRng
    );
    
    expect(result.incidents.length).toBeGreaterThan(0);
    expect(result.incidents.some(i => i.isRare)).toBe(true);
  });
});
