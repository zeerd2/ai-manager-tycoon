import type { Agent } from '../agent';
import { teamEvents } from '../../data/teamEvents';
import type { TeamEventTemplate, TeamEventEffect } from './types';
import { RelationsManager } from './manager';
import { rollChance } from '../random';
import type { RNG } from '../random';

export interface PendingTeamEvent {
  template: TeamEventTemplate;
  involvedAgentIds: string[]; // For specific agent events like gossip or code review
}

/** 15% 概率触发团队社交事件，返回待处理事件（包含两名随机工程师） */
export function generateTeamEvent(agents: Agent[], rng: RNG): PendingTeamEvent | null {
  // Only trigger events if there are enough agents
  if (agents.length < 2) return null;

  // 15% chance to trigger a team event per sprint
  if (!rollChance(rng, 0.15)) return null;

  // Pick a random event
  const template = teamEvents[Math.floor(rng() * teamEvents.length)];
  
  // Pick 2 random distinct agents for events that require specific actors
  const shuffled = [...agents].sort(() => 0.5 - rng());
  const involvedAgentIds = [shuffled[0].id, shuffled[1].id];

  return {
    template,
    involvedAgentIds
  };
}

export interface TeamEventResult {
  message: string;
  moraleDelta: number;
  fundsDelta: number;
  progressDelta: number;
  bugsDelta: number;
}

/** 应用团队事件的选择结果，更新关系和游戏数值 */
export function applyTeamEventEffect(
  effect: TeamEventEffect, 
  involvedAgentIds: string[], 
  allAgentIds: string[], 
  relationsManager: RelationsManager
): TeamEventResult {
  
  // Apply relation changes
  if (effect.relationshipDeltas) {
    if (effect.relationshipDeltas.all) {
      // Apply to all possible pairs
      for (let i = 0; i < allAgentIds.length; i++) {
        for (let j = i + 1; j < allAgentIds.length; j++) {
          relationsManager.updateRelation(allAgentIds[i], allAgentIds[j], effect.relationshipDeltas.delta);
        }
      }
    } else {
      const agentIdA = effect.relationshipDeltas.agentIdA ?? involvedAgentIds[0];
      const agentIdB = effect.relationshipDeltas.agentIdB ?? involvedAgentIds[1];
      if (agentIdA && agentIdB) {
        relationsManager.updateRelation(agentIdA, agentIdB, effect.relationshipDeltas.delta);
      }
    }
  }

  return {
    message: "Event resolved.",
    moraleDelta: effect.moraleDelta || 0,
    fundsDelta: effect.fundsDelta || 0,
    progressDelta: effect.progressDelta || 0,
    bugsDelta: effect.bugsDelta || 0
  };
}
