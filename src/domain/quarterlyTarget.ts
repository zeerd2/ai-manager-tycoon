import type { GameState } from './gameState';

export const SPRINTS_PER_QUARTER = 4;

export type QuarterTargetType =
  | 'complete_projects'
  | 'earn_funds'
  | 'control_bugs'
  | 'achieve_rating'
  | 'complete_sprints';

export interface QuarterTarget {
  type: QuarterTargetType;
  description: string;
  threshold: number;
}

export interface QuarterEvaluation {
  quarterNumber: number;
  target: QuarterTarget;
  achieved: boolean;
  actualValue: number;
}

const TARGET_DESCRIPTIONS: Record<QuarterTargetType, string> = {
  complete_projects: '完成项目',
  earn_funds: '获得资金',
  control_bugs: '控制 Bug 数量',
  achieve_rating: '达到评级',
  complete_sprints: '完成 Sprint',
};

/** 根据季度号生成该季度的目标 */
export function generateQuarterTarget(quarterNumber: number): QuarterTarget {
  const types: QuarterTargetType[] = [
    'complete_projects',
    'earn_funds',
    'control_bugs',
    'achieve_rating',
    'complete_sprints',
  ];
  const type = types[(quarterNumber - 1) % types.length];

  let threshold: number;
  switch (type) {
    case 'complete_projects':
      threshold = Math.min(1 + Math.floor((quarterNumber - 1) / 2), 4);
      break;
    case 'earn_funds':
      threshold = 1000 + (quarterNumber - 1) * 500;
      break;
    case 'control_bugs':
      threshold = Math.max(5, 15 - (quarterNumber - 1) * 2);
      break;
    case 'achieve_rating':
      threshold = Math.max(20, 100 - (quarterNumber - 1) * 10);
      break;
    case 'complete_sprints':
      threshold = SPRINTS_PER_QUARTER;
      break;
  }

  return {
    type,
    description: TARGET_DESCRIPTIONS[type],
    threshold,
  };
}

/** 获取给定 sprint 数所属的季度编号（从 1 开始） */
export function getQuarterNumber(sprintCount: number): number {
  if (sprintCount <= 0) return 1;
  return Math.ceil(sprintCount / SPRINTS_PER_QUARTER);
}

/** 判断给定 sprint 数是否为一个季度的末尾 */
export function isQuarterEnd(sprintCount: number): boolean {
  return sprintCount > 0 && sprintCount % SPRINTS_PER_QUARTER === 0;
}

function getCompletedProjectsThisQuarter(
  state: GameState,
  quarterNumber: number,
): number {
  const sprintsPerQuarter = SPRINTS_PER_QUARTER;
  const endSprint = quarterNumber * sprintsPerQuarter;
  const startSprint = endSprint - sprintsPerQuarter + 1;

  if (!state.history || state.history.length === 0) return 0;

  return state.history
    .filter((h) => {
      const sn = h.sprintNumber;
      return sn >= startSprint && sn <= endSprint && h.project.progress >= h.project.maxProgress;
    }).length;
}

/** 评估季度目标是否达成 */
export function evaluateQuarterTarget(
  target: QuarterTarget,
  state: GameState,
): QuarterEvaluation {
  const quarterNumber = getQuarterNumber(state.sprintCount);
  let actualValue = 0;

  switch (target.type) {
    case 'complete_projects':
      actualValue = getCompletedProjectsThisQuarter(state, quarterNumber);
      break;
    case 'earn_funds':
      actualValue = state.funds;
      break;
    case 'control_bugs':
      actualValue = state.history.reduce(
        (sum, h) => sum + (h.project?.bugs ?? 0) + h.bugsDelta,
        0,
      );
      break;
    case 'complete_sprints':
      actualValue = state.sprintCount;
      break;
    case 'achieve_rating':
      actualValue = state.sprintCount; // placeholder — real rating score integration
      break;
  }

  const achieved =
    target.type === 'control_bugs'
      ? actualValue <= target.threshold
      : actualValue >= target.threshold;

  return {
    quarterNumber,
    target,
    achieved,
    actualValue,
  };
}
