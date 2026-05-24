import type { SprintResult } from '../domain/simulation';

interface Props {
  history: SprintResult[];
}

export function HistoryPanel({ history }: Props) {
  if (history.length === 0) {
    return <div className="history-panel"><p className="empty">暂无已完成的 Sprint。</p></div>;
  }

  return (
    <div className="history-panel">
      <h2>Sprint 历史</h2>
      <div className="history-list">
        {[...history].reverse().map((r, i) => (
          <div key={i} className="history-item">
            <div className="history-header">
              <strong>Sprint #{r.sprintNumber}</strong>
              <span className="history-strategy">{r.strategy.name}</span>
            </div>
            <div className="history-stats">
              <span className="positive">+{r.progressDelta} 进度</span>
              <span className="negative">+{r.bugsDelta} Bug</span>
              <span>+{r.techDebtDelta} 技术债</span>
              <span className={r.moraleDelta >= 0 ? 'positive' : 'negative'}>
                {r.moraleDelta > 0 ? '+' : ''}{r.moraleDelta} 士气
              </span>
              <span>${r.cost}</span>
            </div>
            {r.incidents.length > 0 && (
              <span className="incident-count">{r.incidents.length} 个事件</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
