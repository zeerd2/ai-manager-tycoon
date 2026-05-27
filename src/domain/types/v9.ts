/**
 * v9 数据类型定义
 * 集中管理所有 v9 版本新增的 TypeScript 接口
 */

import type { AchievementCategory, AchievementRarity } from '../achievement';

// ====== 成就系统 ======

/** 成就定义（完整版） */
export interface AchievementDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  conditionType: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  /** 解锁条件描述（用于 UI 展示） */
  unlockHint?: string;
  /** 是否隐藏成就（未达成前不显示详情） */
  hidden?: boolean;
}

/** 成就进度 */
export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  display: string;
  /** 是否已解锁 */
  unlocked: boolean;
  /** 解锁时间（ISO 字符串） */
  unlockedAt?: string;
}

/** 成就统计 */
export interface AchievementStats {
  total: number;
  unlocked: number;
  /** 按类别统计 */
  byCategory: Record<AchievementCategory, { total: number; unlocked: number }>;
  /** 按稀有度统计 */
  byRarity: Record<AchievementRarity, { total: number; unlocked: number }>;
  /** 完成百分比 */
  completionPercentage: number;
}

// ====== 玩家统计 ======

/** 玩家统计数据 */
export interface PlayerStats {
  /** 总 Sprint 数 */
  totalSprints: number;
  /** 总完成项目数 */
  totalProjectsCompleted: number;
  /** 总资金花费 */
  totalFundsSpent: number;
  /** 总收益 */
  totalFundsEarned: number;
  /** 当前资金 */
  currentFunds: number;
  /** 平均 Sprint 进度 */
  averageSprintProgress: number;
  /** 最高 Sprint 进度 */
  bestSprintProgress: number;
  /** 最低 Sprint 进度 */
  worstSprintProgress: number;
  /** 总 Bug 数 */
  totalBugsCreated: number;
  /** 已修复 Bug 数 */
  totalBugsFixed: number;
  /** 声望分数 */
  reputationScore: number;
  /** 信心指数 */
  confidence: number;
  /** 团队平均士气 */
  averageMorale: number;
  /** 团队总疲劳度 */
  totalFatigue: number;
  /** 游戏时长（分钟） */
  playtimeMinutes: number;
  /** 存档次数 */
  saveCount: number;
}

/** 历史趋势数据点 */
export interface HistoryTrendPoint {
  sprintNumber: number;
  progress: number;
  bugs: number;
  cost: number;
  funds: number;
  morale: number;
}

// ====== 历史查询 ======

/** 历史查询过滤条件 */
export interface HistoryQuery {
  /** 起始 Sprint（含） */
  fromSprint?: number;
  /** 结束 Sprint（含） */
  toSprint?: number;
  /** 过滤：已完成项目 */
  completedOnly?: boolean;
  /** 过滤：有 Bug 的 Sprint */
  hasBugsOnly?: boolean;
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc';
  /** 限制返回数量 */
  limit?: number;
  /** 偏移量（分页） */
  offset?: number;
}

/** 历史查询结果 */
export interface HistoryQueryResult {
  /** 查询到的记录 */
  records: import('../simulation').SprintResult[];
  /** 总记录数（不受 limit/offset 影响） */
  total: number;
  /** 是否有更多数据 */
  hasMore: boolean;
}

// ====== 存档系统 ======

/** 存档位信息 */
export interface SaveSlot {
  /** 存档位 ID ('1', '2', '3', 'auto') */
  id: string;
  /** 存档名称 */
  name: string;
  /** Sprint 数 */
  sprintCount: number;
  /** 当前资金 */
  funds: number;
  /** 已完成项目数 */
  completedProjectsCount: number;
  /** 保存时间（ISO 字符串） */
  savedAt: string;
  /** 存档版本 */
  version: number;
  /** 是否为当前活跃存档 */
  isActive?: boolean;
  /** 存档大小（字节） */
  sizeBytes?: number;
  /** 存档校验和 */
  checksum?: string;
}

/** 存档操作状态 */
export type SaveOperationStatus = 'idle' | 'saving' | 'loading' | 'error';

/** 存档操作结果 */
export interface SaveOperationResult {
  success: boolean;
  slotId: string;
  error?: string;
  /** 操作耗时（毫秒） */
  durationMs?: number;
}

/** 自动存档配置 */
export interface AutosaveConfig {
  enabled: boolean;
  /** 间隔（分钟） */
  interval: number;
  /** 最大自动存档数 */
  maxAutosaves?: number;
}

// ====== UI 状态 ======

/** 面板加载状态 */
export interface PanelLoadingState {
  isLoading: boolean;
  error: Error | null;
  /** 加载进度 (0-100) */
  progress?: number;
}

/** 通知类型 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/** 通知消息 */
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  /** 自动消失时间（毫秒），0 表示不自动消失 */
  duration?: number;
  /** 关闭回调 */
  onClose?: () => void;
}

// ====== 游戏事件 ======

/** 游戏事件类型 */
export type GameEventType =
  | 'sprint_start'
  | 'sprint_end'
  | 'project_complete'
  | 'achievement_unlock'
  | 'agent_unlock'
  | 'quarterly_review'
  | 'save'
  | 'load'
  | 'error';

/** 游戏事件 */
export interface GameEvent {
  type: GameEventType;
  timestamp: number;
  data?: unknown;
}

// ====== 导出所有类型 ======

export type {
  AchievementCategory,
  AchievementRarity,
};
