import type { Agent } from '../domain/agent';
import { agentEffectiveness } from '../domain/agent';

interface Props {
  agent: Agent;
  selected: boolean;
  onToggle: (id: string) => void;
}

export function AgentCard({ agent, selected, onToggle }: Props) {
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
          <div className="stat"><span>Coding</span><span>{agent.skills.coding}</span></div>
          <div className="stat"><span>Debug</span><span>{agent.skills.debugging}</span></div>
          <div className="stat"><span>Arch</span><span>{agent.skills.architecture}</span></div>
          <div className="stat"><span>Create</span><span>{agent.skills.creativity}</span></div>
          <div className="stat"><span>Speed</span><span>{agent.skills.speed}</span></div>
        </div>
        <div className="agent-meta" style={{ opacity: 0.5 }}>
          <span>Eff: {eff}</span>
          <span>Morale: {agent.morale}</span>
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
        <div className="stat"><span>Coding</span><span>{agent.skills.coding}</span></div>
        <div className="stat"><span>Debug</span><span>{agent.skills.debugging}</span></div>
        <div className="stat"><span>Arch</span><span>{agent.skills.architecture}</span></div>
        <div className="stat"><span>Create</span><span>{agent.skills.creativity}</span></div>
        <div className="stat"><span>Speed</span><span>{agent.skills.speed}</span></div>
      </div>

      <div className="agent-bars">
        <div className="bar-container">
          <span className="bar-label">Morale: {agent.morale}</span>
          <div className="bar-track">
            <div className="bar-fill morale-fill" style={{ width: `${agent.morale}%` }}></div>
          </div>
        </div>

        <div className="bar-container">
          <span className="bar-label">Fatigue: {agent.fatigue}</span>
          <div className="bar-track">
            <div className="bar-fill fatigue-fill" style={{ width: `${agent.fatigue}%` }}></div>
          </div>
        </div>
      </div>

      <div className="agent-meta">
        <span>Eff: {eff}</span>
        <span>Sprints: {agent.totalSprintsWorked}</span>
        <span>${agent.salary}/sprint</span>
      </div>
      <p className="quirk">"{agent.quirk}"</p>
    </div>
  );
}
