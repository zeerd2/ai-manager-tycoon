import { memo } from 'react';
import type { Agent } from '../domain/agent';
import { agentEffectiveness } from '../domain/agent';
import './AgentCard.css';

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
          <div className="stat" title="编程能力：影响 Sprint 的进度产生量。"><span>编程</span><span>{agent.skills.coding}</span></div>
          <div className="stat" title="调试能力：降低在开发过程中产生 Bug 的概率。"><span>调试</span><span>{agent.skills.debugging}</span></div>
          <div className="stat" title="架构能力：降低代码技术债的增加速度。"><span>架构</span><span>{agent.skills.architecture}</span></div>
          <div className="stat" title="创意能力：增加触发正面随机事件的概率。"><span>创意</span><span>{agent.skills.creativity}</span></div>
          <div className="stat" title="速度：提升进度产生的基准速度。"><span>速度</span><span>{agent.skills.speed}</span></div>
        </div>
        <div className="agent-meta" style={{ opacity: 0.5 }}>
          <span title="工作效率系数，由各项属性及士气决定。数值越高，Sprint 中产生的进度越多。">效率: {eff}</span>
          <span title="士气影响工作效率，过低会导致罢工。让工程师休息（不选中他们执行Sprint）会回复士气。">士气: {agent.morale}</span>
          <span title="每回合(Sprint)雇佣该工程师需要支付的固定薪资。">${agent.salary}/sprint</span>
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
        <span className="overwork-warning" title="该工程师已连续工作 3 个轮次以上，下回合需让他休息，否则士气将持续降低。">⚠️ 过劳警告</span>
      )}

      <div className="agent-header">
        <span className="avatar">{agent.avatar}</span>
        <div>
          <h3>{agent.name}</h3>
          <span className="role">{agent.role}</span>
        </div>
      </div>
      <div className="agent-stats">
        <div className="stat" title="编程能力：影响 Sprint 的进度产生量。"><span>编程</span><span>{agent.skills.coding}</span></div>
        <div className="stat" title="调试能力：降低在开发过程中产生 Bug 的概率。"><span>调试</span><span>{agent.skills.debugging}</span></div>
        <div className="stat" title="架构能力：降低代码技术债的增加速度。"><span>架构</span><span>{agent.skills.architecture}</span></div>
        <div className="stat" title="创意能力：增加触发正面随机事件的概率。"><span>创意</span><span>{agent.skills.creativity}</span></div>
        <div className="stat" title="速度：提升进度产生的基准速度。"><span>速度</span><span>{agent.skills.speed}</span></div>
      </div>

      <div className="agent-bars">
        <div className="bar-container" title="士气影响工作效率，过低会导致罢工。让工程师休息（不选中他们执行Sprint）会回复士气。">
          <span className="bar-label">士气: {agent.morale}</span>
          <div className="bar-track">
            <div className="bar-fill morale-fill" style={{ width: `${agent.morale}%` }}></div>
          </div>
        </div>

        <div className="bar-container" title="疲劳度过高会导致过劳和降低士气。让工程师在 Sprint 中休息可快速恢复疲劳值。">
          <span className="bar-label">疲劳: {agent.fatigue}</span>
          <div className="bar-track">
            <div className="bar-fill fatigue-fill" style={{ width: `${agent.fatigue}%` }}></div>
          </div>
        </div>
      </div>

      <div className="agent-meta">
        <span title="工作效率系数，由各项属性及士气决定。数值越高，Sprint 中产生的进度越多。">效率: {eff}</span>
        <span title="该工程师累计参与工作的 Sprint 轮次。">已工作: {agent.totalSprintsWorked}</span>
        <span title="每回合(Sprint)雇佣该工程师需要支付的固定薪资。">${agent.salary}/sprint</span>
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
