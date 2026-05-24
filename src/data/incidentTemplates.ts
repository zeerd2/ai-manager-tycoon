import type { IncidentTemplate } from '../domain/incident';

export const incidentTemplates: IncidentTemplate[] = [
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} built a Death Star for a TODO app',
    descriptionTemplate: (name) =>
      `${name} tried to fix a button style and accidentally introduced a plugin architecture that can scale to Mars colonies. Progress +8, tech debt +12.`,
    effects: { progress: 8, bugs: 0, techDebt: 12, morale: -2 },
  },
  {
    type: 'bug',
    severity: 'high',
    titleTemplate: '{actor} deployed straight to production',
    descriptionTemplate: (name) =>
      `${name} skipped staging because "it works on my machine." It did not, in fact, work on any other machine. Three services are now on fire.`,
    effects: { progress: -5, bugs: 8, techDebt: 3, morale: -5 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} hallucinated a nonexistent API',
    descriptionTemplate: (name) =>
      `${name} confidently integrated with an API that doesn't exist. The code compiles perfectly — it just calls into the void.`,
    effects: { progress: -3, bugs: 4, techDebt: 2, morale: -3 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} had a midnight epiphany',
    descriptionTemplate: (name) =>
      `${name} refactored the entire auth module at 3 AM and somehow made it 10x simpler. Nobody understands how, including ${name}.`,
    effects: { progress: 15, bugs: -2, techDebt: -5, morale: 8 },
  },
  {
    type: 'burnout',
    severity: 'high',
    titleTemplate: '{actor} entered existential crisis mode',
    descriptionTemplate: (name) =>
      `${name} started questioning the meaning of semicolons, then tabs vs spaces, then existence itself. Output dropped to zero for the day.`,
    effects: { progress: -2, bugs: 0, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} started a tabs-vs-spaces war',
    descriptionTemplate: (name) =>
      `${name} changed the entire project to tabs. Half the team revolted. A 47-message Slack thread ensued. No code was written for 4 hours.`,
    effects: { progress: -1, bugs: 0, techDebt: 1, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'critical',
    titleTemplate: '{actor} invented a new programming paradigm',
    descriptionTemplate: (name) =>
      `${name} decided the project needs "Quantum-Reactive-Functional-OOP" and rewrote the login page using 14 design patterns. It now takes 3 seconds to load a button.`,
    effects: { progress: 3, bugs: 2, techDebt: 18, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} left a console.log in prod',
    descriptionTemplate: (name) =>
      `${name} shipped with console.log("TODO: remove this lol") in the payment flow. Customers are mildly amused, management is not.`,
    effects: { progress: 0, bugs: 2, techDebt: 1, morale: -1 },
  },
  {
    type: 'breakthrough',
    severity: 'medium',
    titleTemplate: '{actor} found a 10-year-old bug',
    descriptionTemplate: (name) =>
      `${name} accidentally fixed a bug that had been in the codebase since the original jQuery migration. Five downstream services suddenly started working correctly. Nobody knows why.`,
    effects: { progress: 10, bugs: -5, techDebt: -3, morale: 10 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} cited a fictional StackOverflow answer',
    descriptionTemplate: (name) =>
      `${name} implemented an algorithm from a StackOverflow answer that has never existed. The algorithm actually works — but for a completely different problem.`,
    effects: { progress: -4, bugs: 6, techDebt: 4, morale: -2 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} refactored someone else\'s code without asking',
    descriptionTemplate: (name) =>
      `${name} "improved" a colleague's code overnight. The colleague's tests all broke. Passive-aggressive commit messages are now the team's primary communication channel.`,
    effects: { progress: 2, bugs: 3, techDebt: -2, morale: -6 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} auto-generated 10,000 unit tests',
    descriptionTemplate: (name) =>
      `${name} got tired of writing tests and generated 10,000 of them. All pass. None test anything meaningful. CI now takes 45 minutes.`,
    effects: { progress: 1, bugs: 0, techDebt: 8, morale: -3 },
  },
  {
    type: 'bug',
    severity: 'critical',
    titleTemplate: '{actor} dropped the production database',
    descriptionTemplate: (name) =>
      `${name} tried to run a migration script locally, but the DB_URL was still pointing to production. The backup from yesterday is suspiciously missing.`,
    effects: { progress: -5, bugs: 8, techDebt: 0, morale: -8 },
  },
  {
    type: 'bug',
    severity: 'medium',
    titleTemplate: '{actor} created an infinite loop in billing',
    descriptionTemplate: (name) =>
      `${name} accidentally created an infinite retry loop for failed payments. A customer was just charged 14,000 times for a $5 subscription. Legal is calling.`,
    effects: { progress: -2, bugs: 6, techDebt: 2, morale: -5 },
  },
  {
    type: 'bug',
    severity: 'low',
    titleTemplate: '{actor} broke the CSS on Safari',
    descriptionTemplate: (name) =>
      `${name} used a fancy new CSS feature that only works in Chrome Canary. Every Safari user now sees a giant 400px wide "Submit" button overlapping the logo.`,
    effects: { progress: 1, bugs: 3, techDebt: 0, morale: -1 },
  },
  {
    type: 'overengineering',
    severity: 'high',
    titleTemplate: '{actor} replaced cron with Kubernetes',
    descriptionTemplate: (name) =>
      `${name} decided that a simple nightly script needed to be a distributed orchestrator. The AWS bill just doubled, but at least the emails are "cloud-native."`,
    effects: { progress: 2, bugs: 1, techDebt: 15, morale: -4 },
  },
  {
    type: 'overengineering',
    severity: 'low',
    titleTemplate: '{actor} created a generic factory factory',
    descriptionTemplate: (name) =>
      `${name} abstracted the object creation logic so much that no one can read it anymore. You now need an AbstractFactoryProviderBuilder just to get a User object.`,
    effects: { progress: 3, bugs: 0, techDebt: 8, morale: -2 },
  },
  {
    type: 'overengineering',
    severity: 'medium',
    titleTemplate: '{actor} implemented blockchain for settings',
    descriptionTemplate: (name) =>
      `${name} put dark mode preferences on a private blockchain to "ensure immutability." It takes 15 seconds to toggle the theme, but the cryptography is beautiful.`,
    effects: { progress: 1, bugs: 2, techDebt: 10, morale: -2 },
  },
  {
    type: 'hallucination',
    severity: 'low',
    titleTemplate: '{actor} used a made-up CSS framework',
    descriptionTemplate: (name) =>
      `${name} styled the entire dashboard using "Tailwind-Prime-X", a framework that only exists in their training data. All divs are now entirely transparent and unclickable.`,
    effects: { progress: -1, bugs: 3, techDebt: 1, morale: 0 },
  },
  {
    type: 'hallucination',
    severity: 'critical',
    titleTemplate: '{actor} invented a new JavaScript method',
    descriptionTemplate: (name) =>
      `${name} confidently used \`Array.prototype.magicallySort()\`. The code somehow passed the linter but violently crashed the V8 engine in production.`,
    effects: { progress: -3, bugs: 7, techDebt: 2, morale: -4 },
  },
  {
    type: 'hallucination',
    severity: 'medium',
    titleTemplate: '{actor} imported from the 5th dimension',
    descriptionTemplate: (name) =>
      `${name} added an import statement for a package named \`@angular/quantum-router\`. npm spent 45 minutes trying to resolve it before the CI server spontaneously rebooted.`,
    effects: { progress: -2, bugs: 4, techDebt: 1, morale: -1 },
  },
  {
    type: 'hallucination',
    severity: 'high',
    titleTemplate: '{actor} wrote a SQL query targeting the file system',
    descriptionTemplate: (name) =>
      `${name} attempted to use \`SELECT * FROM /var/log\` in the database layer. The ORM was so confused it actually tried to execute it against a real table.`,
    effects: { progress: -2, bugs: 5, techDebt: 3, morale: -2 },
  },
  {
    type: 'burnout',
    severity: 'critical',
    titleTemplate: '{actor} rewrote everything in Rust out of spite',
    descriptionTemplate: (name) =>
      `${name} snapped after a null reference exception and spent 48 sleepless hours rewriting the Node backend in Rust. It's blazing fast, but nobody else can maintain it.`,
    effects: { progress: 4, bugs: 1, techDebt: 12, morale: -10 },
  },
  {
    type: 'burnout',
    severity: 'low',
    titleTemplate: '{actor} took a 3-hour coffee break',
    descriptionTemplate: (name) =>
      `${name} stared at a regex pattern for 10 minutes, sighed loudly, and walked out the door. They were found three hours later feeding ducks in the park, refusing to speak.`,
    effects: { progress: -3, bugs: 0, techDebt: 0, morale: -5 },
  },
  {
    type: 'burnout',
    severity: 'medium',
    titleTemplate: '{actor} automated their own job terrifyingly',
    descriptionTemplate: (name) =>
      `${name} refused to write another CRUD endpoint and automated it with an unholy bash script. It works flawlessly, but reading its source code causes migraines.`,
    effects: { progress: 5, bugs: 2, techDebt: 6, morale: -6 },
  },
  {
    type: 'breakthrough',
    severity: 'high',
    titleTemplate: '{actor} deleted 10,000 lines of dead code',
    descriptionTemplate: (name) =>
      `${name} went on a rampage and removed three deprecated systems nobody had the courage to touch. The bundle size dropped by 40% and the build is finally fast.`,
    effects: { progress: 12, bugs: -3, techDebt: -15, morale: 8 },
  },
  {
    type: 'breakthrough',
    severity: 'critical',
    titleTemplate: '{actor} optimized a query by 9000%',
    descriptionTemplate: (name) =>
      `${name} casually added a single missing index to the main Postgres table. The server CPU usage plummeted from 99% to 2%. The DevOps team is weeping tears of joy.`,
    effects: { progress: 15, bugs: -1, techDebt: -5, morale: 10 },
  },
  {
    type: 'breakthrough',
    severity: 'low',
    titleTemplate: '{actor} finally centered a div',
    descriptionTemplate: (name) =>
      `${name} spent three days battling flexbox, grid, and absolute positioning before successfully centering the login modal. The team threw a small, deeply emotional party.`,
    effects: { progress: 2, bugs: 0, techDebt: -1, morale: 5 },
  },
  {
    type: 'drama',
    severity: 'critical',
    titleTemplate: '{actor} force-pushed over main',
    descriptionTemplate: (name) =>
      `${name} tried to "clean up the git history" and accidentally ran \`git push -f\` over the main branch. A week of team progress is now floating somewhere in the reflog void.`,
    effects: { progress: -5, bugs: 2, techDebt: 0, morale: -10 },
  },
  {
    type: 'drama',
    severity: 'high',
    titleTemplate: '{actor} triggered the VP of Engineering',
    descriptionTemplate: (name) =>
      `${name} casually mentioned in an all-hands meeting that "Agile is basically a cult." Management panicked and scheduled five new alignment meetings.`,
    effects: { progress: -4, bugs: 0, techDebt: 0, morale: -8 },
  },
  {
    type: 'drama',
    severity: 'low',
    titleTemplate: '{actor} stole the last LaCroix',
    descriptionTemplate: (name) =>
      `${name} drank the last Pamplemousse LaCroix and left the empty can on the desk. The frontend lead is now petty and refusing to review any of their PRs.`,
    effects: { progress: 0, bugs: 0, techDebt: 0, morale: -3 },
  },
  {
    type: 'drama',
    severity: 'medium',
    titleTemplate: '{actor} merged a PR with 400 unresolved comments',
    descriptionTemplate: (name) =>
      `${name} got tired of the bikeshedding over variable names and just hit 'Squash and Merge'. The PR comments section is now an active digital war zone.`,
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
];
