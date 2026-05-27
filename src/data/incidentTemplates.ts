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
      `${name} 旁听 AI 伦理官和模型争论“加班是否符合人类福祉”。争论没有结果，但团队顺手补上了三条安全规则。`,
    effects: { progress: 3, bugs: -2, techDebt: -3, morale: 1 },
  },
  // v9 新增事件模板
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} 的存档文件被量子化了',
    descriptionTemplate: (name) =>
      `${name} 尝试优化存档压缩算法，结果把玩家的存档数据变成了薛定谔态——既是满级通关又是刚建号。成就系统决定两个都算数。`,
    effects: { progress: -4, bugs: 9, techDebt: 5, morale: -6 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 的成就追踪器开始跟踪空气',
    descriptionTemplate: (name) =>
      `${name} 的成就系统现在会追踪"连续呼吸 100 次"和"眨眼频率达标"这类成就。玩家在社交媒体上疯传这些截图，公关部门紧急开会。`,
    effects: { progress: -1, bugs: 5, techDebt: 3, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 给排行榜加了区块链验证',
    descriptionTemplate: (name) =>
      `${name} 为了"防止排行榜作弊"，给每条分数记录都加了区块链验证。现在查看排行榜需要 30 秒同步，但每条记录都不可篡改（也没人看了）。`,
    effects: { progress: 2, bugs: 1, techDebt: 12, morale: -3 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 统计出了负数的玩家在线时长',
    descriptionTemplate: (name) =>
      `${name} 的统计面板显示部分玩家的在线时长是 -47 小时。原来它把时区转换和夏令时叠加了三次。数据分析师看着报告陷入了存在主义危机。`,
    effects: { progress: -2, bugs: 4, techDebt: 2, morale: -3 },
  },
  {
    type: 'burnout',
    severity: 'high',
    titleTemplate: '{actor} 在成就弹窗里写了辞职信',
    descriptionTemplate: (name) =>
      `${name} 连续加班 72 小时后精神崩溃，把辞职信编码进了成就达成的烟花动画里。玩家以为是彩蛋，疯狂截图传播。HR 还没反应过来。`,
    effects: { progress: -3, bugs: 2, techDebt: 1, morale: -8 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 发现成就进度可以跨版本继承',
    descriptionTemplate: (name) =>
      `${name} 意外发现存档数据里的隐藏字段竟然能完美兼容新版本的成就系统。玩家的旧成就进度全部自动解锁，社区欢呼"终于有个不坑的更新了"。`,
    effects: { progress: 12, bugs: -2, techDebt: -4, morale: 8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 的行为追踪报告吓到了市场部',
    descriptionTemplate: (name) =>
      `${name} 的玩家行为分析报告显示"80% 的玩家在加载画面时切出去刷短视频"。市场部决定在加载画面里放广告，产品部决定优化加载速度。两部门吵了一周。`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: -4 },
  },
  {
    type: 'bug',
    severity: 'medium',
    titleTemplate: '{actor} 让成就系统开始自我授奖',
    descriptionTemplate: (name) =>
      `${name} 的成就检测逻辑出现了递归：解锁成就触发"解锁成就"的成就，然后触发"解锁解锁成就的成就"。服务器差点被无限循环烧穿。`,
    effects: { progress: -2, bugs: 7, techDebt: 4, morale: -3 },
  },
  {
    type: 'overengineering',
    severity: 'high',
    titleTemplate: '{actor} 用机器学习预测玩家什么时候退游',
    descriptionTemplate: (name) =>
      `${name} 训练了一个预测玩家流失的模型，准确率 99.7%——因为它预测所有人都会流失。产品经理看着"全量推送挽留邮件"的方案沉默了。`,
    effects: { progress: 3, bugs: 1, techDebt: 10, morale: -4 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} 的统计 API 返回了平行宇宙的数据',
    descriptionTemplate: (name) =>
      `${name} 的统计接口突然开始返回"另一个版本"的游戏数据——那个版本里玩家人均氪金 5000 元。全公司庆祝了三天才发现数据是假的。`,
    effects: { progress: -3, bugs: 6, techDebt: 3, morale: -5 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 的存档压缩率突破了物理极限',
    descriptionTemplate: (name) =>
      `${name} 随手改了一行压缩参数，存档文件从 50MB 缩到了 200KB。没人知道丢失的 49.8MB 数据去了哪里，但玩家说游戏反而变快了。`,
    effects: { progress: 8, bugs: -1, techDebt: -6, morale: 5 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 把玩家数据做成了 NFT',
    descriptionTemplate: (name) =>
      `${name} "为了数据安全"把每个玩家的存档哈希上链了。法务部发来 47 页的合规警告，但社区里已经有人在交易"限量版存档"了。`,
    effects: { progress: -2, bugs: 1, techDebt: 8, morale: -5 },
  },
  // v9 扩充: 存档迁移、成就猎人、统计追踪、版本兼容
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 的存档迁移脚本吞噬了旧版本数据',
    descriptionTemplate: (name) =>
      `${name} 写的 v8→v9 迁移脚本太激进了——它不仅迁移了数据，还顺手"优化"掉了玩家三年的存档历史。客服热线已被打爆。`,
    effects: { progress: -3, bugs: 8, techDebt: 4, morale: -7 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} 发现成就检测逻辑在凌晨会抽风',
    descriptionTemplate: (name) =>
      `${name} 发现成就系统在 UTC+8 的凌晨 2:00-3:00 会随机触发"幽灵解锁"——玩家醒来发现自己多了 47 个从未见过的成就。社区开始传"午夜成就雨"都市传说。`,
    effects: { progress: -2, bugs: 6, techDebt: 3, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 给存档文件加了五层加密和量子签名',
    descriptionTemplate: (name) =>
      `${name} 担心存档被篡改，给每个存档文件加了 AES-256、RSA、SHA-512、区块链哈希和一个"量子不确定性校验码"。读取存档现在需要 45 秒，但安全感拉满。`,
    effects: { progress: 1, bugs: 2, techDebt: 14, morale: -3 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 的统计面板开始显示未来数据',
    descriptionTemplate: (name) =>
      `${name} 的统计 API 因为时区 bug 开始返回"明天"的数据。老板兴奋地宣布"我们有了预测性分析"，直到发现明天的 DAU 是负数。`,
    effects: { progress: -1, bugs: 4, techDebt: 2, morale: -2 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} 在存档校验函数里写了一首诗',
    descriptionTemplate: (name) =>
      `${name} 在连续加班处理存档损坏问题后，把校验函数的注释写成了一首关于数据无常的十四行诗。代码审查时没人舍得删，它现在是项目里最受欢迎的文件。`,
    effects: { progress: -1, bugs: 0, techDebt: 2, morale: -5 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 发明了成就进度无损压缩算法',
    descriptionTemplate: (name) =>
      `${name} 意外发现可以用差分编码把成就进度数据压缩到原来的 1/200。同步速度提升了 50 倍，手机端玩家终于不用等"同步中..."转圈了。`,
    effects: { progress: 10, bugs: -1, techDebt: -8, morale: 6 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 把成就排行榜做成了社交压力工具',
    descriptionTemplate: (name) =>
      `${name} 设计的排行榜会推送"你的朋友都解锁了这个成就，就差你了"的通知。玩家留存率飙升，但心理咨询热线被打爆了。`,
    effects: { progress: 3, bugs: 0, techDebt: 2, morale: -7 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 的版本号解析器不认识 v9.10',
    descriptionTemplate: (name) =>
      `${name} 用字符串比较处理版本号，导致 v9.10 被认为比 v9.2 小。所有使用新版本的玩家都被提示"请升级到最新版本"。`,
    effects: { progress: -1, bugs: 3, techDebt: 1, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'high',
    titleTemplate: '{actor} 为每个成就都写了一个独立的微服务',
    descriptionTemplate: (name) =>
      `${name} 认为"解锁喝水成就"和"解锁摸鱼成就"需要独立扩展，于是为 200 个成就各部署了一个微服务。运维团队看着 200 个 Pod 的监控面板集体沉默。`,
    effects: { progress: 2, bugs: 3, techDebt: 16, morale: -5 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 的存档校验码和一部电影哈希碰撞了',
    descriptionTemplate: (name) =>
      `${name} 发现某个玩家的存档校验码和《黑客帝国》的文件哈希完全一致。该玩家的存档开始播放绿色代码雨动画，社区将其奉为"天选之档"。`,
    effects: { progress: 0, bugs: 1, techDebt: 0, morale: 4 },
  },
  {
    type: 'breakthrough',
    severity: 'high',
    titleTemplate: '{actor} 实现了成就进度的实时热更新',
    descriptionTemplate: (name) =>
      `${name} 用 WebSocket 推送成就进度变化，玩家再也不用手动刷新。达成成就的瞬间反馈让"再来一局"的点击率暴涨 400%。产品经理激动得当场写了一首赞美诗。`,
    effects: { progress: 14, bugs: -2, techDebt: -3, morale: 10 },
  },
  {
    type: 'bug',
    severity: 'medium',
    titleTemplate: '{actor} 的存档自动备份占满了整个云存储',
    descriptionTemplate: (name) =>
      `${name} 设置的备份策略是"每分钟全量备份"。三天后，云存储账单比服务器成本还高。财务部发来邮件："请问这个'存档'是金子做的吗？"`,
    effects: { progress: -1, bugs: 2, techDebt: 5, morale: -3, funds: -500 },
  },
];
