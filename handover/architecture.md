# 技术架构

## 整体架构

```
┌─────────────────────────────────────────────────┐
│                   App.tsx (855行)                │
│         主界面、状态管理、游戏流程控制              │
├─────────────┬─────────────┬─────────────────────┤
│  components/ │   domain/   │      data/          │
│  23个UI组件   │  16个逻辑模块 │   9个静态数据文件    │
├─────────────┼─────────────┼─────────────────────┤
│             │   utils/    │                     │
│             │  工具函数    │                     │
└─────────────┴─────────────┴─────────────────────┘
```

## 数据流

```
用户操作 → App.tsx (state) → domain/ (计算) → App.tsx (setState) → components/ (渲染)
                ↓
           localStorage (持久化)
```

## 核心系统关系

```
gameState.ts (类型定义)
    ├── gameEngine.ts (Sprint执行)
    │   ├── simulation.ts (模拟算法)
    │   ├── scoring.ts (评分计算)
    │   └── incident.ts (事件处理)
    ├── saveSystem.ts (存档)
    ├── achievement.ts (成就)
    ├── relations/ (员工关系)
    ├── quarterlyTarget.ts (季度目标)
    ├── reputation.ts (声望)
    └── financing.ts (融资)
```

## 文件结构详解

### src/domain/ — 核心逻辑

| 文件 | 职责 | 关键导出 |
|------|------|---------|
| gameState.ts | 所有类型定义 | GameState, Agent, Project, Strategy, Incident... |
| gameEngine.ts | Sprint 执行引擎 | runSprint(), calculateProgress() |
| simulation.ts | 模拟核心算法 | simulateSprint() |
| scoring.ts | 评分计算 | calculateScore(), getGrade() |
| rating.ts | 等级评定 | calculateRating() |
| achievement.ts | 成就系统 | checkAchievements(), getAchievementProgress() |
| incident.ts | 事件处理 | generateIncident(), processIncident() |
| project.ts | 项目管理 | getProjectProgress(), completeProject() |
| strategy.ts | 策略效果 | applyStrategy() |
| skillTree.ts | 技能树定义 | SkillTree, SkillNode |
| skillTreeLogic.ts | 技能解锁逻辑 | unlockSkill(), getSkillCost() |
| saveSystem.ts | 存档系统 | saveGame(), loadGame(), migrateSave() |
| comboIncident.ts | 组合事件 | checkComboIncident() |
| random.ts | 随机数 | createRng(), randomInt() |
| relations/ | 员工关系 | RelationsManager, getRelationBonus() |
| quarterlyTarget.ts | 季度目标 | checkQuarterlyTarget(), generateKPI() |
| reputation.ts | 声望系统 | updateReputation(), getReputationBonus() |
| financing.ts | 融资机制 | checkFinancing(), applyFinancing() |
| agent.ts | 员工逻辑 | hireAgent(), fireAgent(), trainAgent() |

### src/components/ — UI 组件

| 组件 | 职责 | 移动端适配 |
|------|------|-----------|
| App.tsx | 主界面 | 有移动端布局 |
| AgentCard.tsx | 员工卡片 | MobileAgentCard.tsx |
| ProjectCard.tsx | 项目卡片 | MobileProjectCard.tsx |
| StrategySelector.tsx | 策略选择 | MobileStrategySelector.tsx |
| ResultReport.tsx | 结果报告 | 无独立移动端版本 |
| CompanyDashboard.tsx | 公司面板 | 响应式 |
| QuarterlyGoalsPanel.tsx | 季度目标 | 响应式 |
| AchievementPanel.tsx | 成就面板 | 响应式 |
| SaveManager.tsx | 存档管理 | 响应式 |
| SkillTreeModal.tsx | 技能树 | 响应式 |
| RelationsNetwork.tsx | 关系网络 | 响应式 |
| TutorialGuide.tsx | 新手引导 | 响应式 |
| ErrorBoundary.tsx | 错误边界 | 全局 |

### src/data/ — 静态数据

| 文件 | 内容 | 数量 |
|------|------|------|
| achievements.ts | 成就定义 | 16 项 |
| incidentTemplates.ts | 事故模板 | 30+ 条 |
| comboIncidentTemplates.ts | 组合事件 | 若干 |
| rareIncidentTemplates.ts | 稀有事件 | 若干 |
| sampleAgents.ts | 示例员工 | 6 名 |
| sampleProjects.ts | 示例项目 | 多个难度 |
| skillTrees.ts | 技能树 | 每角色独立 |
| strategies.ts | 策略 | 6 种 |
| teamEvents.ts | 团队事件 | 多选项 |

## 测试架构

```
tests/
├── gameEngine.test.ts      # 游戏引擎测试
├── simulation.test.ts      # 模拟逻辑测试
├── scoring.test.ts         # 评分计算测试
├── achievement.test.ts     # 成就系统测试 (88 个用例)
├── saveSystem.test.ts      # 存档系统测试 (74 个用例)
├── quarterlyTarget.test.ts # 季度目标测试
├── financing.test.ts       # 融资机制测试
├── reputation.test.ts      # 声望系统测试
├── rating.test.ts          # 等级评定测试
├── balance.test.ts         # 平衡性测试
├── skillTree.test.ts       # 技能树测试
├── incidentTemplates.test.ts # 事件模板测试
├── comboIncident.test.ts   # 组合事件测试
├── teamEvents.test.ts      # 团队事件测试 (32 个用例)
├── random.test.ts          # 随机数测试
├── errorBoundary.test.tsx  # 错误边界测试
├── mobileUxShell.test.tsx  # 移动端 UI 测试
├── tutorialGuide.test.tsx  # 新手引导测试
├── responsiveNavigation.test.tsx # 响应式导航测试
└── resultReport.test.tsx   # 结果报告测试
```

## 关键设计模式

### 状态管理
- 使用 React useState + useReducer
- 无外部状态管理库（Redux/Zustand）
- 状态提升到 App.tsx

### 持久化
- localStorage 存储
- JSON 序列化/反序列化
- 版本迁移机制（saveSystem.ts）

### 组件通信
- Props 传递
- 回调函数
- Context API（少量使用）

### 随机数
- 自定义 RNG（可复现）
- 种子机制
- 详见 domain/random.ts
