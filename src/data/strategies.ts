import type { Strategy } from '../domain/strategy';

export const strategies: Strategy[] = [
  {
    id: 'move-fast',
    name: '先冲再说',
    description: '速度拉满，谨慎为零。现在上线，以后修复（或者永远不修）。',
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
    name: '稳扎稳打',
    description: '任何事都要评审三次。没有20页的设计文档，谁也别想上线。',
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
    name: '结对编程',
    description: '两个AI，一把键盘。吞吐量减半，吵架量翻倍。',
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
    name: '死亡冲刺',
    description: '强制加班。GPU烧得滚烫，士气凉到冰点。',
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
    name: '生死看淡，上线再看',
    description: '不要测试，不要评审，不留遗憾。直接强推主分支，然后闭眼祈祷。',
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
    name: '屎山重构',
    description: '不做新功能。纯纯清理上个迭代留下的烂摊子。',
    modifiers: {
      progressMul: 0.2,
      bugMul: 0.3,
      techDebtMul: -1.0,
      moraleDelta: 4,
      incidentChanceMul: 0.4,
    },
  },
];
