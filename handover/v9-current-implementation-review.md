# v9 当前实现审计报告

> **审计模型**: Claude 4.8 Opus
> **审计日期**: 2026-05-31
> **审计类型**: 只读审计（不改 src / 不改 tests / 不改既有 handover 文件）
> **审查对象**: GPT-5.5
> **对应任务**: handover/claude-4-8-opus-onboarding.md 第 6 节首个任务

---

## 结论

**CONDITIONAL PASS**

当前 v9 恢复实施在质量基线上是绿色且结构干净的：lint/build/test 全部通过、未污染 App.tsx / saveSystem.ts、achievement 测试已实质恢复、playerStats 是一个类型安全的纯函数。

但发现 **1 个生产侧真实缺陷**（`efficient_project` 的成本闸门在实际游戏循环中失效，且被单测掩盖），以及若干非阻塞问题。该缺陷不会导致崩溃、不破坏基线，因此**不阻塞 domain checkpoint**，但必须作为已追踪的后续修复项记录在案，不能当作"已正确实现"收口。

---

## 我亲自核验的事实（非转引报告）

以下数据由本次审计实际执行命令得到，而非引用 GrokBuild 自述报告：

```text
npm test                              → 415 passed / 25 files
npx vitest run tests/achievement.test → 78 passed / 1 file
npm run lint                          → 0 errors
npm run build                         → built in 163ms (71 modules)
```

- 成就总数：**21 个**（8 原始 + 8 第一批 + 5 个 v9 G-2A）
- 5 个 v9 成就的 `checkAchievement` 分支均真实实现，且在 `useGameLoop.ts:193-195` 被实际调用——**不是死成就**。
- `playerStats.calculatePlayerStats` 读取的所有字段（`SprintResult.progressDelta/bugsDelta/techDebtDelta/moraleDelta/cost`、`Agent.skills/morale/totalSprintsWorked`、`GameState.history/completedProjectIds/unlockedAchievementIds`）均与当前类型定义一致，无字段漂移。

> ⚠️ 与入职文档基线的差异：文档记录基线为 `414 passed / 24 files`，当前为 `415 passed / 25 files`。多出的 1 个测试文件应为 MiMo 新增的 `tests/playerStats.test.ts`。此差异属预期，非异常。

---

## 发现的问题

### 🔴 阻塞 / 半阻塞问题（需 GPT-5.5 决策是否在 checkpoint 前修）

#### P1. `efficient_project` 成本闸门在生产中失效，且被单测掩盖（生产/测试分叉）

这是本次审计最重要的发现，正是入职文档反复警告的"mock/prod 分叉"类事故。

**实现侧**（`src/domain/achievement.ts:145-146`）：
```ts
case 'efficient_project':
  return context.history.some(h => h.progressDelta >= 65 && (h.cost ?? 0) <= 350);
```
该判定同时依赖 `h.progressDelta` 和 `h.cost`。

**生产接线侧**（`src/hooks/useGameLoop.ts:183-186`）构建 context 时：
```ts
history: newState.history.map(h => ({
  bugsDelta: h.bugsDelta,
  progressDelta: h.progressDelta,
  // ❌ cost 没有被映射进去
})),
```

后果：在真实游戏循环中，`h.cost` 永远是 `undefined`，`(h.cost ?? 0)` 恒为 `0`，于是 `0 <= 350` 恒真——**成本闸门完全失效**。任何一个 `progressDelta >= 65` 的 sprint 都会解锁"高效执行者"，无视成本。这违背了该成就"高进度且低成本"的设计意图。

**为什么单测没抓到**（`tests/achievement.test.ts:419-433`）：单测直接给 `makeContext` 传入了带 `cost` 的 history（`{ bugsDelta: 0, progressDelta: 70, cost: 300 }`），绕过了真实接线路径。单测覆盖的是 `checkAchievement` 纯函数本身，而**没有任何测试覆盖 `useGameLoop` 里 context 的构建正确性**。因此 78 passed 是真实的，但它无法保证生产行为正确。

**影响范围**：`efficient_project` 是唯一依赖 `h.cost` 的成就，所以只影响这一个成就，不扩散。不崩溃、不破坏基线。

**修复方向**（供参考，本次只读不改）：在 `useGameLoop.ts:183` 的 map 中补 `cost: h.cost`，并补一个针对 context 构建的回归测试。注意 `AchievementContext.history[].cost` 类型已是 `cost?: number`，加字段无需改类型。

> ⚠️ 注意：`useGameLoop.ts` 在入职文档第 3.1 节属于**需预审的锁定文件**。该修复必须走预审流程，不可直接改。

---

### 🟡 非阻塞问题（建议跟踪，不阻塞 checkpoint）

#### P2. achievement 测试从 88 恢复到 78，存在 10 个测试的缺口

GrokBuild 恢复报告已诚实声明这一点（78 < 原始 88）。当前 78 个测试覆盖了全部 16 原始成就 + 5 新成就的正反例，核心行为无遗漏。缺口主要是边界场景的密度，不是覆盖盲区。**可接受，但建议后续由 DeepSeek 补齐到 ≥88。**

#### P3. 无人测试"context 构建层"，P1 才得以潜伏

根因不只是漏了一个 `cost` 字段，而是整个项目**缺少对 `useGameLoop` 中 `achievementContext` 构建逻辑的测试**。成就逻辑（纯函数）和成就接线（context 组装）之间没有契约测试。建议补一类测试：用真实 `runSprint` 输出喂 context，断言关键成就能在端到端路径上解锁。

#### P4. `getAchievementProgress` 缺 3 个新成就的进度分支

`achievement.ts` 的进度函数实现了 `long_run_survivor`、`fast_unlock`、`stable_team`，但**漏了 `efficient_project` 和 `bug_survivor_streak`**（落入 `default → return null`）。这两个成就在 UI 进度条上会无进度显示。非阻塞，但若 PlayerDashboard/成就面板要显示进度，需补齐。

#### P5. playerStats 的 `disasterSprintCount` 语义偏窄

`playerStats.ts:64` 用 `progressDelta === 0` 定义"灾难 sprint"。但 `simulation.ts:78` 中 `progressDelta = Math.max(0, ...)` 已对负值截断为 0，所以语义上 `=== 0` 是对的（不会有负数）。**此项无 bug，仅提示：该定义与 0 截断逻辑强耦合，若未来 simulation 放开负值，这里需同步更新。** 记录以备将来。
