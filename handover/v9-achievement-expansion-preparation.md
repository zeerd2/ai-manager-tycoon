# v9 成就系统扩展 预审文档（G-2A）

> **执行模型**: GrokBuild  
> **创建日期**: 2026-05-29  
> **任务**: G-2A — 成就系统扩展预审  
> **审查对象**: GPT-5.5  
> **当前基线**: 414 tests / lint 0 errors / build passed

---

## 1. 执行背景

根据 GPT-5.5 在 R4-1 通过后的指示：

- 优先做**只消费现有数据**的 v9 功能
- 暂不进行存档格式扩展（V9-6 放到最后）
- 成就系统扩展（V9-5）被列为推荐的第一个 v9 恢复功能

本任务要求在不改动存档格式的前提下，评估是否可以安全扩展成就系统。

**当前禁止修改**（除非本预审通过）：
- `src/domain/achievement.ts`
- `src/data/achievements.ts`
- `src/domain/gameEngine.ts`

---

## 2. 当前成就系统结构快照

### 2.1 核心模块

| 文件 | 职责 | 当前规模 |
|------|------|----------|
| `src/domain/achievement.ts` | 定义 `Achievement`、`AchievementContext`、 `checkAchievement()`、`getAchievementProgress()` | ~298 行 |
| `src/data/achievements.ts` | 成就数据定义（16 个成就） | ~150 行 |
| `src/hooks/useGameLoop.ts` | 每轮 Sprint 结束后构建上下文并调用检查 | 成就检查位于 executeSprint 内（第 167-205 行） |

### 2.2 AchievementContext 当前结构

```ts
interface AchievementContext {
  completedProjectIds: string[];
  currentSprintBugs?: number;
  fundsRemaining: number;
  totalFundsSpent: number;
  agents: Array<{ morale, locked, salary, consecutiveSprints, skills, ... }>;
  sprintCount: number;
  projectsInOneGame: number;
  history: Array<{ bugsDelta, progressDelta, cost? }>;
  cheapestAgentOnly?: boolean;
}
```

**注意**：该上下文目前**不包含** v9 字段（teamDynamics / performanceHistory / strategyPreferences）。这些字段只存在于 SaveData 层。

### 2.3 检查调用位置

成就检查目前完全集中在 `useGameLoop.ts` 的 `executeSprint` 函数中，每轮 Sprint 结束后执行一次。

`gameEngine.ts` 中仅保留初始化时的空数组，不再负责成就逻辑。

---

## 3. 可新增成就分析（不改存档格式）

### 3.1 当前可直接支持的新成就类型（低风险）

基于现有 `AchievementContext` 和 GameState，已可支持以下方向的新成就，而**无需新增持久化字段**：

| 建议新增成就方向 | 可能 conditionType | 所需上下文字段 | 是否需改 AchievementContext | 风险 |
|------------------|--------------------|----------------|-----------------------------|------|
| 连续高 Bug 承受 | `consecutive_high_bug_sprints` | history | 否 | 低 |
| 快速资金回血 | `funds_recovery_after_low` | fundsRemaining + history | 否 | 低 |
| 特定技能组合 | `specific_skill_combo` | agents.skills | 否 | 低 |
| 长期经营（Sprint 数） | `long_run_survivor` | sprintCount | 否 | 低 |
| 低成本高回报 | `efficient_project` | history + completed | 否 | 低 |
| 团队稳定性 | `no_morale_crash_in_n_sprints` | agents.morale + history | 否 | 低 |
| 解锁速度 | `fast_unlock_rate` | sprintCount + unlocked agents | 否 | 低 |

**结论**：至少可以新增 **6~10 个** 合理的新成就，且完全基于现有数据。

### 3.2 需要少量扩展 AchievementContext 的成就（中风险）

如果想支持更复杂的条件，可能需要少量扩展上下文（但仍不改存档格式）：

- 当前轮次使用的 strategy（需要把 strategy 信息传进来）
- 本局是否触发过特定类型事件（需要 relations/events 配合）
- 累计使用某策略次数（可能需要轻微 state 记录）

**建议**：第一批 v9 成就扩展**暂不**包含这类需求，优先做纯只读型。

---

## 4. 涉及文件影响分析

| 文件 | 是否需要修改 | 修改性质 | 备注 |
|------|--------------|----------|------|
| `src/domain/achievement.ts` | 是（新增 conditionType 分支 + 可能扩展 getAchievementProgress） | 功能扩展 | 核心逻辑 |
| `src/data/achievements.ts` | 是（新增成就定义） | 数据扩展 | 最安全 |
| `src/hooks/useGameLoop.ts` | 可能（如果需扩展 context） | 轻微 | 当前上下文已较丰富 |
| `src/domain/gameEngine.ts` | 否 | - | 已无成就逻辑 |
| `src/App.tsx` | 否 | - | 成就展示通过 AchievementPanel |
| `src/domain/saveSystem.ts` / `saveMigration.ts` | 否 | - | 不新增字段 |

**关键发现**：本次扩展**可以完全不触碰** saveSystem / saveMigration / gameEngine，符合“先消费已有数据”的策略。

---

## 5. 测试计划

### 5.1 必须覆盖的测试

- 新增成就的 `checkAchievement` 单元测试（在 `tests/achievement.test.ts` 或直接扩展现有测试）
- 对应 `getAchievementProgress` 的进度计算测试
- 集成测试：通过 `loadFromSlot` + 模拟多轮 Sprint，验证新成就能正常解锁并持久化（使用现有 unlockedAchievementIds）
- 边界测试：已有成就不受影响

### 5.2 验收基线

- `npm test -- achievement` 全绿
- 全量测试保持在 **414+**（新增测试后可增加）
- lint 0 errors

---

## 6. 文件锁定申请

**正式申请 GrokBuild 锁定以下文件（G-2A 阶段）**：

| 文件 | 锁定级别 | 理由 |
|------|----------|------|
| `src/domain/achievement.ts` | 独占 | 成就核心逻辑 |
| `src/data/achievements.ts` | 独占 | 成就数据定义 |
| `tests/achievement.test.ts`（若存在）或相关测试文件 | 最小必要修改权 | 需要新增测试 |

**暂不申请修改**：
- `src/hooks/useGameLoop.ts`（除非后续发现必须扩展 context）
- 任何 saveSystem 相关文件

其他模型在 G-2A 期间禁止修改上述锁定文件。

---

## 7. 风险与缓解

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| 新成就条件过于复杂，导致 checkAchievement 膨胀 | 中 | 第一批控制在 6~8 个，保持 switch 清晰 |
| 进度函数与检查逻辑不一致 | 中 | 同步更新 getAchievementProgress |
| 未来 v9 UI 需要更多上下文而被迫改存档 | 低 | 本阶段明确只做“当前上下文可支持”的成就 |
| 测试覆盖不足导致静默回归 | 中 | 要求新增测试必须覆盖新 conditionType |

---

## 8. GPT-5.5 审查问题

请 GPT-5.5 明确以下事项：

1. **范围确认**  
   是否同意本次 G-2A 仅新增“基于当前 AchievementContext 即可判断”的成就，不扩展上下文、不碰存档？

2. **新增数量建议**  
   第一批 v9 成就建议新增多少个比较合适？（建议 6~8 个作为起步）

3. **是否允许轻微扩展 AchievementContext**  
   如果某些合理成就需要把当前 `strategyId` 或 `recentEvents` 加入上下文，是否接受？（仍不改存档）

4. **文件锁批准**  
   是否批准锁定 `src/domain/achievement.ts` 和 `src/data/achievements.ts`？

5. **后续流程**  
   本预审通过后，是否直接进入实际新增成就的实施阶段，还是需要再提交一次 prechange snapshot？

6. **测试文件**  
   当前是否有独立的 `achievement.test.ts`？如果没有，新增测试应放在哪个文件？

---

## 9. 后续计划

获得 GPT-5.5 批准后，GrokBuild 将依次产出：

- `v9-achievement-expansion-prechange-snapshot.md`（当前成就系统精确状态）
- 分阶段实施（先加 3~4 个，再加剩余）
- 每阶段完成报告

---

**文档结束**

*本预审文档仅用于架构确认与边界划定，不包含任何代码变更。*