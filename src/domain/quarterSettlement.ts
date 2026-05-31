import type { GameState } from './gameState';
import type { FinancingResult } from './financing';
import { evaluateQuarterCheckpoints, getCheckpointsForQuarter, getDefaultCheckpoints } from './financing';
import { calculateRating, toRatingInput } from './rating';
import { evaluateQuarterTarget, generateQuarterTarget, getQuarterNumber } from './quarterlyTarget';
import type { QuarterEvaluation } from './quarterlyTarget';

export interface QuarterSettlementResult {
  quarterNumber: number;
  targetEvaluation: QuarterEvaluation;
  financingResults: FinancingResult[];
  totalFinancingReward: number;
  triggeredCheckpointIds: string[];
}

export function processQuarterSettlement(
  state: GameState,
  reputationScore: number,
): QuarterSettlementResult {
  const quarterNumber = getQuarterNumber(state.sprintCount);
  const target = generateQuarterTarget(quarterNumber);
  const targetEvaluation = evaluateQuarterTarget(target, state);

  const companyRating = calculateRating(toRatingInput(state)).rating;
  const checkpoints = getCheckpointsForQuarter(getDefaultCheckpoints(), quarterNumber);
  const financingResults = evaluateQuarterCheckpoints(checkpoints, state, reputationScore, companyRating);
  const triggeredThisQuarter = financingResults
    .filter((result) => result.triggered)
    .map((result) => result.checkpoint.id);

  return {
    quarterNumber,
    targetEvaluation,
    financingResults,
    totalFinancingReward: financingResults.reduce((sum, result) => sum + result.reward, 0),
    triggeredCheckpointIds: [...(state.triggeredCheckpoints ?? []), ...triggeredThisQuarter],
  };
}
