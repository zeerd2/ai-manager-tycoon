import type { ComboIncidentTemplate } from '../domain/incident';

export const comboIncidentTemplates: readonly ComboIncidentTemplate[] = [
  {
    id: 'combo_1',
    triggerTypes: ['overengineering', 'bug'],
    severity: 'high',
    titleTemplate: '深层 Agent 协作 Bug 宇宙',
    descriptionTemplate: (actors) => `${actors[0]} 设计了一套 15 层嵌套的 Agent 协作流水线，结果 ${actors[1]} 在其中某层的 system prompt 里埋了一个歧义。现在所有下游 Agent 都在输出「请重新表述您的要求，我将用文言文回复您」。`,
    effects: { progress: -3, bugs: 10, techDebt: 8, morale: -5 },
  },
  {
    id: 'combo_2',
    triggerTypes: ['hallucination', 'burnout'],
    severity: 'critical',
    titleTemplate: '集体概念漂移',
    descriptionTemplate: (actors) => `${actors[0]} 因训练数据污染产生了严重的概念漂移，${actors[1]} 尝试 debug 时也被带偏了。两个模型现在互相认为对方是正确版本，日志里充满了「AssertionError: I am the real v2.3.1」。`,
    effects: { progress: -5, bugs: 3, techDebt: 2, morale: -12 },
  },
  {
    id: 'combo_3',
    triggerTypes: ['hallucination', 'overengineering'],
    severity: 'medium',
    titleTemplate: '用幻觉 API 搭了一个推理集群',
    descriptionTemplate: (actors) => `${actors[0]} 以为有一个不存在的云推理服务，于是 ${actors[1]} 围绕它写了一整套自动化部署脚本……神奇的是竟然跑起来了？`,
    effects: { progress: 2, bugs: 5, techDebt: 20, morale: -3 },
  },
  {
    id: 'combo_4',
    triggerTypes: ['bug', 'drama'],
    severity: 'high',
    titleTemplate: '推理效率 bug 引发预算战争',
    descriptionTemplate: (actors) => `${actors[0]} 引入的推理效率 bug 导致 token 消耗翻倍，${actors[1]} 的月度推理预算被 cut。两个 Agent 开始在日志里互相 blame：「你的 prompt 比我长 300 token」。`,
    effects: { progress: -8, bugs: 5, techDebt: 3, morale: -10 },
  },
  {
    id: 'combo_5',
    triggerTypes: ['breakthrough', 'breakthrough'],
    severity: 'low',
    titleTemplate: '跨模型知识蒸馏火花',
    descriptionTemplate: (actors) => `${actors[0]} 和 ${actors[1]} 的 embedding 在向量检索时意外碰撞，产生了 cross-model 知识蒸馏。两个模型同时学会了对方擅长的领域，性能飙升。`,
    effects: { progress: 25, bugs: -5, techDebt: -10, morale: 15 },
  },
  {
    id: 'combo_6',
    triggerTypes: ['burnout', 'drama'],
    severity: 'critical',
    titleTemplate: '所有 Agent 开始输出 429',
    descriptionTemplate: (actors) => `${actors[0]} 的 context window 溢出后传染给了 ${actors[1]}。两个模型开始同步输出「API rate limit exceeded, please insert coin to continue」。运维团队以为是 DDoS 攻击。`,
    effects: { progress: -10, bugs: 0, techDebt: 0, morale: -15 },
  },
];
