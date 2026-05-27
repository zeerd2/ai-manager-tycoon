/**
 * 类型定义统一导出
 */

// v9 类型
export type {
  AchievementDefinition,
  AchievementProgress,
  AchievementStats,
  PlayerStats,
  HistoryTrendPoint,
  HistoryQuery,
  HistoryQueryResult,
  SaveSlot,
  SaveOperationStatus,
  SaveOperationResult,
  AutosaveConfig,
  PanelLoadingState,
  NotificationType,
  Notification,
  GameEventType,
  GameEvent,
} from './v9';

// 从现有模块重新导出常用类型
export type { GameState } from '../gameState';
export type { Achievement, AchievementCategory, AchievementRarity } from '../achievement';
export type { SaveMetadata, SaveData, SaveValidationResult } from '../saveSystem';
export type { Agent } from '../agent';
export type { Project } from '../project';
export type { Strategy } from '../strategy';
export type { SprintResult } from '../simulation';
export type { RNG } from '../random';
export type { AgentRelation } from '../relations/types';
export type { QuarterEvaluation, QuarterTarget, QuarterTargetType } from '../quarterlyTarget';
export type { FinancingCheckpoint, FinancingResult, CheckpointCondition } from '../financing';
export type { CompanyRating } from '../rating';
