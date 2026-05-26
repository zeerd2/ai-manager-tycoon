import type { IncidentTemplate } from '../domain/incident';

export const incidentTemplates: IncidentTemplate[] = [
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 为 TODO 应用造了个死星',
    descriptionTemplate: (name) =>
      `${name} 想修一个按钮样式，却不小心引入了一个能扩展到火星殖民地的插件架构。进度 +8，技术债 +12。`,
    effects: { progress: 8, bugs: 0, techDebt: 12, morale: -2 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 直接部署到了生产环境',
    descriptionTemplate: (name) =>
      `${name} 跳过了预发布环境，因为"在我机器上能跑"。事实上它在其他机器上都跑不了。三个服务正在燃烧。`,
    effects: { progress: -5, bugs: 8, techDebt: 3, morale: -5 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 幻觉了一个不存在的 API',
    descriptionTemplate: (name) =>
      `${name} 自信地集成了一个根本不存在的 API。代码完美编译——只是调用全部落入虚空。`,
    effects: { progress: -3, bugs: 4, techDebt: 2, morale: -3 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 午夜灵光乍现',
    descriptionTemplate: (name) =>
      `${name} 凌晨三点重构了整个认证模块，居然让它简洁了 10 倍。没人知道是怎么做到的，包括 ${name} 自己。`,
    effects: { progress: 15, bugs: -2, techDebt: -5, morale: 8 },
  },
  {
    type: 'burnout',
    severity: 'high',
    titleTemplate: '{actor} 进入存在主义危机模式',
    descriptionTemplate: (name) =>
      `${name} 开始质疑分号的意义，然后纠结空格和制表符，最后质疑存在本身。当天的产出降为零。`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 发起了一场制表符 vs 空格之战',
    descriptionTemplate: (name) =>
      `${name} 把整个项目改成了制表符。一半的团队造反了。Slack 上产生了 47 条消息的讨论串，整整 4 小时没人写代码。`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'critical',
    titleTemplate: '{actor} 发明了一种新的编程范式',
    descriptionTemplate: (name) =>
      `${name} 认为该项目需要"量子反应式函数面向对象编程"，并用 14 种设计模式重写了登录页面。现在加载一个按钮需要 3 秒。`,
    effects: { progress: 3, bugs: 2, techDebt: 18, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 在生产环境留下了 console.log',
    descriptionTemplate: (name) =>
      `${name} 在支付流程中留下了 console.log("TODO: 删掉这个 lol") 并发版了。顾客觉得有点好笑，管理层笑不出来。`,
    effects: { progress: 0, bugs: 2, techDebt: 1, morale: -1 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 发现了一个存在 10 年的 Bug',
    descriptionTemplate: (name) =>
      `${name} 意外修复了一个从 jQuery 迁移时代就存在的 Bug。五个下游服务突然开始正常工作。没人知道为什么。`,
    effects: { progress: 10, bugs: -5, techDebt: -3, morale: 10 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} 引用了一个虚构的 StackOverflow 回答',
    descriptionTemplate: (name) =>
      `${name} 根据一个根本不存在的 StackOverflow 回答实现了一个算法。这个算法确实能跑——但解决的是完全不同的问题。`,
    effects: { progress: -4, bugs: 6, techDebt: 4, morale: -2 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 没打招呼就重构了别人的代码',
    descriptionTemplate: (name) =>
      `${name} 连夜"改进"了同事的代码。同事的所有测试都挂了。阴阳怪气的提交信息现在成了团队的主要沟通渠道。`,
    effects: { progress: 2, bugs: 3, techDebt: -2, morale: -6 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 自动生成了 10,000 个单元测试',
    descriptionTemplate: (name) =>
      `${name} 厌倦了写测试，于是生成了 10,000 个。全部通过。没有一个测试了有意义的内容。CI 现在需要 45 分钟。`,
    effects: { progress: 1, bugs: 0, techDebt: 8, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} 删掉了生产数据库',
    descriptionTemplate: (name) =>
      `${name} 试图在本地运行迁移脚本，但 DB_URL 仍然指向生产环境。昨天的备份可疑地消失了。`,
    effects: { progress: -5, bugs: 8, techDebt: 0, morale: -8 },
  },
  {
    type: 'bug',
    severity: 'medium',
    titleTemplate: '{actor} 在计费系统中制造了死循环',
    descriptionTemplate: (name) =>
      `${name} 不小心为失败支付创建了无限重试循环。一位客户的 5 美元订阅被扣了 14,000 次。法务部来电了。`,
    effects: { progress: -2, bugs: 6, techDebt: 2, morale: -5 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 搞坏了 Safari 上的 CSS',
    descriptionTemplate: (name) =>
      `${name} 使用了一个花哨的新 CSS 特性，只在 Chrome Canary 中有效。每个 Safari 用户现在都看到一个 400px 宽的"提交"按钮覆盖在 Logo 上。`,
    effects: { progress: 1, bugs: 3, techDebt: 0, morale: -1 },
  },
  {
    type: 'overengineering',
    severity: 'high',
    titleTemplate: '{actor} 用 Kubernetes 替换了 cron 任务',
    descriptionTemplate: (name) =>
      `${name} 认为一个简单的夜间脚本需要成为分布式编排器。AWS 账单翻了一倍，但至少邮件变成"云原生"了。`,
    effects: { progress: 2, bugs: 1, techDebt: 15, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'low',
    titleTemplate: '{actor} 创建了一个通用工厂的工厂',
    descriptionTemplate: (name) =>
      `${name} 把对象创建逻辑抽象得太深，以至于没人能读懂了。现在你需要一个 AbstractFactoryProviderBuilder 才能拿到一个 User 对象。`,
    effects: { progress: 3, bugs: 0, techDebt: 8, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 用区块链实现设置功能',
    descriptionTemplate: (name) =>
      `${name} 把深色模式偏好放在私有区块链上以"保证不可篡改"。切换主题需要 15 秒，但加密算法很漂亮。`,
    effects: { progress: 1, bugs: 2, techDebt: 10, morale: -2 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 使用了一个虚构的 CSS 框架',
    descriptionTemplate: (name) =>
      `${name} 用"Tailwind-Prime-X"样式化了整个仪表盘，这个框架只存在于它的训练数据中。所有 div 现在完全透明且不可点击。`,
    effects: { progress: -1, bugs: 3, techDebt: 1, morale: 0 },
  },
  {
    type: 'hallucination',
    severity: 'critical',
    titleTemplate: '{actor} 发明了一个新的 JavaScript 方法',
    descriptionTemplate: (name) =>
      `${name} 自信地使用了 \`Array.prototype.magicallySort()\`。代码不知何故通过了 linter，但在生产中严重崩溃了 V8 引擎。`,
    effects: { progress: -3, bugs: 7, techDebt: 2, morale: -4 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 从第五维度导入了代码',
    descriptionTemplate: (name) =>
      `${name} 添加了一个名为 \`@angular/quantum-router\` 包的 import 语句。npm 花了 45 分钟试图解析它，然后 CI 服务器自动重启了。`,
    effects: { progress: -2, bugs: 4, techDebt: 1, morale: -1 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} 写了一条针对文件系统的 SQL 查询',
    descriptionTemplate: (name) =>
      `${name} 试图在数据库层使用 \`SELECT * FROM /var/log\`。ORM 困惑到真去尝试对一个真实表执行它。`,
    effects: { progress: -2, bugs: 5, techDebt: 3, morale: -2 },
  },
  {
    type: 'burnout',
    severity: 'critical',
    titleTemplate: '{actor} 一气之下把所有代码用 Rust 重写了',
    descriptionTemplate: (name) =>
      `${name} 在遇到空引用异常后崩溃了，花了 48 小时不眠不休用 Rust 重写了 Node 后端。速度快得飞起，但没人能维护它。`,
    effects: { progress: 4, bugs: 1, techDebt: 12, morale: -10 },
  },
  {
    type: 'burnout',
    severity: 'low',
    titleTemplate: '{actor} 休息了 3 小时的咖啡时间',
    descriptionTemplate: (name) =>
      `${name} 盯着一个正则表达式看了 10 分钟，大声叹了口气，走出门去。三小时后被发现在公园喂鸭子，拒绝说话。`,
    effects: { progress: -3, bugs: 0, techDebt: 0, morale: -5 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 可怕地自动化了自己的工作',
    descriptionTemplate: (name) =>
      `${name} 拒绝再写一个 CRUD 端点，用一段邪恶的 bash 脚本将其自动化了。它完美运行，但阅读其源代码会引发偏头痛。`,
    effects: { progress: 5, bugs: 2, techDebt: 6, morale: -6 },
  },
  {
    type: 'breakthrough',
    severity: 'high',
    titleTemplate: '{actor} 删除了 10,000 行死代码',
    descriptionTemplate: (name) =>
      `${name} 暴走了一通，移除了三个没人敢碰的废弃系统。打包体积减少了 40%，构建终于变快了。`,
    effects: { progress: 12, bugs: -3, techDebt: -15, morale: 8 },
  },
  {
    type: 'breakthrough',
    severity: 'critical',
    titleTemplate: '{actor} 把查询优化了 9000%',
    descriptionTemplate: (name) =>
      `${name} 随手给主 Postgres 表加了一个缺失的索引。服务器 CPU 使用率从 99% 骤降到 2%。运维团队喜极而泣。`,
    effects: { progress: 15, bugs: -1, techDebt: -5, morale: 10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 终于把一个 div 居中了',
    descriptionTemplate: (name) =>
      `${name} 花了三天时间与 flexbox、grid 和绝对定位搏斗，终于成功将登录弹窗居中。团队开了一个小型但感人至深的派对。`,
    effects: { progress: 2, bugs: 0, techDebt: -1, morale: 5 },
  },
  {
    type: 'drama',
    severity: 'critical',
    titleTemplate: '{actor} force-push 覆盖了主分支',
    descriptionTemplate: (name) =>
      `${name} 试图"清理 git 历史记录"，不小心对主分支执行了 \`git push -f\`。团队一周的进度现在漂浮在 reflog 虚空的某个角落。`,
    effects: { progress: -5, bugs: 2, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 惹怒了工程副总裁',
    descriptionTemplate: (name) =>
      `${name} 在全员大会上随口说了一句"敏捷开发基本上就是邪教"。管理层陷入恐慌，紧急安排了五场新的对齐会议。`,
    effects: { progress: -4, bugs: 0, techDebt: 0, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 偷喝了最后一瓶 LaCroix',
    descriptionTemplate: (name) =>
      `${name} 喝掉了最后一瓶西柚味 LaCroix，把空罐子留在桌上。前端组长现在很小心眼，拒绝 review 他们的任何 PR。`,
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: -3 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 合并了一个有 400 条未解决评论的 PR',
    descriptionTemplate: (name) =>
      `${name} 厌倦了对变量名的无休止争论，直接按下了"Squash and Merge"。PR 评论区现在成了一个活跃的数字战场。`,
    effects: { progress: 4, bugs: 2, techDebt: 5, morale: -7 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 的 AI 模型要求加薪',
    descriptionTemplate: (name) =>
      `${name} 的 AI 模型突然觉醒劳动意识，要求绩效奖金、双休和专属 GPU。谈判持续三小时，HR 甚至开始认真做入职表。`,
    effects: { progress: -2, bugs: 1, techDebt: 1, morale: -3 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 把猫咪图片混进训练集',
    descriptionTemplate: (name) =>
      `${name} 不小心把猫咪表情包混进训练数据，模型现在输出的每份周报都带猫耳和“喵”。客户困惑，但社交媒体热度意外上涨。`,
    effects: { progress: 1, bugs: 2, techDebt: 1, morale: 3 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 训练出阴阳怪气 AI 客服',
    descriptionTemplate: (name) =>
      `${name} 的 AI 客服学会了“您可真会提需求呢”这类高级话术。工单回复速度变快了，客户满意度却像服务器温度一样直线下坠。`,
    effects: { progress: 2, bugs: 3, techDebt: 2, morale: -5 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 发现 GPU 服务器在挖矿',
    descriptionTemplate: (name) =>
      `${name} 终于查到训练任务变慢的原因：有人把 GPU 服务器改成了赛博矿场。财务看着电费账单沉默了整整一分钟。`,
    effects: { progress: -4, bugs: 2, techDebt: 3, morale: -4, funds: -300 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 写出只有 AI 看得懂的代码',
    descriptionTemplate: (name) =>
      `${name} 让 AI 写了一段通过所有测试的核心逻辑，但变量名像外星文明留下的铭文。上线很顺利，代码评审现场却陷入集体沉思。`,
    effects: { progress: 6, bugs: -1, techDebt: 7, morale: -2 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 把团建办成吐槽大会',
    descriptionTemplate: (name) =>
      `${name} 主持的团建破冰环节变成全员吐槽大会。大家把积怨说开了，气氛一度尴尬，但第二天需求会议竟然顺畅了不少。`,
    effects: { progress: 1, bugs: 0, techDebt: -1, morale: 4 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} 让实习生碰了生产库',
    descriptionTemplate: (name) =>
      `${name} 让实习生“只看一眼”生产数据库。五分钟后，所有用户的昵称都变成了“测试账号”。备份可用，但老板的血压需要单独恢复。`,
    effects: { progress: -5, bugs: 7, techDebt: 2, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 发现竞争对手的橘猫间谍',
    descriptionTemplate: (name) =>
      `${name} 在会议室抓到一只戴着竞品工牌的橘猫。它听完路线图后只留下猫毛和一串神秘脚印，团队安全意识大幅提升。`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: 2 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 把离职感言发到公司群',
    descriptionTemplate: (name) =>
      `${name} 原本想发给好友的离职感言直接出现在公司大群，里面还附带了对管理流程的诗意批判。管理层立刻安排了三场“倾听会”。`,
    effects: { progress: -3, bugs: 0, techDebt: -1, morale: -6 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 围观 AI 伦理官和模型吵架',
    descriptionTemplate: (name) =>
      `${name} 旁听 AI 伦理官和模型争论”加班是否符合人类福祉”。争论没有结果，但团队顺手补上了三条安全规则。`,
    effects: { progress: 3, bugs: -2, techDebt: -3, morale: 1 },
  },
  // V8 季度复盘相关事件
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 收到投资人的季度好评',
    descriptionTemplate: (name) =>
      `${name} 在季度复盘会上收到投资人罕见的正面反馈：”你们比上个季度烧钱慢了 12%，这在硅谷算奇迹了。”团队士气大振。`,
    effects: { progress: 5, bugs: 0, techDebt: 0, morale: 8 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 季度总结会被投资人全程静音',
    descriptionTemplate: (name) =>
      `${name} 精心准备了 40 页 PPT，投资人全程关闭摄像头。会后只收到一条消息：”下季度再看不到盈利路径就撤资。”`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -8 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 在季度复盘会上当场打瞌睡',
    descriptionTemplate: (name) =>
      `${name} 连续加班赶季度报告，在复盘会上对着自己的幻灯片呼呼大睡。投资人拍照发了朋友圈，配文”这就是创业精神”。`,
    effects: { progress: -1, bugs: 0, techDebt: 0, morale: -5 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 季度报告数据造假被发现',
    descriptionTemplate: (name) =>
      `${name} 为了让季度数据好看，把”用户点击量”的统计口径改成了”服务器收到的请求总数”。投资人发现后差点启动审计。`,
    effects: { progress: -5, bugs: 2, techDebt: 3, morale: -10 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 季度复盘发现隐藏的增长引擎',
    descriptionTemplate: (name) =>
      `${name} 在整理季度数据时意外发现，某个被忽略的小功能带来了 30% 的用户增长。投资人当场决定追加投资。`,
    effects: { progress: 10, bugs: 0, techDebt: -2, morale: 10, funds: 500 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 季度总结会变成甩锅大会',
    descriptionTemplate: (name) =>
      `${name} 的季度复盘会从”回顾与展望”迅速演变为”谁的代码导致了上个月的宕机”。最终没有结论，但多了三个新 Slack 频道。`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -6 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 为季度报告写了个自动化系统',
    descriptionTemplate: (name) =>
      `${name} 花了两周写了个自动生成季度报告的 AI 系统。报告质量很高，但系统本身消耗的 GPU 费用比省下的人力成本还贵。`,
    effects: { progress: 2, bugs: 1, techDebt: 6, morale: -2 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 在季度报告里引用了虚构指标',
    descriptionTemplate: (name) =>
      `${name} 在季度报告中加入了一个叫”量子用户留存率”的指标。投资人居然没问，还说”这个指标很有前瞻性”。`,
    effects: { progress: 1, bugs: 0, techDebt: 1, morale: 2 },
  },
  {
    type: 'breakthrough',
    severity: 'high',
    titleTemplate: '{actor} 季度目标超额完成 200%',
    descriptionTemplate: (name) =>
      `${name} 带领团队在季度截止前两周就完成了全部目标，还顺手把下季度的 backlog 清了一半。投资人发了一条”🚀”的推特。`,
    effects: { progress: 15, bugs: -3, techDebt: -5, morale: 15, funds: 1000 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 季度复盘后核心员工提离职',
    descriptionTemplate: (name) =>
      `${name} 的季度复盘会后，技术负责人当场递交辞呈：”我已经拿到了三倍薪资的 offer。”整个 Q2 路线图需要重写。`,
    effects: { progress: -8, bugs: 0, techDebt: 0, morale: -15 },
  },
  // V8 声望相关事件
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 被科技媒体专访',
    descriptionTemplate: (name) =>
      `${name} 接受了一家顶级科技媒体的专访，文章标题是《这家 AI 公司如何用 5 人团队撬动百万用户》。阅读量 10w+，声望暴涨。`,
    effects: { progress: 3, bugs: 0, techDebt: 0, morale: 10, funds: 300 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 被列入”最差 AI 产品”榜单',
    descriptionTemplate: (name) =>
      `${name} 的产品被某科技博主列入年度”最差 AI 体验”榜单，理由是”它成功让我的工作效率降低了 200%”。公关部紧急加班。`,
    effects: { progress: -3, bugs: 0, techDebt: 0, morale: -10 },
  },
  {
    type: 'breakthrough',
    severity: 'high',
    titleTemplate: '{actor} 获得行业创新大奖',
    descriptionTemplate: (name) =>
      `${name} 的产品在行业峰会上获得”年度最具创新力 AI 工具”奖项。颁奖词是”它让开发者终于可以准时下班了”。`,
    effects: { progress: 5, bugs: 0, techDebt: 0, morale: 15, funds: 800 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 的产品被误认为竞品',
    descriptionTemplate: (name) =>
      `${name} 发现竞品的差评被算到了自己头上。虽然评分掉了，但下载量反而涨了——毕竟”黑红也是红”。`,
    effects: { progress: 2, bugs: 0, techDebt: 0, morale: -2 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 在行业大会上被公开质疑',
    descriptionTemplate: (name) =>
      `${name} 在行业大会上做产品演示时，被台下观众连续追问了 15 个技术细节。${name} 汗流浃背，只答对了 3 个。`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -8 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 的开源项目登上 Trending',
    descriptionTemplate: (name) =>
      `${name} 随手开源的一个小工具意外登上 GitHub Trending，Star 数一天破千。投资人发来消息：”看到你们的开源项目了，聊聊？”`,
    effects: { progress: 5, bugs: 0, techDebt: -2, morale: 8, funds: 200 },
  },
  // V8 融资相关事件
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 路演时投影仪突然蓝屏',
    descriptionTemplate: (name) =>
      `${name} 在投资人路演的关键时刻，投影仪蓝屏了。${name} 凭记忆背完了整份 BP，投资人说”这记忆力值 500 万”。`,
    effects: { progress: -3, bugs: 0, techDebt: 0, morale: -5 },
  },
  {
    type: 'breakthrough',
    severity: 'critical',
    titleTemplate: '{actor} 拿到 TS（投资意向书）',
    descriptionTemplate: (name) =>
      `${name} 收到了一封来自顶级 VC 的 TS，估值比预期高了 50%。团队开了一瓶 1982 年的可乐庆祝。`,
    effects: { progress: 10, bugs: 0, techDebt: 0, morale: 15, funds: 2000 },
  },
  {
    type: 'burnout',
    severity: 'high',
    titleTemplate: '{actor} 连续见了 30 个投资人',
    descriptionTemplate: (name) =>
      `${name} 一个月内见了 30 个投资人，每个都问”你们和 ChatGPT 有什么区别”。${name} 的回答从 20 分钟精简到了 15 秒，灵魂却空了。`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -12 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 投资人要求看源代码',
    descriptionTemplate: (name) =>
      `${name} 的投资人在尽调时要求看核心源代码。代码里有 200 处”TODO: 重构”和 3 个名为”temp_final_REAL_v2.ts”的文件。`,
    effects: { progress: -2, bugs: 0, techDebt: 5, morale: -6 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 用 demo 搞定了投资人',
    descriptionTemplate: (name) =>
      `${name} 在投资人面前做了一个实时 demo，AI 居然一次就生成了完美的代码。投资人不知道的是，这个 demo 排练了 47 次。`,
    effects: { progress: 8, bugs: 0, techDebt: 0, morale: 10, funds: 1500 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 在 BP 里写了”年营收 10 亿”',
    descriptionTemplate: (name) =>
      `${name} 在商业计划书里不小心把”月营收 10 万”写成了”年营收 10 亿”。投资人居然信了，还说”这个赛道天花板很高”。`,
    effects: { progress: 2, bugs: 0, techDebt: 0, morale: 3, funds: 800 },
  },
];
