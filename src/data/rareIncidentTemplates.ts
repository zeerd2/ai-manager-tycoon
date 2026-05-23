import type { IncidentTemplate } from '../domain/incident';

export const rareIncidentTemplates: readonly IncidentTemplate[] = [
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: 'AI 员工发推特爆火',
    descriptionTemplate: () => '什么代码都没写，但我们在 Twitter 上的神秘人设突然火了，现在公司估值翻倍。',
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: 20, funds: 500 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '服务器被挖矿了',
    descriptionTemplate: () => '不知道谁引入的 npm 包里藏了矿机，现在 AWS 账单已经炸了。',
    effects: { progress: -10, bugs: 15, techDebt: 10, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: 'CEO 来视察',
    descriptionTemplate: () => '听说老板要来，全员假装很忙地重构代码，结果真的产出了有用的东西。',
    effects: { progress: 5, bugs: -3, techDebt: -5, morale: -10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '开源社区送了个大 PR',
    descriptionTemplate: () => '某个看不过去的神秘开发者发来了一个 PR，悄悄修好了所有你不敢碰的祖传代码。',
    effects: { progress: 20, bugs: -2, techDebt: -8, morale: 10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '竞争对手倒闭了',
    descriptionTemplate: () => '隔壁做一样产品的公司因为烧光了钱突然倒闭，全员庆祝，虽然和你们的工作没有任何关系。',
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: 15 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '实习生意外成为 10x engineer',
    descriptionTemplate: () => '实习生瞎敲了一通键盘，结果性能提升了 100 倍。没人知道他怎么做到的，包括他自己。',
    effects: { progress: 15, bugs: -5, techDebt: -3, morale: 8 },
  },
];
