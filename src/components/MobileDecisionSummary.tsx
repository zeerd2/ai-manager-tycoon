import type { Agent } from '../domain/agent';
import type { Project } from '../domain/project';
import type { Strategy } from '../domain/strategy';

interface Props {
  selectedProject: Project | null;
  selectedStrategy: Strategy | null;
  selectedAgents: Agent[];
}

export function MobileDecisionSummary({ selectedProject, selectedStrategy, selectedAgents }: Props) {
  const visibleAvatars = selectedAgents.slice(0, 4);
  const remainingCount = selectedAgents.length - visibleAvatars.length;

  return (
    <section className="mobile-decision-summary" aria-label="当前 Sprint 决策摘要">
      <div className="mobile-summary-card">
        <span className="mobile-summary-label">当前项目</span>
        <strong>{selectedProject?.name ?? '未选择项目'}</strong>
      </div>
      <div className="mobile-summary-card">
        <span className="mobile-summary-label">当前策略</span>
        <strong>{selectedStrategy?.name ?? '未选择策略'}</strong>
      </div>
      <div className="mobile-summary-card mobile-agent-summary">
        <span className="mobile-summary-label">已选员工</span>
        <div className="mobile-agent-avatars" aria-label={`已选员工 ${selectedAgents.length} 人`}>
          {visibleAvatars.map(agent => (
            <span key={agent.id} className="mobile-agent-avatar" title={agent.name}>{agent.avatar}</span>
          ))}
          {remainingCount > 0 && <span className="mobile-agent-avatar">+{remainingCount}</span>}
          {selectedAgents.length === 0 && <span className="mobile-summary-empty">未选择</span>}
        </div>
        <strong>{selectedAgents.length} 人</strong>
      </div>
    </section>
  );
}
