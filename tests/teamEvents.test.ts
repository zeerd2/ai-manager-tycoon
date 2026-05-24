import { describe, expect, it } from 'vitest';
import { teamEvents } from '../src/data/teamEvents';
import { RelationsManager } from '../src/domain/relations/manager';
import { generateTeamEvent, applyTeamEventEffect } from '../src/domain/relations/events';
import { createRNG } from '../src/domain/random';
import type { Agent } from '../src/domain/agent';

describe('team event templates structure', () => {
  it('has at least 8 team event templates', () => {
    expect(teamEvents.length).toBeGreaterThanOrEqual(8);
  });

  it('every template has id, title, description, and at least 1 option', () => {
    for (const t of teamEvents) {
      expect(t.id).toBeDefined();
      expect(typeof t.id).toBe('string');
      expect(t.id.length).toBeGreaterThan(0);
      expect(t.title).toBeDefined();
      expect(typeof t.title).toBe('string');
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.description).toBeDefined();
      expect(typeof t.description).toBe('string');
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.options.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every option has id, label, and effects with moraleDelta and fundsDelta', () => {
    for (const t of teamEvents) {
      for (const opt of t.options) {
        expect(opt.id).toBeDefined();
        expect(typeof opt.id).toBe('string');
        expect(opt.label).toBeDefined();
        expect(typeof opt.label).toBe('string');
        expect(opt.effects).toBeDefined();
        expect(typeof opt.effects.moraleDelta).toBe('number');
        expect(typeof opt.effects.fundsDelta).toBe('number');
      }
    }
  });

  it('all template ids are unique', () => {
    const ids = teamEvents.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all option ids are unique within each template', () => {
    for (const t of teamEvents) {
      const optIds = t.options.map(o => o.id);
      expect(new Set(optIds).size).toBe(optIds.length);
    }
  });
});

describe('team event templates effects validation', () => {
  it('moraleDelta stays within reasonable range (-50 to 50)', () => {
    for (const t of teamEvents) {
      for (const opt of t.options) {
        expect(opt.effects.moraleDelta).toBeGreaterThanOrEqual(-50);
        expect(opt.effects.moraleDelta).toBeLessThanOrEqual(50);
      }
    }
  });

  it('fundsDelta is never positive (spending only, no income from events)', () => {
    for (const t of teamEvents) {
      for (const opt of t.options) {
        expect(opt.effects.fundsDelta).toBeLessThanOrEqual(0);
      }
    }
  });

  it('relationshipDeltas values are within reasonable range (-50 to 50)', () => {
    for (const t of teamEvents) {
      for (const opt of t.options) {
        if (opt.effects.relationshipDeltas) {
          expect(opt.effects.relationshipDeltas.delta).toBeGreaterThanOrEqual(-50);
          expect(opt.effects.relationshipDeltas.delta).toBeLessThanOrEqual(50);
        }
      }
    }
  });
});

describe('RelationsManager', () => {
  it('initialises with empty relations', () => {
    const rm = new RelationsManager();
    expect(rm.getRelations()).toEqual([]);
  });

  it('returns 0 for non-existent relation', () => {
    const rm = new RelationsManager();
    expect(rm.getRelation('a', 'b')).toBe(0);
  });

  it('updateRelation creates a new relation entry', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 50);
    expect(rm.getRelation('a', 'b')).toBe(50);
    expect(rm.getRelation('b', 'a')).toBe(50);
  });

  it('updateRelation clamps to upper bound of 100', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 100);
    expect(rm.getRelation('a', 'b')).toBe(100);
    rm.updateRelation('a', 'b', 50);
    expect(rm.getRelation('a', 'b')).toBe(100);
  });

  it('updateRelation clamps to lower bound of -100', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', -100);
    expect(rm.getRelation('a', 'b')).toBe(-100);
    rm.updateRelation('a', 'b', -50);
    expect(rm.getRelation('a', 'b')).toBe(-100);
  });

  it('updateRelation does nothing when ids are the same', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'a', 50);
    expect(rm.getRelations()).toEqual([]);
  });

  it('getCollaborationMultiplier returns 1.0 for fewer than 2 agents', () => {
    const rm = new RelationsManager();
    expect(rm.getCollaborationMultiplier([])).toBe(1.0);
    expect(rm.getCollaborationMultiplier(['a'])).toBe(1.0);
  });

  it('getCollaborationMultiplier returns 1.2 for max positive relations', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 100);
    expect(rm.getCollaborationMultiplier(['a', 'b'])).toBeCloseTo(1.2);
  });

  it('getCollaborationMultiplier returns 0.8 for max negative relations', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', -100);
    expect(rm.getCollaborationMultiplier(['a', 'b'])).toBeCloseTo(0.8);
  });

  it('getCollaborationMultiplier averages across all pairs', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 100);
    rm.updateRelation('a', 'c', 0);
    rm.updateRelation('b', 'c', -100);
    // avg = (100 + 0 + -100) / 3 = 0
    expect(rm.getCollaborationMultiplier(['a', 'b', 'c'])).toBeCloseTo(1.0);
  });

  it('updateRelation accumulates delta correctly', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 30);
    rm.updateRelation('a', 'b', 20);
    expect(rm.getRelation('a', 'b')).toBe(50);
    rm.updateRelation('a', 'b', -80);
    expect(rm.getRelation('a', 'b')).toBe(-30);
  });
});

describe('applyTeamEventEffect', () => {
  it('returns correct moraleDelta and fundsDelta', () => {
    const result = applyTeamEventEffect(
      { moraleDelta: 15, fundsDelta: -200 },
      ['a', 'b'],
      ['a', 'b'],
      new RelationsManager()
    );
    expect(result.moraleDelta).toBe(15);
    expect(result.fundsDelta).toBe(-200);
    expect(result.progressDelta).toBe(0);
    expect(result.bugsDelta).toBe(0);
  });

  it('applies relationshipDelta to all agents when all=true', () => {
    const rm = new RelationsManager();
    applyTeamEventEffect(
      { moraleDelta: 0, fundsDelta: 0, relationshipDeltas: { delta: 10, all: true } },
      ['a', 'b'],
      ['x', 'y', 'z'],
      rm
    );
    expect(rm.getRelation('x', 'y')).toBe(10);
    expect(rm.getRelation('x', 'z')).toBe(10);
    expect(rm.getRelation('y', 'z')).toBe(10);
  });

  it('applies relationshipDelta only to involved agents when all=false', () => {
    const rm = new RelationsManager();
    applyTeamEventEffect(
      { moraleDelta: 0, fundsDelta: 0, relationshipDeltas: { delta: -20, all: false } },
      ['alice', 'bob'],
      ['alice', 'bob', 'charlie'],
      rm
    );
    expect(rm.getRelation('alice', 'bob')).toBe(-20);
    expect(rm.getRelation('alice', 'charlie')).toBe(0);
    expect(rm.getRelation('bob', 'charlie')).toBe(0);
  });

  it('handles missing relationshipDeltas gracefully', () => {
    const rm = new RelationsManager();
    const result = applyTeamEventEffect(
      { moraleDelta: 5, fundsDelta: 0 },
      ['a', 'b'],
      ['a', 'b'],
      rm
    );
    expect(result.moraleDelta).toBe(5);
    expect(rm.getRelations()).toEqual([]);
  });

  it('handles progressDelta and bugsDelta when present', () => {
    const result = applyTeamEventEffect(
      { moraleDelta: 10, fundsDelta: -500, progressDelta: 20, bugsDelta: -10 },
      ['a', 'b'],
      ['a', 'b'],
      new RelationsManager()
    );
    expect(result.progressDelta).toBe(20);
    expect(result.bugsDelta).toBe(-10);
  });
});

describe('generateTeamEvent', () => {
  it('returns null when fewer than 2 agents', () => {
    const agents: Agent[] = [
      { id: 'a', name: 'A', model: 'm', role: 'r', avatar: 'a', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false }
    ];
    const rng = createRNG(42);
    const event = generateTeamEvent(agents, rng);
    expect(event).toBeNull();
  });

  it('returns null when rng does not trigger (85% chance of null)', () => {
    const agents: Agent[] = [
      { id: 'a', name: 'A', model: 'm', role: 'r', avatar: 'a', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false },
      { id: 'b', name: 'B', model: 'm', role: 'r', avatar: 'b', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false }
    ];
    // Use an RNG that returns a value > 0.15 on first call (deterministic)
    const alwaysFailRng = () => 0.99;
    const event = generateTeamEvent(agents, alwaysFailRng);
    expect(event).toBeNull();
  });

  it('returns a PendingTeamEvent when rng triggers', () => {
    const agents: Agent[] = [
      { id: 'a', name: 'A', model: 'm', role: 'r', avatar: 'a', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false },
      { id: 'b', name: 'B', model: 'm', role: 'r', avatar: 'b', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false }
    ];
    const alwaysTriggerRng = () => 0.01;
    const event = generateTeamEvent(agents, alwaysTriggerRng);
    expect(event).not.toBeNull();
    expect(event!.template).toBeDefined();
    expect(event!.template.id).toBeDefined();
    expect(event!.involvedAgentIds).toHaveLength(2);
    expect(agents.map(a => a.id)).toContain(event!.involvedAgentIds[0]);
    expect(agents.map(a => a.id)).toContain(event!.involvedAgentIds[1]);
  });

  it('returns distinct involved agents', () => {
    const agents: Agent[] = [
      { id: 'x', name: 'X', model: 'm', role: 'r', avatar: 'a', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false },
      { id: 'y', name: 'Y', model: 'm', role: 'r', avatar: 'b', skills: { coding: 50, debugging: 50, architecture: 50, creativity: 50, speed: 50 }, salary: 100, morale: 50, quirk: 'q', fatigue: 0, consecutiveSprints: 0, totalSprintsWorked: 0, locked: false }
    ];
    const alwaysTriggerRng = () => 0.01;
    const event = generateTeamEvent(agents, alwaysTriggerRng);
    expect(event!.involvedAgentIds[0]).not.toBe(event!.involvedAgentIds[1]);
  });
});

describe('RelationsManager edge cases', () => {
  it('handles many agents without performance issues', () => {
    const rm = new RelationsManager();
    const ids = Array.from({ length: 20 }, (_, i) => `agent-${i}`);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        rm.updateRelation(ids[i], ids[j], (i + j) % 100 - 50);
      }
    }
    const mult = rm.getCollaborationMultiplier(ids.slice(0, 5));
    expect(mult).toBeGreaterThanOrEqual(0.8);
    expect(mult).toBeLessThanOrEqual(1.2);
  });

  it('does not corrupt other relations when updating one pair', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 50);
    rm.updateRelation('c', 'd', -50);
    rm.updateRelation('a', 'b', -10);
    expect(rm.getRelation('a', 'b')).toBe(40);
    expect(rm.getRelation('c', 'd')).toBe(-50);
  });

  it('initialising with pre-existing relations works', () => {
    const rm = new RelationsManager([
      { agentIdA: 'a', agentIdB: 'b', relationshipScore: 75 }
    ]);
    expect(rm.getRelation('a', 'b')).toBe(75);
    expect(rm.getRelations()).toHaveLength(1);
  });

  it('getRelations does not leak internal array mutations', () => {
    const rm = new RelationsManager();
    rm.updateRelation('a', 'b', 30);
    const relations = rm.getRelations();
    const newLen = relations.push({ agentIdA: 'x', agentIdB: 'y', relationshipScore: 999 });
    expect(rm.getRelations()).toHaveLength(1);
    expect(newLen).toBe(2);
  });
});
