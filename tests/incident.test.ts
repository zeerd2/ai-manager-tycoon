import { describe, it, expect } from 'vitest';
import type { Incident, IncidentTemplate, IncidentEffects } from '../src/domain/incident';

describe('Incident Structure and Template Interpolation', () => {
  const mockTemplate: IncidentTemplate = {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} introduced a major bug',
    descriptionTemplate: (actorName: string) => `${actorName} caused a crash in production.`,
    effects: {
      progress: -10,
      bugs: 5,
      techDebt: 10,
      morale: -15,
      funds: -500,
    },
  };

  it('should correctly construct an Incident from a template (normal flow)', () => {
    const actor = 'Gemini-B';
    const incident: Incident = {
      type: mockTemplate.type,
      severity: mockTemplate.severity,
      actor: actor,
      title: mockTemplate.titleTemplate.replace('{actor}', actor),
      description: mockTemplate.descriptionTemplate(actor),
      effects: mockTemplate.effects,
    };

    expect(incident.actor).toBe('Gemini-B');
    expect(incident.title).toBe('Gemini-B introduced a major bug');
    expect(incident.description).toBe('Gemini-B caused a crash in production.');
    expect(incident.effects.progress).toBe(-10);
    expect(incident.effects.funds).toBe(-500);
  });

  it('should support optional fields and combo/rare flags (boundary conditions)', () => {
    const incident: Incident = {
      type: 'breakthrough',
      severity: 'critical',
      actor: 'Claude-3.5',
      title: 'Amazing Breakthrough',
      description: 'Superb performance.',
      effects: {
        progress: 30,
        bugs: 0,
        techDebt: -5,
        morale: 20,
      },
      isCombo: true,
      isRare: true,
      comboSource: 'synergy-effect',
    };

    expect(incident.isCombo).toBe(true);
    expect(incident.isRare).toBe(true);
    expect(incident.comboSource).toBe('synergy-effect');
    expect(incident.effects.funds).toBeUndefined(); // boundary check for optional funds
  });

  it('should handle negative/zero effect boundaries and custom descriptions (edge/exception cases)', () => {
    const zeroEffects: IncidentEffects = {
      progress: 0,
      bugs: 0,
      techDebt: 0,
      morale: 0,
      funds: 0,
    };

    const incident: Incident = {
      type: 'drama',
      severity: 'low',
      actor: 'Unknown',
      title: 'Minor argument',
      description: '',
      effects: zeroEffects,
    };

    expect(incident.effects.progress).toBe(0);
    expect(incident.effects.bugs).toBe(0);
    expect(incident.effects.morale).toBe(0);
    expect(incident.effects.funds).toBe(0);
    expect(incident.description).toBe('');
  });
});
