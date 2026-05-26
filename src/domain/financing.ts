import type { GameState } from './gameState';
import type { CompanyRating } from './rating';

export type CheckpointConditionType =
  | 'min_completed_projects'
  | 'min_reputation'
  | 'min_funds'
  | 'min_rating'
  | 'max_sprint_count';

export interface CheckpointCondition {
  type: CheckpointConditionType;
  threshold: number;
}

export interface FinancingCheckpoint {
  id: string;
  quarterNumber: number;
  condition: CheckpointCondition;
  baseReward: number;
  description: string;
}

export interface FinancingResult {
  checkpoint: FinancingCheckpoint;
  triggered: boolean;
  reward: number;
}

/** 预设的融资检查点列表（按 quarter 组织） */
export function getDefaultCheckpoints(): FinancingCheckpoint[] {
  return [
    {
      id: 'seed',
      quarterNumber: 1,
      condition: { type: 'min_completed_projects', threshold: 1 },
      baseReward: 3000,
      description: '种子轮融资：完成至少 1 个项目',
    },
    {
      id: 'angel-a',
      quarterNumber: 2,
      condition: { type: 'min_funds', threshold: 2000 },
      baseReward: 4000,
      description: '天使轮-A：剩余资金不少于 2000',
    },
    {
      id: 'angel-b',
      quarterNumber: 3,
      condition: { type: 'min_completed_projects', threshold: 3 },
      baseReward: 5000,
      description: '天使轮-B：累计完成至少 3 个项目',
    },
    {
      id: 'series-a',
      quarterNumber: 4,
      condition: { type: 'min_reputation', threshold: 20 },
      baseReward: 8000,
      description: 'A 轮融资：声望达到 20（高）',
    },
    {
      id: 'series-b',
      quarterNumber: 6,
      condition: { type: 'min_completed_projects', threshold: 6 },
      baseReward: 12000,
      description: 'B 轮融资：累计完成至少 6 个项目',
    },
    {
      id: 'series-c',
      quarterNumber: 8,
      condition: { type: 'min_rating', threshold: 65 },
      baseReward: 20000,
      description: 'C 轮融资：公司评级达到 A（65 分）',
    },
  ];
}

/** 获取在某个 quarter 需要评估的检查点 */
export function getCheckpointsForQuarter(
  allCheckpoints: FinancingCheckpoint[],
  quarterNumber: number,
): FinancingCheckpoint[] {
  return allCheckpoints.filter((c) => c.quarterNumber === quarterNumber);
}

function meetsCondition(
  condition: CheckpointCondition,
  state: GameState,
  reputationScore: number,
  rating?: CompanyRating,
): boolean {
  switch (condition.type) {
    case 'min_completed_projects':
      return (state.completedProjectIds?.length ?? 0) >= condition.threshold;
    case 'min_reputation':
      return reputationScore >= condition.threshold;
    case 'min_funds':
      return state.funds >= condition.threshold;
    case 'min_rating':
      return ratingScore(rating) >= condition.threshold;
    case 'max_sprint_count':
      return state.sprintCount <= condition.threshold;
    default:
      return false;
  }
}

/** 检查单个融资检查点是否触发 */
export function checkFinancingCheckpoint(
  checkpoint: FinancingCheckpoint,
  state: GameState,
  reputationScore: number,
  rating?: CompanyRating,
): FinancingResult {
  const triggered = meetsCondition(checkpoint.condition, state, reputationScore, rating);
  return {
    checkpoint,
    triggered,
    reward: triggered ? checkpoint.baseReward : 0,
  };
}

/** 评估某个 quarter 的所有融资检查点 */
export function evaluateQuarterCheckpoints(
  checkpoints: FinancingCheckpoint[],
  state: GameState,
  reputationScore: number,
  rating?: CompanyRating,
): FinancingResult[] {
  return checkpoints.map((cp) => checkFinancingCheckpoint(cp, state, reputationScore, rating));
}

function ratingScore(rating?: CompanyRating): number {
  const map: Record<string, number> = { S: 80, A: 65, B: 50, C: 35, D: 20, F: 0 };
  return rating ? (map[rating] ?? 0) : 0;
}
