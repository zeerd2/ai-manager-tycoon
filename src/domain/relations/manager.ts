import type { AgentRelation } from './types';

export class RelationsManager {
  private relations: AgentRelation[] = [];

  constructor(initialRelations: AgentRelation[] = []) {
    this.relations = [...initialRelations];
  }

  /** 获取当前所有关系的深拷贝列表 */
  getRelations(): AgentRelation[] {
    return [...this.relations];
  }

  /** 获取两名工程师之间的关系评分（默认 0） */
  getRelation(agentIdA: string, agentIdB: string): number {
    const relation = this.relations.find(
      r => (r.agentIdA === agentIdA && r.agentIdB === agentIdB) || 
           (r.agentIdA === agentIdB && r.agentIdB === agentIdA)
    );
    return relation ? relation.relationshipScore : 0;
  }

  /** 更新两名工程师之间的关系分值，范围限制在 [-100, 100] */
  updateRelation(agentIdA: string, agentIdB: string, delta: number): void {
    if (agentIdA === agentIdB) return;
    
    const index = this.relations.findIndex(
      r => (r.agentIdA === agentIdA && r.agentIdB === agentIdB) || 
           (r.agentIdA === agentIdB && r.agentIdB === agentIdA)
    );

    if (index !== -1) {
      const newScore = this.relations[index].relationshipScore + delta;
      this.relations[index].relationshipScore = Math.max(-100, Math.min(100, newScore));
    } else {
      const newScore = Math.max(-100, Math.min(100, delta));
      this.relations.push({
        agentIdA,
        agentIdB,
        relationshipScore: newScore
      });
    }
  }

  /** 基于当前团队成员间的平均关系计算协作效率乘数（±20%） */
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
