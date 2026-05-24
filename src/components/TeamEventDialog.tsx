
import { applyTeamEventEffect } from '../domain/relations/events';
import type { PendingTeamEvent, TeamEventResult } from '../domain/relations/events';
import type { TeamEventOption } from '../domain/relations/types';
import { RelationsManager } from '../domain/relations/manager';
import type { Agent } from '../domain/agent';

interface Props {
  event: PendingTeamEvent;
  agents: Agent[];
  relationsManager: RelationsManager;
  onResolve: (result: TeamEventResult) => void;
}

export function TeamEventDialog({ event, agents, relationsManager, onResolve }: Props) {
  const handleOptionClick = (option: TeamEventOption) => {
    const allAgentIds = agents.map(a => a.id);
    const result = applyTeamEventEffect(
      option.effects,
      event.involvedAgentIds,
      allAgentIds,
      relationsManager
    );
    onResolve(result);
  };

  const getAgentNames = () => {
    const names = event.involvedAgentIds.map(id => {
      const agent = agents.find(a => a.id === id);
      return agent ? agent.name : '未知员工';
    });
    return names.join(' 和 ');
  };

  return (
    <div className="event-dialog-overlay">
      <div className="event-dialog">
        <h2>{event.template.title}</h2>
        <p className="event-description">
          {event.template.description}
          {event.involvedAgentIds.length > 0 && event.template.id.includes('code_review_war') && (
            <span className="event-actors"> (涉及员工: {getAgentNames()})</span>
          )}
        </p>
        <div className="event-options">
          {event.template.options.map(option => (
            <button
              key={option.id}
              className="event-option-btn"
              onClick={() => handleOptionClick(option)}
            >
              {option.label}
              <div className="option-effects-preview">
                {option.effects.moraleDelta !== 0 && (
                  <span className={option.effects.moraleDelta > 0 ? 'positive' : 'negative'}>
                    士气 {option.effects.moraleDelta > 0 ? '+' : ''}{option.effects.moraleDelta}
                  </span>
                )}
                {option.effects.fundsDelta !== 0 && (
                  <span className={option.effects.fundsDelta > 0 ? 'positive' : 'negative'}>
                    资金 {option.effects.fundsDelta > 0 ? '+' : ''}{option.effects.fundsDelta}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
