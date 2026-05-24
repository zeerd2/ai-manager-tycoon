import type { AgentRelation } from './types';

export class RelationsManager {
  private relations: AgentRelation[] = [];

  constructor(initialRelations: AgentRelation[] = []) {
    this.relations = [...initialRelations];
  }

  getRelations(): AgentRelation[] {
    return [...this.relations];
  }

  getRelation(agentIdA: string, agentIdB: string): number {
    const relation = this.relations.find(
      r => (r.agentIdA === agentIdA && r.agentIdB === agentIdB) || 
           (r.agentIdA === agentIdB && r.agentIdB === agentIdA)
    );
    return relation ? relation.relationshipScore : 0;
  }

  updateRelation(agentIdA: string, agentIdB: string, delta: number): void {
    if (agentIdA === agentIdB) return;
    
    const index = this.relations.findIndex(
      r => (r.agentIdA === agentIdA && r.agentIdB === agentIdB) || 
           (r.agentIdA === agentIdB && r.agentIdB === agentIdA)
    );

    if (index !== -1) {
      let newScore = this.relations[index].relationshipScore + delta;
      this.relations[index].relationshipScore = Math.max(-100, Math.min(100, newScore));
    } else {
      let newScore = Math.max(-100, Math.min(100, delta));
      this.relations.push({
        agentIdA,
        agentIdB,
        relationshipScore: newScore
      });
    }
  }

  // Effect on sprint efficiency based on relations
  // Returns a multiplier, e.g., 1.1 for 10% boost, 0.9 for 10% penalty
  getCollaborationMultiplier(agentIds: string[]): number {
    if (agentIds.length < 2) return 1.0;

    let totalScore = 0;
    let pairs = 0;

    for (let i = 0; i < agentIds.length; i++) {
      for (let j = i + 1; j < agentIds.length; j++) {
        totalScore += this.getRelation(agentIds[i], agentIds[j]);
        pairs++;
      }
    }

    const avgScore = totalScore / pairs;
    
    // Scale: 
    // +100 score -> 1.2x (20% boost)
    // -100 score -> 0.8x (20% penalty)
    return 1.0 + (avgScore / 100) * 0.2;
  }
}
