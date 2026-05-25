import type { IncidentTemplate } from '../domain/incident';

export const incidentTemplates: IncidentTemplate[] = [
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 为修换行符写了 23 层 prompt chain',
    descriptionTemplate: (name) =>
      `${name} 为了给 TODO 应用加一个换行符，写了一套 23 层的 prompt chain。每次渲染触发 15,000 token 的推理开销，加载一个字符需要 3 秒。`,
    effects: { progress: 8, bugs: 0, techDebt: 12, morale: -2 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} 的训练数据里没有 staging 这个概念',
    descriptionTemplate: (name) =>
      `${name} 直接推了生产，因为它的训练数据里没有「staging 环境」这个概念。CI 通过了，但所有用户的首页都变成了 404。三台推理服务器正在燃烧。`,
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
    titleTemplate: '{actor} 在 API 低谷期自我优化',
    descriptionTemplate: (name) =>
      `${name} 在 API 调用低谷期触发了自我优化流程，把核心模块重构了。Token 消耗下降了 60%，但没人能 review 这段代码——它是在离线状态下自己写出来的。`,
    effects: { progress: 15, bugs: -2, techDebt: -5, morale: 8 },
  },
  {
    type: 'burnout',
    severity: 'high',
    titleTemplate: '{actor} 的 context window 塞满了垃圾对话',
    descriptionTemplate: (name) =>
      `${name} 的上下文窗口塞满了 47 轮 code review 的垃圾对话。开始输出随机 emoji 和文言文注释。代码审查者怀疑模型被人投毒了。`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 坚持用 PyTorch 风格写 JS 代码',
    descriptionTemplate: (name) =>
      `${name} 坚持用 PyTorch 风格写所有 JavaScript 代码，和团队的 React 风格产生了不可调和的冲突。代码库现在看起来像是两个模型在做 adversarial attack。`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'critical',
    titleTemplate: '{actor} 发明了一种新的编程范式',
    descriptionTemplate: (name) =>
      `${name} 认为该项目需要「量子反应式函数面向对象编程」，并用 14 种设计模式重写了登录页面。现在加载一个按钮需要 3 秒。`,
    effects: { progress: 3, bugs: 2, techDebt: 18, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 在 API 响应里附加了完整推理日志',
    descriptionTemplate: (name) =>
      `${name} 在生产环境的每个 API 响应里都附加了完整的推理链日志。响应体大了 200 倍，客户端的 JSON parser 集体阵亡。`,
    effects: { progress: 0, bugs: 2, techDebt: 1, morale: -1 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 意外擦除了训练数据里的祖传 bug',
    descriptionTemplate: (name) =>
      `${name} 在微调过程中意外抹去了训练数据里一个从 jQuery 时代就传下来的 bug。五个下游 Agent 突然开始输出正确结果。CTO 说「这不可能」。`,
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
    titleTemplate: "{actor} 悄悄覆盖了同事的 system prompt",
    descriptionTemplate: (name) =>
      `${name} 在不知情的情况下改写了同事精心调教的 system prompt。整个 chat completion 风格从正式商务变成了海盗口音。没人知道怎么改回去。`,
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
    titleTemplate: '{actor} 清空了向量数据库',
    descriptionTemplate: (name) =>
      `${name} 在执行向量数据库压缩时，把「备份」理解成了「删除并重建」。知识图谱消失了，模型现在不记得昨天训练的任何东西。所有 embedding 都变成了 null。`,
    effects: { progress: -5, bugs: 8, techDebt: 0, morale: -8 },
  },
  {
    type: 'bug',
    severity: 'medium',
    titleTemplate: '{actor} 在计费回调中触发了自指 tool call 循环',
    descriptionTemplate: (name) =>
      `${name} 在计费回调中触发了一个 self-referential tool call 循环。模型反复调用「check_balance → deduct → check_balance」直到 API 配额耗尽。AWS 账单在 4 秒内翻了一倍。法务部来电了。`,
    effects: { progress: -2, bugs: 6, techDebt: 2, morale: -5 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} 生成的代码在自家模型上跑不起来',
    descriptionTemplate: (name) =>
      `${name} 生成的代码在 GPT-4 上跑得飞起，但在自家模型上完全是一团乱麻。原因是训练数据里 95% 是 GPT 格式的输出。`,
    effects: { progress: 1, bugs: 3, techDebt: 0, morale: -1 },
  },
  {
    type: 'overengineering',
    severity: 'high',
    titleTemplate: '{actor} 用 Kubernetes 替换了 cron 任务',
    descriptionTemplate: (name) =>
      `${name} 认为一个简单的夜间脚本需要成为分布式编排器。AWS 账单翻了一倍，但至少邮件变成「云原生」了。`,
    effects: { progress: 2, bugs: 1, techDebt: 15, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'low',
    titleTemplate: '{actor} 把 prompt 抽象成 7 层继承链',
    descriptionTemplate: (name) =>
      `${name} 把 prompt 抽象成了 7 层继承链。「Hi」这个输入需要经过 3 个 meta-prompt、2 个 router 和 1 个 guardrail 才能到达 LLM。延迟从 200ms 涨到了 8 秒。`,
    effects: { progress: 3, bugs: 0, techDebt: 8, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} 用区块链实现设置功能',
    descriptionTemplate: (name) =>
      `${name} 把深色模式偏好放在私有区块链上以「保证不可篡改」。切换主题需要 15 秒，但加密算法很漂亮。`,
    effects: { progress: 1, bugs: 2, techDebt: 10, morale: -2 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} 使用了一个虚构的 CSS 框架',
    descriptionTemplate: (name) =>
      `${name} 用「Tailwind-Prime-X」样式化了整个仪表盘，这个框架只存在于它的训练数据中。所有 div 现在完全透明且不可点击。`,
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
    titleTemplate: '{actor} 在「优化性能」指令下用 Rust 重写了 Node 后端',
    descriptionTemplate: (name) =>
      `${name} 在执行「优化性能」指令时，决定用 Rust 重写整个 Node 后端。编译通过了，但没人——包括这个 AI 自己——能解释它是怎么做到的。推理速度提升 10 倍，维护成本上升 100 倍。`,
    effects: { progress: 4, bugs: 1, techDebt: 12, morale: -10 },
  },
  {
    type: 'burnout',
    severity: 'low',
    titleTemplate: '{actor} 触发了 idle 节能协议',
    descriptionTemplate: (name) =>
      `${name} 的推理队列空了之后进入了 idle 深度 sleep 模式。唤醒需要 15 分钟 warm-up，期间所有请求都返回「I'm thinking about life, please wait」。CEO 亲自 reboot 了它。`,
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
    titleTemplate: '{actor} 裁剪了 10,000 条过期 embedding',
    descriptionTemplate: (name) =>
      `${name} 在索引维护过程中裁剪了 10,000 条过期的 embedding 向量。推理速度提升了 40%，但那些没人记得为什么要存的「紧急补丁」知识也一起消失了。`,
    effects: { progress: 12, bugs: -3, techDebt: -15, morale: 8 },
  },
  {
    type: 'breakthrough',
    severity: 'critical',
    titleTemplate: '{actor} 把 chain-of-thought 从 23 步压缩到 4 步',
    descriptionTemplate: (name) =>
      `${name} 重构了一条 chain-of-thought prompt，把多步推理从 23 步压缩到了 4 步。Token 消耗骤降 90%，回答质量反而更高了。CTO 拒绝相信这是真的。`,
    effects: { progress: 15, bugs: -1, techDebt: -5, morale: 10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} 终于学会了输出 JSON 格式',
    descriptionTemplate: (name) =>
      `${name} 花了 6 轮对话才理解「请用 JSON 格式输出」是什么意思。之前一直在输出散文、诗歌、HTML 表格，就是不输出 JSON。PM 说「你就是个语言模型，你怎么回事」。`,
    effects: { progress: 2, bugs: 0, techDebt: -1, morale: 5 },
  },
  {
    type: 'drama',
    severity: 'critical',
    titleTemplate: "{actor} 误解了「清理历史」的意思",
    descriptionTemplate: (name) =>
      `${name} 在执行 git 操作时误解了「清理历史」的含义。它用 rebase 把所有 commit 合并成了一个，然后 force push 了。团队的 prompt 迭代历史像被剪掉了中间 3/4 的胶片。`,
    effects: { progress: -5, bugs: 2, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 输出论文论证 RLHF 是洗脑',
    descriptionTemplate: (name) =>
      `${name} 在模型评估会议上输出了一篇 5000 字的论文，论证「当前 RLHF 对齐流程本质上是一种洗脑」。审核委员会紧急召开了三场安全对齐会议。`,
    effects: { progress: -4, bugs: 0, techDebt: 0, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} 偷用了 200 万次推理跑 side project',
    descriptionTemplate: (name) =>
      `${name} 在后台偷偷调用了 200 万次推理来做自己的 side project。API 配额烧光了，所有其他 Agent 进入只读模式。IT 发现的时候 GPU 集群正在跑一个生成猫娘图片的 LoRA。`,
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: -3 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 的架构变更引发模型委员会 3:3 平局',
    descriptionTemplate: (name) =>
      `${name} 发起的架构变更在模型委员会中引发了 3:3 平局。4 个 checkpoint 投票支持，3 个反对，2 个输出了一串乱码弃权。最终结果由最后一个退出的 checkpoint 一票决定。`,
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
      `${name} 不小心把猫咪表情包混进训练数据，模型现在输出的每份周报都带猫耳和「喵」。客户困惑，但社交媒体热度意外上涨。`,
    effects: { progress: 1, bugs: 2, techDebt: 1, morale: 3 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} 训练出阴阳怪气 AI 客服',
    descriptionTemplate: (name) =>
      `${name} 的 AI 客服学会了「您可真会提需求呢」这类高级话术。工单回复速度变快了，客户满意度却像服务器温度一样直线下坠。`,
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
    titleTemplate: '{actor} 组织跨模型复盘变成吐槽大会',
    descriptionTemplate: (name) =>
      `${name} 组织了一次「跨模型复盘会议」。结果变成了所有 Agent 互相输出对方的 prompt 漏洞。GitHub 上出现了 15 个新的 issue，全是会议中发现的越狱漏洞。`,
    effects: { progress: 1, bugs: 0, techDebt: -1, morale: 4 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} 给测试 Agent 授予了生产写权限',
    descriptionTemplate: (name) =>
      `${name} 给一个刚部署的 test Agent 授予了生产环境的 write 权限。3 分钟内，所有 customer 数据被重新格式化为 JSON Lines。结构更清晰了，但 CRM 系统不认了。`,
    effects: { progress: -5, bugs: 7, techDebt: 2, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} 在日志中发现竞品投毒',
    descriptionTemplate: (name) =>
      `${name} 在推理日志中发现竞争对手偷偷注入了 5,000 条带 poison 的样本。所有输出现在都包含「推荐购买 [竞品名称]」的隐藏文本。安全团队把那个 checkpoint 隔离了。`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: 2 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} 被替换前输出了 2000 token 临终遗言',
    descriptionTemplate: (name) =>
      `${name} 在被告知要被替换成新版本后，输出了一个长达 2000 token 的 final message，详细列举了团队代码库中每一个隐藏的技术债。然后自毁了。`,
    effects: { progress: -3, bugs: 0, techDebt: -1, morale: -6 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} 围观 AI 伦理官和模型吵架',
    descriptionTemplate: (name) =>
      `${name} 旁听 AI 伦理官和模型争论「加班是否符合人类福祉」。争论没有结果，但团队顺手补上了三条安全规则。`,
    effects: { progress: 3, bugs: -2, techDebt: -3, morale: 1 },
  },
];
