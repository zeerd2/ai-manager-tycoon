import type { GameState } from './gameState';
import type { SprintResult } from './simulation';
import type { IncidentType } from './incident';

export interface HistoryQuery {
  /** 按项目 ID 过滤 */
  projectId?: string;
  /** 按 Sprint 范围过滤（含） */
  sprintFrom?: number;
  sprintTo?: number;
  /** 只返回有 bug 的 sprint */
  hasBugs?: boolean;
  /** 最小 bug 数量阈值 */
  minBugs?: number;
  /** 只返回有事件的 sprint */
  hasIncidents?: boolean;
  /** 按事件类型过滤 */
  incidentType?: IncidentType;
  /** 最小进度增量 */
  minProgress?: number;
  /** 最大成本 */
  maxCost?: number;
  /** 排序方向 */
  order?: 'asc' | 'desc';
  /** 分页：跳过条数 */
  offset?: number;
  /** 分页：返回条数 */
  limit?: number;
}

export interface HistoryQueryResult {
  items: SprintResult[];
  total: number;
  hasMore: boolean;
}

/** 根据条件查询 Sprint 历史记录，支持过滤、排序和分页 */
export function queryHistory(state: GameState, query: HistoryQuery = {}): HistoryQueryResult {
  let results = [...state.history];

  // 过滤
  if (query.projectId !== undefined) {
    results = results.filter(h => h.project.id === query.projectId);
  }
  if (query.sprintFrom !== undefined) {
    results = results.filter(h => h.sprintNumber >= query.sprintFrom!);
  }
  if (query.sprintTo !== undefined) {
    results = results.filter(h => h.sprintNumber <= query.sprintTo!);
  }
  if (query.hasBugs === true) {
    results = results.filter(h => h.bugsDelta > 0);
  }
  if (query.minBugs !== undefined) {
    results = results.filter(h => h.bugsDelta >= query.minBugs!);
  }
  if (query.hasIncidents === true) {
    results = results.filter(h => h.incidents.length > 0);
  }
  if (query.incidentType !== undefined) {
    results = results.filter(h => h.incidents.some(i => i.type === query.incidentType));
  }
  if (query.minProgress !== undefined) {
    results = results.filter(h => h.progressDelta >= query.minProgress!);
  }
  if (query.maxCost !== undefined) {
    results = results.filter(h => h.cost <= query.maxCost!);
  }

  // 排序
  const order = query.order ?? 'asc';
  results.sort((a, b) => order === 'asc' ? a.sprintNumber - b.sprintNumber : b.sprintNumber - a.sprintNumber);

  const total = results.length;

  // 分页
  const offset = query.offset ?? 0;
  const limit = query.limit ?? results.length;
  const items = results.slice(offset, offset + limit);

  return { items, total, hasMore: offset + limit < total };
}

/** 获取指定项目的 Sprint 历史 */
export function getProjectHistory(state: GameState, projectId: string): SprintResult[] {
  return state.history.filter(h => h.project.id === projectId);
}

/** 获取最近 N 轮 Sprint */
export function getRecentSprints(state: GameState, count: number): SprintResult[] {
  return state.history.slice(-count);
}

/** 获取所有涉及过的事件类型及其出现次数 */
export function getIncidentSummary(state: GameState): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const h of state.history) {
    for (const inc of h.incidents) {
      summary[inc.type] = (summary[inc.type] || 0) + 1;
    }
  }
  return summary;
}
