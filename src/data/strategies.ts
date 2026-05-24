import type { Strategy } from '../domain/strategy';

export const strategies: Strategy[] = [
  {
    id: 'move-fast',
    name: 'Move Fast & Break Things',
    description: 'Maximum velocity, minimum caution. Ship now, fix later (or never).',
    modifiers: {
      progressMul: 1.5,
      bugMul: 1.8,
      techDebtMul: 1.6,
      moraleDelta: 2,
      incidentChanceMul: 1.4,
    },
  },
  {
    id: 'careful',
    name: 'Careful & Methodical',
    description: 'Review everything three times. Nothing ships without a 20-page design doc.',
    modifiers: {
      progressMul: 0.7,
      bugMul: 0.4,
      techDebtMul: 0.5,
      moraleDelta: -3,
      incidentChanceMul: 0.6,
    },
  },
  {
    id: 'pair-program',
    name: 'Pair Programming',
    description: 'Two AIs, one keyboard. Half the throughput, double the arguments.',
    modifiers: {
      progressMul: 0.8,
      bugMul: 0.5,
      techDebtMul: 0.7,
      moraleDelta: 5,
      incidentChanceMul: 0.8,
    },
  },
  {
    id: 'crunch',
    name: 'Crunch Mode',
    description: 'Mandatory overtime. GPUs running hot. Morale running cold.',
    modifiers: {
      progressMul: 1.8,
      bugMul: 1.4,
      techDebtMul: 2.0,
      moraleDelta: -8,
      incidentChanceMul: 1.6,
    },
  },
  {
    id: 'yolo',
    name: 'YOLO Deploy',
    description: 'No tests, no reviews, no regrets. Push to main and pray.',
    modifiers: {
      progressMul: 2.0,
      bugMul: 2.5,
      techDebtMul: 2.2,
      moraleDelta: 3,
      incidentChanceMul: 2.0,
    },
  },
  {
    id: 'refactor',
    name: 'Refactor Sprint',
    description: 'No new features. Just clean up the mess from last sprint.',
    modifiers: {
      progressMul: 0.2,
      bugMul: 0.3,
      techDebtMul: -1.0,
      moraleDelta: 4,
      incidentChanceMul: 0.4,
    },
  },
];
