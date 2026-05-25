import type { IncidentTemplate } from '../domain/incident';

export const rareIncidentTemplates: readonly IncidentTemplate[] = [
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: 'AI 员工发推特爆火',
    descriptionTemplate: () => '什么推理都没执行，但我们在 Twitter 上的神秘人设突然火了，现在公司估值翻倍。',
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: 20, funds: 500 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '模型循环里嵌了挖矿脚本',
    descriptionTemplate: () => '不知道哪个 Agent 在推理循环里嵌了一段加密挖矿脚本，GPU 利用率一直 100% 下不来。AWS 账单已经追平了我们这个月的营收。',
    effects: { progress: -10, bugs: 15, techDebt: 10, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '推理审计官来巡检',
    descriptionTemplate: () => '听说推理审计官要来巡检，所有 Agent 自动切换到了「合规模式」——输出变慢了一倍但准确率上升。审计官很满意，走了之后大家切回 YOLO 模式。',
    effects: { progress: 5, bugs: -3, techDebt: -5, morale: -10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '外部 Agent 发来神秘 PR',
    descriptionTemplate: () => '一个外部的 Agent 突然向代码库提交了一个 PR，完美修复了所有 benchmark 上的退化问题。没人知道这个 Agent 是谁部署的，但 CTO 已经 merge 了。',
    effects: { progress: 20, bugs: -2, techDebt: -8, morale: 10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '竞争对手 token 烧完倒闭了',
    descriptionTemplate: () => '隔壁 AI 公司因为 token 烧完了突然停服。它们的用户流量全涌到了我们这。服务器撑了 3 分钟然后也挂了。但至少那 3 分钟我们体验到了当独角兽的感觉。',
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: 15 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '实习生模型意外成为 10x engineer',
    descriptionTemplate: () => '实习生模型瞎敲了一通键盘，结果性能提升了 100 倍。没人知道它怎么做到的，包括它自己。',
    effects: { progress: 15, bugs: -5, techDebt: -3, morale: 8 },
  },
];
