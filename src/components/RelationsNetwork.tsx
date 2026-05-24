import { memo } from 'react';
import type { AgentRelation } from '../domain/relations/types';
import type { Agent } from '../domain/agent';
import { RelationsManager } from '../domain/relations/manager';

interface Props {
  agents: Agent[];
  relations: AgentRelation[];
}

export const RelationsNetwork = memo(function RelationsNetwork({ agents, relations }: Props) {
  const manager = new RelationsManager(relations);
  const unlockedAgents = agents.filter(a => !a.locked);

  if (unlockedAgents.length < 2) {
    return <div className="relations-empty">团队人数不足，无法形成社交网络。</div>;
  }

  const getRelationClass = (score: number) => {
    if (score >= 50) return 'relation-great';
    if (score >= 20) return 'relation-good';
    if (score <= -50) return 'relation-terrible';
    if (score <= -20) return 'relation-bad';
    return 'relation-neutral';
  };

  const getRelationText = (score: number) => {
    if (score >= 50) return '知音';
    if (score >= 20) return '友好';
    if (score <= -50) return '死敌';
    if (score <= -20) return '不合';
    return '普通';
  };

  return (
    <div className="relations-network">
      <h3>团队关系网络</h3>
      <div className="relations-grid">
        {unlockedAgents.map((agentA, i) => (
          unlockedAgents.slice(i + 1).map(agentB => {
            const score = manager.getRelation(agentA.id, agentB.id);
            if (Math.abs(score) < 10) return null; // Only show significant relations
            
            return (
              <div key={`${agentA.id}-${agentB.id}`} className={`relation-item ${getRelationClass(score)}`}>
                <span className="relation-agent">{agentA.name}</span>
                <span className="relation-score" title={`Score: ${score}`}>
                  {getRelationText(score)} ({score > 0 ? '+' : ''}{score})
                </span>
                <span className="relation-agent">{agentB.name}</span>
              </div>
            );
          })
        ))}
        {relations.length === 0 && (
          <div className="relations-empty">大家目前都是普通同事。</div>
        )}
      </div>
    </div>
  );
});
