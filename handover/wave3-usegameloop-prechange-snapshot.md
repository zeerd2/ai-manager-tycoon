# Wave 3 — useGameLoop.ts 改动前状态快照

> **创建模型**: GrokBuild  
> **创建日期**: 2026-05-29  
> **当前基线**: 413 tests / 24 files（lint 0 / build passed）  
> **锁定状态**: 已获得 GPT-5.5 CONDITIONAL YES，正式锁定 `src/App.tsx` 和 `src/hooks/useGameLoop.ts`  
> **本快照性质**: 零代码变更的精确现状记录 + 依赖清单 + 执行顺序 + 风险点

---

## 1. 锁定声明（已生效）

根据 GPT-5.5 2026-05-29 审查结论，GrokBuild 现正式独占：

- `src/App.tsx`
- `src/hooks/useGameLoop.ts`（新建）

允许最小必要修改的测试文件：
- `tests/gameLoop.integration.test.ts`
- 必要时 `tests/resultReport.test.tsx`（仅影响 props 时）

其他模型：
- DeepSeek：仅可修改 `handover/*`
- MiMo：暂不碰 App.tsx / hooks

---

## 2. 当前游戏循环核心范围快照

### 2.1 主要函数

**handleRunSprint** (App.tsx:152-172)
- 检查选择完整性（selectedAgentIds, selectedProjectId, selectedStrategyId）
- 创建 RNG（Date.now()）
- 调用 `generateTeamEvent`
- 若有事件：设置 `pendingEvent` + `sprintContext`，暂停执行
- 无事件：直接调用 `executeSprint`

**handleEventResolve** (App.tsx:174-181)
- 清除 pendingEvent
- 从 sprintContext 恢复参数
- 调用 `executeSprint`（带 eventResult）
- 清空 sprintContext

**executeSprint** (App.tsx:183-311) —— 核心编排函数
内部顺序（当前实际执行顺序）：

1. `runSprint(...)` 生成基础 SprintResult
2. RelationsManager 初始化 + 事件结果合并 + 协作乘数应用
3. 判断项目是否本次完成（isProjCompletedNow）
4. `processPostSprint(...)` —— 核心状态更新（资金、疲劳、技能、声望等）
5. 事件额外资金处理
6. 关系更新（完成项目时额外加分）
7. 季度结算判定与写入（isQuarterEnd 时调用 processQuarterSettlement）
8. 新员工解锁（checkUnlocks + UI 通知状态）
9. 成就检查与 toast（checkAchievement + setToastQueue）
10. 本地 UI 状态更新（projectCompleted, projectBonus, newlyUnlockedAgents）
11. lastResult / lastQuarterSettlement 更新
12. setGameState(newState)
13. 清空选中（setSelectedAgentIds(new Set())）

---

## 3. 当前依赖的 State / Setter 清单

### 3.1 游戏核心状态（强烈建议迁移进 hook）

| State | Setter | 当前用途 |
|-------|--------|----------|
| `gameState` | `setGameState` | 主游戏状态 |
| `lastResult` | `setLastResult` | 最近一次 Sprint 结果展示 |
| `lastQuarterSettlement` | `setLastQuarterSettlement` | 最近季度结算结果 |
| `toastQueue` | `setToastQueue` | 成就 toast 队列 |
| `newlyUnlockedAgents` | `setNewlyUnlockedAgents` | 新员工通知 |
| `projectCompleted` | `setProjectCompleted` | 项目完成庆祝 |
| `projectBonus` | `setProjectBonus` | 项目完成奖金展示 |

### 3.2 选择与上下文状态（建议留在 App.tsx 第一版）

| State | Setter | 说明 |
|-------|--------|------|
| `selectedAgentIds` | `setSelectedAgentIds` | 当前选中员工 |
| `selectedProjectId` | `setSelectedProjectId` | 当前选中项目 |
| `selectedStrategyId` | `setSelectedStrategyId` | 当前选中策略 |
| `pendingEvent` | `setPendingEvent` | 待处理团队事件 |
| `sprintContext` | `setSprintContext` | 事件暂停时的上下文 |

### 3.3 其他状态（明确留在 App.tsx）

- currentSlotId, isSaveManagerOpen, isStartup
- autosaveConfig
- activeSkillTreeAgentId, isTutorialOpen
- activeMainSection, activeMobileOverlay
- isOnline

---

## 4. 当前执行顺序（精确快照）

GPT-5.5 特别强调“必须保持执行顺序”，当前实际顺序如下（以 executeSprint 内部为主）：

1. 检查选择是否完整（在 handleRunSprint）
2. 检查并触发 pending team event（generateTeamEvent）
3. runSprint（simulation）
4. RelationsManager 初始化 + 事件结果合并 + 协作乘数
5. processPostSprint（gameEngine 核心）
6. 关系系统更新（完成项目额外加分）
7. 季度结算判定与写入（isQuarterEnd）
8. 新员工解锁处理
9. 成就检查与 toast
10. 项目完成 UI 状态更新
11. setLastResult / setLastQuarterSettlement
12. setGameState
13. 清空选中

**注意**：关系系统更新目前夹在 processPostSprint 之后、季度结算之前。

---

## 5. 当前测试基线

- 全量：**413 passed / 24 files**
- 关键相关测试文件：
  - `tests/gameLoop.integration.test.ts`
  - `tests/gameEngine.test.ts`
  - `tests/quarterSettlement.test.ts`
  - `tests/resultReport.test.tsx`

任何拆分后必须保证这些测试不退化。

---

## 6. 风险点记录（供后续拆分参考）

- RelationsManager 目前与 executeSprint 耦合较紧，GPT-5.5 允许第一版暂缓迁移。
- 大量 setState 调用分散在 executeSprint 末尾，适合通过回调或返回对象方式暴露给 App.tsx。
- 成就上下文构建依赖较多 state，迁移时需仔细抽取。
- RNG 在 handleRunSprint 中创建（Date.now()），需确保 hook 能正确接收或创建。

---

## 7. 初步 Hook 边界思考（非最终设计，仅供参考）

**可能返回的内容（第一版）**：
- `handleRunSprint: () => void`
- `handleEventResolve: (result: TeamEventResult) => void`
- 可能暴露的内部工具函数（视情况）

**可能接收的参数（第一版允许较多）**：
- 当前 gameState
- 选择状态（selectedAgentIds 等）
- 各种 setState callbacks（用于 toast、projectCompleted 等）
- 静态数据（strategies, achievements, incidentTemplates 等）

**原则**：宁可参数多，也保证执行顺序和行为 100% 不变。

---

## 8. GPT-5.5 额外确认请求（若需要）

在正式开始拆分代码前，是否还有以下需要澄清：

1. RelationsManager 是否建议第一轮一并迁移，还是明确留在 App.tsx？
2. 是否需要现在就给出 useGameLoop.ts 的初步函数签名草稿供审查？
3. 对于 setState callbacks 的暴露方式，有无偏好（直接传 setter 还是封装成事件）？

---

**快照结束**

*本文档记录了改动前的精确状态。任何后续代码修改都将以此为基准。*

*GrokBuild 将等待 GPT-5.5 进一步明确指示后，再开始实际的 useGameLoop.ts 抽取工作。*