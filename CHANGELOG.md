# 更新日志

## v5 — 最终打磨 (2026-05-24)

- 完善 README.md，补充完整功能列表和成就表
- 员工关系可视化组件 `RelationsNetwork`
- 存档系统完善：多槽位（3 手动 + 1 自动）+ 自动存档配置
- 游戏结束界面 `GameOverScreen`
- 成就进度追踪函数 `getAchievementProgress`
- 移除旧版 localStorage 自动存档引擎，迁移到多槽位系统
- 优化代码质量：修复 TypeScript 类型问题，补充 JSDoc
- 测试覆盖率达 150+ 用例，全部通过

## v4 — 成就系统扩展 (2026-05-24)

- 成就系统从 8 项扩展到 16 项
- 新增成就：
  - `满级大佬 (max-skill)` — 传说级成就：培养全技能 100 的员工
  - `人才济济 (big-team)` — 解锁 6 名以上员工
  - `伯乐 (talent-scout)` — 培养总技能 ≥ 450 的明星员工
  - `地狱难度通关 (legendary-project)` — 完成难度 ≥ 80 的传说项目
  - `财务自由 (financial-freedom)` — 剩余资金 ≥ 8000
  - `散财童子 (big-spender)` — 累计花费 ≥ 10000
  - `大难不死 (survivor)` — 在产生 15+ bugs 后完成项目
  - `Murphy 定律 (murphy-law)` — 单局产生 50+ bugs
- 引入稀有度体系: common / rare / epic / legendary
- 增加成就追踪进度函数 `getAchievementProgress`

## v3 — 员工关系与团队事件 (2026-05-24)

- 实现员工关系系统 (`RelationsManager`)
  - 双人间关系评分 (-100 ~ +100)
  - 关系影响协作效率 (±20%)
  - 完成项目后参与者关系提升
- 实现团队事件系统 (`generateTeamEvent`)
  - 15% 概率在 Sprint 前触发
  - 多选项事件，影响士气、资金、进度和 Bug
- 新增 `teamEvents.ts` 数据文件
- 新增 `TeamEventDialog` 组件
- 新增技能树基础 (`skillTrees` 字段预留)
- 存档系统升级到 v4（新增技能树/关系/成就/项目历史字段）
- 多槽位存档系统（3 手动 + 1 自动）
- 自动存档配置（开关 + 间隔）
- 旧版存档自动迁移

## v2 — 完整游戏引擎 (2026-05-24)

- 游戏引擎：完整的 Sprint 流程，包含进度、Bug、技术债和士气计算
- 评分系统（S/A/B/C/D/F 等级 + 中文评语）
- 成就系统（8 项初始成就）
- 组合事件系统（特定事件组合触发连锁反应）
- 搞笑事故模板（30+ 条 incident 模板）
- 游戏结束判定的两种条件
- 设计师解锁机制
- UI 组件：
  - `AgentCard` / `ProjectCard` / `StrategySelector`
  - `ResultReport` / `HistoryPanel`
  - `CompanyDashboard` / `GameOverScreen`
  - `AchievementToast` / `AchievementPanel`
  - `SaveManager`（初版）

## v1 — 项目初始化

- React + TypeScript + Vite 项目脚手架
- 基础领域模型定义（Agent / Project / Strategy / Incident）
- 随机数工具函数
- 评分计算公式
- 示例数据（6 名 AI 工程师、4 个项目、6 种策略）
