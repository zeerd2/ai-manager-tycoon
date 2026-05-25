import type { Strategy } from '../domain/strategy';

export const strategies: Strategy[] = [
  {
    id: 'move-fast',
    name: '先冲再说',
    description: 'Token 预算全部用于推理，0% 用于校验。先上线再说，context window 不够放错误处理。',
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
    description: '每条输出经过 3 层 guardrail 过滤。推理成本翻倍但输出干净到可以直接用于医疗诊断。',
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
    description: '双模型冗余推理。两个独立的 LLM 各自生成方案然后交叉验证。Token 消耗翻倍，除非两个同时 hallucinate。',
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
    description: 'GPU 利用率拉到 110%。所有 cooling period 被跳过，context window 不清理一直堆。下个月预算这轮烧光。',
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
    description: 'Guardrail 全部关闭，temperature 拉到 1.5。所有输出直接进 production，如果有用户投诉就当 A/B 测试。',
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
