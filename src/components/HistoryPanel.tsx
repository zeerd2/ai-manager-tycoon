import type { SprintResult } from '../domain/simulation';

interface Props {
  history: SprintResult[];
}

export function HistoryPanel({ history }: Props) {
  if (history.length === 0) {
    return <div className="history-panel"><p className="empty">No sprints completed yet.</p></div>;
  }

  return (
    <div className="history-panel">
      <h2>Sprint History</h2>
      <div className="history-list">
        {[...history].reverse().map((r, i) => (
          <div key={i} className="history-item">
            <div className="history-header">
              <strong>Sprint #{r.sprintNumber}</strong>
              <span className="history-strategy">{r.strategy.name}</span>
            </div>
            <div className="history-stats">
              <span className="positive">+{r.progressDelta} progress</span>
              <span className="negative">+{r.bugsDelta} bugs</span>
              <span>+{r.techDebtDelta} debt</span>
              <span className={r.moraleDelta >= 0 ? 'positive' : 'negative'}>
                {r.moraleDelta > 0 ? '+' : ''}{r.moraleDelta} morale
              </span>
              <span>${r.cost}</span>
            </div>
            {r.incidents.length > 0 && (
              <span className="incident-count">{r.incidents.length} incident(s)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
