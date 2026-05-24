import { memo } from 'react';
import type { Agent } from '../domain/agent';
import { agentEffectiveness } from '../domain/agent';

interface Props {
  agent: Agent;
  selected: boolean;
  onToggle: (id: string) => void;
  onOpenSkillTree?: (agentId: string) => void;
}

export const AgentCard = memo(function AgentCard({ agent, selected, onToggle, onOpenSkillTree }: Props) {
  const eff = agentEffectiveness(agent).toFixed(1);

  if (agent.locked) {
    return (
      <div className="agent-card locked">
        <div className="lock-overlay">
          <span className="lock-icon">🔒</span>
          <span className="lock-text">Sprint {agent.unlockAfterSprints} 后解锁</span>
        </div>
        <div className="agent-header">
          <span className="avatar" style={{ filter: 'grayscale(100%)' }}>{agent.avatar}</span>
          <div>
            <h3 style={{ color: 'var(--text-dim)' }}>{agent.name}</h3>
            <span className="role">{agent.role}</span>
          </div>
        </div>
        <div className="agent-stats" style={{ opacity: 0.5 }}>
          <div className="stat"><span>编程</span><span>{agent.skills.coding}</span></div>
          <div className="stat"><span>调试</span><span>{agent.skills.debugging}</span></div>
          <div className="stat"><span>架构</span><span>{agent.skills.architecture}</span></div>
          <div className="stat"><span>创意</span><span>{agent.skills.creativity}</span></div>
          <div className="stat"><span>速度</span><span>{agent.skills.speed}</span></div>
        </div>
        <div className="agent-meta" style={{ opacity: 0.5 }}>
          <span>效率: {eff}</span>
          <span>士气: {agent.morale}</span>
          <span>${agent.salary}/sprint</span>
        </div>
        <p className="quirk" style={{ opacity: 0.3 }}>"{agent.quirk}"</p>
      </div>
    );
  }

  const isOverworked = agent.consecutiveSprints >= 3;

  return (
    <div
      className={`agent-card ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(agent.id)}
    >
      {isOverworked && (
        <span className="overwork-warning">⚠️ 过劳警告</span>
      )}

      <div className="agent-header">
        <span className="avatar">{agent.avatar}</span>
        <div>
          <h3>{agent.name}</h3>
          <span className="role">{agent.role}</span>
        </div>
      </div>
      <div className="agent-stats">
        <div className="stat"><span>编程</span><span>{agent.skills.coding}</span></div>
        <div className="stat"><span>调试</span><span>{agent.skills.debugging}</span></div>
        <div className="stat"><span>架构</span><span>{agent.skills.architecture}</span></div>
        <div className="stat"><span>创意</span><span>{agent.skills.creativity}</span></div>
        <div className="stat"><span>速度</span><span>{agent.skills.speed}</span></div>
      </div>

      <div className="agent-bars">
        <div className="bar-container">
          <span className="bar-label">士气: {agent.morale}</span>
          <div className="bar-track">
            <div className="bar-fill morale-fill" style={{ width: `${agent.morale}%` }}></div>
          </div>
        </div>

        <div className="bar-container">
          <span className="bar-label">疲劳: {agent.fatigue}</span>
          <div className="bar-track">
            <div className="bar-fill fatigue-fill" style={{ width: `${agent.fatigue}%` }}></div>
          </div>
        </div>
      </div>

      <div className="agent-meta">
        <span>效率: {eff}</span>
        <span>已工作: {agent.totalSprintsWorked}</span>
        <span>${agent.salary}/sprint</span>
      </div>
      {onOpenSkillTree && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', marginBottom: '6px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSkillTree(agent.id);
            }}
            className="btn-skill-tree-trigger"
          >
            技能树 ({agent.unlockedSkills?.length || 0})
          </button>
        </div>
      )}
      <p className="quirk">"{agent.quirk}"</p>
    </div>
  );
});
