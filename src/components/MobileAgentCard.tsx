import { memo } from 'react';
import type { Agent } from '../domain/agent';
import { agentEffectiveness } from '../domain/agent';

interface Props {
  agent: Agent;
  selected: boolean;
  onToggle: (id: string) => void;
  onOpenSkillTree?: (agentId: string) => void;
}

export const MobileAgentCard = memo(function MobileAgentCard({ agent, selected, onToggle, onOpenSkillTree }: Props) {
  const eff = agentEffectiveness(agent).toFixed(1);

  if (agent.locked) {
    return (
      <div className="mobile-agent-card locked">
        <div className="mobile-agent-header">
          <span className="avatar" style={{ filter: 'grayscale(100%)' }}>{agent.avatar}</span>
          <div className="info">
            <h3 className="name" style={{ color: 'var(--text-dim)' }}>{agent.name}</h3>
            <span className="role">{agent.role}</span>
          </div>
          <div className="lock-badge">
            🔒 Sprint {agent.unlockAfterSprints} 解锁
          </div>
        </div>
      </div>
    );
  }

  const isOverworked = agent.consecutiveSprints >= 3;

  return (
    <div
      className={`mobile-agent-card ${selected ? 'selected' : ''}`}
      onClick={() => onToggle(agent.id)}
    >
      <div className="mobile-agent-header">
        <div className="avatar-selection-wrapper">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}} // Controlled by outer div onClick
            className="mobile-agent-checkbox"
          />
          <span className="avatar">{agent.avatar}</span>
        </div>

        <div className="info">
          <div className="name-wrapper">
            <h3 className="name">{agent.name}</h3>
            {isOverworked && (
              <span className="overwork-badge" title="工程师已连续工作，需休息">⚠️ 过劳</span>
            )}
          </div>
          <span className="role">{agent.role}</span>
        </div>

        {onOpenSkillTree && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenSkillTree(agent.id);
            }}
            className="btn-skill-tree-trigger-mobile"
          >
            技能 ({agent.unlockedSkills?.length || 0})
          </button>
        )}
      </div>

      <div className="mobile-agent-stats-grid">
        <div className="stat-item" title="工作效率">
          <span className="label">效率:</span>
          <span className="value text-accent">{eff}</span>
        </div>
        <div className="stat-item" title="固定薪资">
          <span className="label">薪资:</span>
          <span className="value">${agent.salary}</span>
        </div>
        <div className="stat-item" title="士气度">
          <span className="label">士气:</span>
          <span className={`value ${agent.morale < 30 ? 'text-negative' : agent.morale > 70 ? 'text-positive' : ''}`}>{agent.morale}</span>
        </div>
        <div className="stat-item" title="疲劳度">
          <span className="label">疲劳:</span>
          <span className={`value ${agent.fatigue > 70 ? 'text-negative' : ''}`}>{agent.fatigue}</span>
        </div>
      </div>

      <div className="mobile-agent-skills-mini">
        <span>💻 {agent.skills.coding}</span>
        <span>🔍 {agent.skills.debugging}</span>
        <span>🏛️ {agent.skills.architecture}</span>
        <span>💡 {agent.skills.creativity}</span>
        <span>⚡ {agent.skills.speed}</span>
      </div>
    </div>
  );
});
