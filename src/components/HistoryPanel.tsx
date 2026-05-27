import { memo, useState, useMemo } from 'react';
import { queryHistory } from '../domain/historyQuery';
import type { GameState } from '../domain/gameState';

interface Props {
  gameState: GameState;
}

const PAGE_SIZE = 10;

export const HistoryPanel = memo(function HistoryPanel({ gameState }: Props) {
  const [projectId, setProjectId] = useState<string>('');
  const [hasBugs, setHasBugs] = useState(false);
  const [hasIncidents, setHasIncidents] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);

  const projectIds = useMemo(() => {
    const ids = new Set(gameState.history.map(h => h.project.id));
    return Array.from(ids);
  }, [gameState.history]);

  const result = useMemo(() => {
    return queryHistory(gameState, {
      projectId: projectId || undefined,
      hasBugs: hasBugs || undefined,
      hasIncidents: hasIncidents || undefined,
      order,
      offset: page * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
  }, [gameState, projectId, hasBugs, hasIncidents, order, page]);

  const totalPages = Math.ceil(result.total / PAGE_SIZE);

  if (gameState.history.length === 0) {
    return <div className="history-panel"><p className="empty">暂无已完成的 Sprint。</p></div>;
  }

  return (
    <div className="history-panel">
      <h2>Sprint 历史 <span className="count">({result.total})</span></h2>

      <div className="history-filters">
        <select value={projectId} onChange={e => { setProjectId(e.target.value); setPage(0); }}>
          <option value="">全部项目</option>
          {projectIds.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>

        <label className="filter-checkbox">
          <input type="checkbox" checked={hasBugs} onChange={e => { setHasBugs(e.target.checked); setPage(0); }} />
          有 Bug
        </label>

        <label className="filter-checkbox">
          <input type="checkbox" checked={hasIncidents} onChange={e => { setHasIncidents(e.target.checked); setPage(0); }} />
          有事件
        </label>

        <button className="btn-sort" onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}>
          {order === 'asc' ? '↑ 正序' : '↓ 倒序'}
        </button>
      </div>

      <div className="history-list">
        {result.items.map((r, i) => (
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

      {totalPages > 1 && (
        <div className="history-pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
      )}
    </div>
  );
});
