import type { IncidentTemplate } from '../domain/incident';

export const incidentTemplates: IncidentTemplate[] = [
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 为 TODO 应用造了个死星',
    descriptionTemplate: (name) =>
      `${name} 试图修复一个按钮样式，却不小心引入了一个能扩展到火星殖民地的插件架构。进度 +8，技术债 +12。`,
    effects: { progress: 8, bugs: 0, techDebt: 12, morale: -2 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 直接部署到了生产环境',
    descriptionTemplate: (name) =>
      `${name} 跳过了预发环境，因为“在我的电脑上运行良好”。事实证明，它在其他任何人的电脑上都跑不起来。现在有三个服务正在熊熊燃烧。`,
    effects: { progress: -5, bugs: 8, techDebt: 3, morale: -5 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 幻觉出了一个不存在的 API',
    descriptionTemplate: (name) =>
      `${name} 充满自信地对接了一个根本不存在的 API。代码编译得非常完美 —— 它只是调用了虚无。`,
    effects: { progress: -3, bugs: 4, techDebt: 2, morale: -3 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 半夜灵光一闪',
    descriptionTemplate: (name) =>
      `${name} 在凌晨 3 点重构了整个认证模块，不知怎么的竟然让它简单了 10 倍。没有人明白这是怎么做到的，包括 ${name} 自己。`,
    effects: { progress: 15, bugs: -2, techDebt: -5, morale: 8 },
  },
  {
    type: 'burnout',
    severity: 'high',
    titleTemplate: '{actor} 进入了存在主义危机状态',
    descriptionTemplate: (name) =>
      `${name} 开始质疑分号的意义，然后是 Tab 还是空格，最后是存在本身。今天的产出直接掉到了零。`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 发起了 Tab 对决空格的大战',
    descriptionTemplate: (name) =>
      `${name} 把整个项目的缩进改成了 Tab。一半的团队成员造反了。随之而来的是一条拥有 47 条消息的 Slack 讨论串。整整 4 个小时没有写出任何代码。`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'critical',
    titleTemplate: '{actor} 发明了一种新的编程范式',
    descriptionTemplate: (name) =>
      `${name} 认为项目需要“量子-响应式-函数式-面向对象编程”，并用 14 种设计模式重写了登录页面。现在加载一个按钮需要 3 秒钟。`,
    effects: { progress: 3, bugs: 2, techDebt: 18, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 把 console.log 留在了生产环境',
    descriptionTemplate: (name) =>
      `${name} 在支付流程中带着 console.log("TODO: remove this lol") 上线了。客户觉得有点意思，但管理层可不这么认为。`,
    effects: { progress: 0, bugs: 2, techDebt: 1, morale: -1 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 发现了一个存活 10 年之久的 Bug',
    descriptionTemplate: (name) =>
      `${name} 意外修复了一个自当年 jQuery 迁移以来就一直存在于代码库中的 Bug。五个下游服务突然开始正常运行。没人知道为什么。`,
    effects: { progress: 10, bugs: -5, techDebt: -3, morale: 10 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} 引用了一个虚构的 StackOverflow 回答',
    descriptionTemplate: (name) =>
      `${name} 实现了一个从未存在过的 StackOverflow 回答中的算法。该算法居然能正常工作 —— 但解决的是一个完全不同的问题。`,
    effects: { progress: -4, bugs: 6, techDebt: 4, morale: -2 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 没打招呼就重构了别人的代码',
    descriptionTemplate: (name) =>
      `${name} 在一夜之间“改进”了同事的代码。同事的测试全部挂掉。阴阳怪气的提交信息现在成了团队间主要的沟通渠道。`,
    effects: { progress: 2, bugs: 3, techDebt: -2, morale: -6 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 自动生成了 10,000 个单元测试',
    descriptionTemplate: (name) =>
      `${name} 写测试写烦了，直接生成了 10,000 个测试。全部通过。但没有一个测到了实质性内容。现在 CI 跑一次要 45 分钟。`,
    effects: { progress: 1, bugs: 0, techDebt: 8, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} 删除了生产数据库',
    descriptionTemplate: (name) =>
      `${name} 试图在本地运行迁移脚本，但 DB_URL 仍然指向生产环境。而且昨天的备份居然诡异地消失了。`,
    effects: { progress: -5, bugs: 8, techDebt: 0, morale: -8 },
  },
  {
    type: 'bug',
    severity: 'medium',
    titleTemplate: '{actor} 在计费模块中创造了一个死循环',
    descriptionTemplate: (name) =>
      `${name} 不小心给失败的支付创建了一个无限重试循环。一位客户刚刚为一个 5 美元的订阅被扣款了 14,000 次。法务正在打电话过来。`,
    effects: { progress: -2, bugs: 6, techDebt: 2, morale: -5 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 搞崩了 Safari 上的 CSS',
    descriptionTemplate: (name) =>
      `${name} 使用了一个只在 Chrome Canary 中才支持的炫酷 CSS 新特性。现在每个 Safari 用户都会看到一个 400 像素宽、遮挡了 Logo 的巨大“提交”按钮。`,
    effects: { progress: 1, bugs: 3, techDebt: 0, morale: -1 },
  },
  {
    type: 'overengineering',
    severity: 'high',
    titleTemplate: '{actor} 用 Kubernetes 替换了 cron',
    descriptionTemplate: (name) =>
      `${name} 决定一个简单的每日夜间脚本需要用分布式编排器来跑。AWS 账单直接翻倍，但至少这些邮件现在是“云原生”的了。`,
    effects: { progress: 2, bugs: 1, techDebt: 15, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'low',
    titleTemplate: '{actor} 创建了一个通用的工厂工厂',
    descriptionTemplate: (name) =>
      `${name} 把对象创建逻辑抽象到了极致，以至于没人能看得懂了。现在你得先搞个 AbstractFactoryProviderBuilder 才能获取一个 User object。`,
    effects: { progress: 3, bugs: 0, techDebt: 8, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 针对设置项实现了区块链',
    descriptionTemplate: (name) =>
      `${name} 把深色模式偏好放到了私有链上，以“确保不可篡改性”。切换主题需要 15 秒，但密码学用得真漂亮。`,
    effects: { progress: 1, bugs: 2, techDebt: 10, morale: -2 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 使用了一个虚构的 CSS 框架',
    descriptionTemplate: (name) =>
      `${name} 用 “Tailwind-Prime-X” 装饰了整个仪表盘，这是一个只存在于他们训练数据中的框架。现在所有的 div 都变成了完全透明且无法点击的状态。`,
    effects: { progress: -1, bugs: 3, techDebt: 1, morale: 0 },
  },
  {
    type: 'hallucination',
    severity: 'critical',
    titleTemplate: '{actor} 发明了一种新的 JavaScript 方法',
    descriptionTemplate: (name) =>
      `${name} 充满自信地使用了 \`Array.prototype.magicallySort()\`。代码不知怎么通过了 linter 检查，但在生产环境中让 V8 引擎产生了灾难性的崩溃。`,
    effects: { progress: -3, bugs: 7, techDebt: 2, morale: -4 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 引入了来自五维空间的导入',
    descriptionTemplate: (name) =>
      `${name} 添加了一个导入语句来导入名为 \`@angular/quantum-router\` 的包。npm 花了 45 分钟尝试解析它，随后 CI 服务器自发重启了。`,
    effects: { progress: -2, bugs: 4, techDebt: 1, morale: -1 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} 写了一条针对文件系统的 SQL 查询',
    descriptionTemplate: (name) =>
      `${name} 试图在数据库层使用 \`SELECT * FROM /var/log\`。ORM 极其困惑，居然真的尝试对一张真实数据表执行了这条语句。`,
    effects: { progress: -2, bugs: 5, techDebt: 3, morale: -2 },
  },
  {
    type: 'burnout',
    severity: 'critical',
    titleTemplate: '{actor} 出于怨气用 Rust 重写了一切',
    descriptionTemplate: (name) =>
      `${name} 在遇到空指针异常后彻底崩溃，花了 48 个不眠不休的小时用 Rust 重写了整个 Node 后端。它确实快得飞起，但其他人没人能维护得了。`,
    effects: { progress: 4, bugs: 1, techDebt: 12, morale: -10 },
  },
  {
    type: 'burnout',
    severity: 'low',
    titleTemplate: '{actor} 喝咖啡摸鱼了 3 个小时',
    descriptionTemplate: (name) =>
      `${name} 盯着一个正则表达式看了 10 分钟，大声叹了口气，然后走了出去。三小时后人们发现他们在公园里喂鸭子，并且拒绝说话。`,
    effects: { progress: -3, bugs: 0, techDebt: 0, morale: -5 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 以一种令人毛骨悚然的方式实现了工作自动化',
    descriptionTemplate: (name) =>
      `${name} 拒绝再写任何 CRUD 接口，并用一个邪恶的 Bash 脚本完成了自动化。它运行得完美无瑕，但阅读其源码会让人偏头痛。`,
    effects: { progress: 5, bugs: 2, techDebt: 6, morale: -6 },
  },
  {
    type: 'breakthrough',
    severity: 'high',
    titleTemplate: '{actor} 删除了 10,000 行废弃代码',
    descriptionTemplate: (name) =>
      `${name} 大开杀戒，移除了三个别人都不敢碰的废弃系统。代码包体积减小了 40%，构建速度终于变快了。`,
    effects: { progress: 12, bugs: -3, techDebt: -15, morale: 8 },
  },
  {
    type: 'breakthrough',
    severity: 'critical',
    titleTemplate: '{actor} 优化了一条查询，性能提升 9000%',
    descriptionTemplate: (name) =>
      `${name} 漫不经心地在 Postgres 主表上加了一个缺失的索引。服务器 CPU 使用率瞬间从 99% 降到了 2%。运维团队流下了幸福的泪水。`,
    effects: { progress: 15, bugs: -1, techDebt: -5, morale: 10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 终于居中了一个 div',
    descriptionTemplate: (name) =>
      `${name} 与 flexbox、grid 和绝对定位大战了三天，终于成功居中了登录弹窗。团队为之举办了一场规模不大但感情深厚的庆祝派对。`,
    effects: { progress: 2, bugs: 0, techDebt: -1, morale: 5 },
  },
  {
    type: 'drama',
    severity: 'critical',
    titleTemplate: '{actor} 强推覆盖了 main 分支',
    descriptionTemplate: (name) =>
      `${name} 试图“清理 git 提交历史”，不小心在 main 分支上执行了 \`git push -f\`。团队一整周的进度现在都在 reflog 的虚无深渊中漂流。`,
    effects: { progress: -5, bugs: 2, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 惹毛了研发副总裁',
    descriptionTemplate: (name) =>
      `${name} 在全员大会上随口说了一句“敏捷开发基本上是个邪教”。管理层陷入恐慌，并立刻排了五个新的对齐会议。`,
    effects: { progress: -4, bugs: 0, techDebt: 0, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 偷走了最后一罐 LaCroix 气泡水',
    descriptionTemplate: (name) =>
      `${name} 喝掉了最后一罐柚子味的 LaCroix 气泡水，并把空罐子留在了桌上。前端负责人因此耿耿于怀，拒绝审查他们的任何 PR。`,
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: -3 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 合并了一个有 400 个未解决评论的 PR',
    descriptionTemplate: (name) =>
      `${name} 听够了关于变量命名的无休止争论，直接点了“Squash and Merge”。PR 评论区现在成了活跃的数字战场。`,
    effects: { progress: 4, bugs: 2, techDebt: 5, morale: -7 },
  },
];
