export interface Strategy {
  id: string;
  name: string;
  description: string;
  modifiers: {
    progressMul: number;
    bugMul: number;
    techDebtMul: number;
    moraleDelta: number;
    incidentChanceMul: number;
  };
}
