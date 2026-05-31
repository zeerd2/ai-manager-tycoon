# WS-103 E2E / 集成测试预审 — 准备报告（G-3A）

> **执行模型**: GrokBuild  
> **日期**: 2026-05-31  
> **任务**: G-3A WS-103 测试补强前置分析  
> **审查对象**: GPT-5.5

---

## 1. 当前测试框架能不能做真正 E2E？

**结论**：**不能做真正意义上的浏览器 E2E**。

### 当前测试栈分析
- 测试框架：**Vitest 4.1.7**（纯 Node.js 环境）
- 渲染方式：`react-dom/server` 的 `renderToStaticMarkup`（仅服务端渲染静态 HTML，无 DOM 事件、无真实浏览器）
- 依赖：无 Playwright、Cypress、Puppeteer、@testing-library/react 等浏览器/组件测试库
- 环境：无 jsdom 配置（或未显式启用），部分测试使用 `renderToStaticMarkup` 规避真实 DOM

### 能力边界
- 可以做**组件快照/结构测试**（如 PlayerDashboard 渲染内容）
- 可以做**领域逻辑集成测试**（通过公开 API 驱动 gameEngine → checkUnlocks → 成就解锁）
- **无法**模拟真实用户点击、React 生命周期、localStorage 持久化在浏览器中的行为、路由、真实事件循环

**风险**：如果强行声称“已有 E2E”，会误导后续测试策略。

---

## 2. 如果没有浏览器 E2E，就用 integration test 替代

**推荐策略**：采用 **黑盒 Integration Test** 作为 E2E 的有效替代。

### 现有良好实践（可复用）
- `tests/saveApi.integration.test.ts`：通过 `saveToSlot` / `loadFromSlot` 公开 API 做完整存取生命周期测试（已 stub localStorage）
- `tests/gameLoop.integration.test.ts`：驱动 `processPostSprint` + `checkUnlocks` 验证端到端游戏循环

### 建议的 Integration Test 分层
| 层级 | 测试文件建议 | 可验证内容 | 模拟程度 |
|------|-------------|-----------|---------|
| 领域集成 | `achievement-unlock.integration.test.ts` | 完整 Sprint → 成就解锁 → `unlockedAchievementIds` 更新 | 极高（纯逻辑） |
| 存档集成 | `save-achievement-persistence.test.ts`（或扩展 saveApi） | 保存后 load，unlockedAchievementIds 是否保留 | 高（stub localStorage） |
| 组件集成 | 扩展 `playerDashboard.test.tsx` | 传入带 `unlockedAchievementIds` + `playerStats` 的 state，验证渲染 | 中（静态渲染） |

**优势**：
- 不需要浏览器即可获得“端到端”信心
- 与现有测试风格一致
- 可在 CI 中快速运行

---

## 3. 成就解锁端到端路径怎么测？

**核心路径**（从用户视角）：
1. 玩家进行若干 Sprint
2. 满足 v9 成就条件（如 `efficient_project`、`long_run_survivor` 等）
3. `checkUnlocks` / `processPostSprint` 后，`unlockedAchievementIds` 被正确追加
4. 成就出现在 UI（PlayerDashboard / AchievementPanel）

### 推荐测试方案（Integration）
- 新建或扩展测试文件，使用 `createInitialGameState` + 循环调用 `processPostSprint`
- 直接断言 `gameState.unlockedAchievementIds` 包含新成就 ID
- 同时验证 `getAchievementProgress` 返回合理进度

**优先覆盖场景**（见第 6 节）。

**禁止**：直接修改 `saveSystem.ts` 或 `saveMigration.ts` 来“方便测试”。

---

## 4. 存档迁移 + 新成就持久化怎么测？

**当前现状**：
- `unlockedAchievementIds` 已在 `GameState` 中存在（从早期版本就支持）
- `saveApi.integration.test.ts` 已有对 `unlockedAchievementIds` 的保存/加载测试

### 建议测试策略
1. **不改 saveSystem / saveMigration** 的前提下：
   - 使用公开 API `saveToSlot` + `loadFromSlot`
   - 构造包含新 v9 成就 ID 的 state（如 `['long-run-survivor', 'efficient-project']`）
   - 保存 → 清空内存 state → 重新 load
   - 断言 `unlockedAchievementIds` 完整保留

2. **迁移相关**（如果未来有 v8→v9 迁移）：
   - 仅在 `saveApi.integration.test.ts` 或新建的持久化测试中验证“老存档加载后新字段存在且不丢失”
   - **严禁**在本次任务中修改 `saveMigration.ts`

---

## 5. PlayerDashboard 渲染路径怎么测？

**当前状态**：
- 已存在 `tests/playerDashboard.test.tsx`
- 使用 `renderToStaticMarkup` 做静态渲染检查
- 已覆盖：成就解锁数量、基础统计、折叠/展开等

### 建议扩展方向（G-3A 期间）
- 新增测试用例验证：
  - 传入 `playerStats` 数据时是否正确显示（需确认 PlayerDashboard 是否已消费该 prop）
  - 传入多个 v9 成就 ID 时，成就率或列表是否正确
  - 边界：`unlockedAchievementIds` 为空 / 极多时渲染是否稳定

**注意**：由于是静态渲染，无法测试真实交互（如点击切换），只能验证输出 HTML 包含关键文本/数据。

---

## 6. 预计新增测试文件

建议新增/扩展以下测试文件（按优先级排序）：

| 优先级 | 文件名建议 | 主要覆盖内容 | 类型 |
|--------|-----------|-------------|------|
| P1 | `tests/achievement-unlock.integration.test.ts`（新建） | 完整 Sprint 流程解锁 v9 成就（含 efficient_project 高成本不误解锁） | Integration |
| P1 | 扩展 `tests/saveApi.integration.test.ts` | 保存后 load 仍保留 `unlockedAchievementIds`（含新 v9 成就） | Integration |
| P2 | 扩展 `tests/playerDashboard.test.tsx` | 渲染包含 `playerStats` + 新成就的 state | Component |
| P2 | `tests/playerStats-dashboard.integration.test.ts`（可选） | playerStats 计算结果正确流入 Dashboard 渲染 | Integration |

**预计新增测试数量**：8~15 个（视覆盖深度而定），全部使用 Vitest + 现有公开 API。

---

## 建议优先测试场景（必须覆盖）

按用户明确要求，以下 4 个场景必须在 G-3A 实施中得到测试：

1. **完整 sprint 后解锁新 v9 成就**
   - 示例：连续进行足够 Sprint 后 `long_run_survivor` 解锁
   - 示例：完成一次高进度低成本项目后 `efficient_project` 解锁

2. **保存后 load 仍保留 unlockedAchievementIds**
   - 包含至少一个 v9 成就 ID 的场景

3. **PlayerDashboard 显示 playerStats 数据**
   - 验证渲染路径打通（非仅成就列表）

4. **efficient_project 高成本不误解锁**
   - 关键反例：progressDelta ≥ 65 但 cost > 350 时不应解锁
   - 防止逻辑回归

---

## 总结与风险

- **真实 E2E 能力为 0**，必须老实使用 Integration Test 替代。
- 现有测试基础设施（Vitest + 公开 API + 存档 stub + 静态组件渲染）已足够支撑 WS-103 目标。
- **最大约束**：本次任务期间**严禁修改** `saveSystem.ts`、`saveMigration.ts`、`App.tsx`。
- 所有测试必须通过**公开 API** 和**构造 GameState** 的方式驱动。

---

**下一步行动建议**：
1. GPT-5.5 确认本准备报告后，授权进入 G-3A 实施阶段。
2. 实施时优先新建 `achievement-unlock.integration.test.ts`，覆盖 4 个优先场景。
3. 所有新增测试必须通过 `npm test` 全量验证。

**报告结束**