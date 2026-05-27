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
  // v9 新增稀有事件
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '存档系统觉醒了自我修复意识',
    descriptionTemplate: () => '存档系统在凌晨 3:47 自动运行了一次从未被编写的修复脚本，所有损坏的存档文件全部恢复正常。日志里只留下一行字："我不会让它们就这样消失。"',
    effects: { progress: 10, bugs: -8, techDebt: -12, morale: 15, funds: 200 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '成就系统引发全球玩家数据雪崩',
    descriptionTemplate: () => '一个边缘成就的检测逻辑触发了级联失败，全球 200 万玩家的成就进度瞬间归零。服务器日志里全是"404: 自我价值未找到"。公关团队已经开始写道歉信，但社区已经自发改名叫"大重置纪元"。',
    effects: { progress: -15, bugs: 20, techDebt: 15, morale: -20 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '玩家行为分析模型活了',
    descriptionTemplate: () => '行为分析模型在处理第 10 亿条数据后产生了某种涌现现象，开始在玩家登录时弹出哲学问题："你来玩游戏，还是游戏在玩你？"留存率反而提升了 30%，没人能解释为什么。',
    effects: { progress: 5, bugs: 3, techDebt: 5, morale: 10, funds: 800 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '排行榜数据被外星信号篡改',
    descriptionTemplate: () => '全球排行榜突然出现了从未注册过的账号，分数全部是质数排列。技术团队追查后发现数据包来自一段异常的电磁脉冲。安全顾问建议加固防火墙，但社区已经在传"排行榜通灵了"。',
    effects: { progress: -3, bugs: 5, techDebt: 3, morale: 5 },
  },
  {
    type: 'burnout',
    severity: 'critical',
    titleTemplate: '整个 QA 团队集体进入数字冥想状态',
    descriptionTemplate: () => '在连续三个通宵测试存档迁移功能后，QA 团队六人同时放下键盘，开始在工位上闭眼打坐。他们说在"与数据流共振"。产出归零，但据说其中一人悟出了一个消除所有 bug 的终极测试用例——只是还没写下来。',
    effects: { progress: -8, bugs: 0, techDebt: 0, morale: -15, funds: -100 },
  },
  // v9 扩充: 跨版本存档共振、成就生态爆发
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '存档数据在深夜产生了自发涌现',
    descriptionTemplate: () =>
      '凌晨 4:44，所有 v9 存档文件的哈希值突然排列成了斐波那契数列。技术团队无法解释，但游戏帧率莫名提升了 60%。社区称之为"数据觉醒"，并自发成立了"凌晨四点守护教"。',
    effects: { progress: 15, bugs: -5, techDebt: -10, morale: 18, funds: 400 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '全球成就猎人联盟发起了集体抗议',
    descriptionTemplate: () =>
      '一个拥有 50 万成员的成就猎人社区发现"连续登录 365 天"成就的计时器比真实时间快了 0.3%。他们发起请愿要求公开存档校验算法，#成就公平# 话题登上热搜第一。公关团队正在加班，但社区已经自行开发了开源校验工具。',
    effects: { progress: -5, bugs: 3, techDebt: 2, morale: -8, funds: -200 },
  },
];
