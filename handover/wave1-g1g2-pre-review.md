# Wave 1 G1+G2 前置审查包（GrokBuild 出品）

> **提交模型**: GrokBuild（最高风险执行者）  
> **提交日期**: 2026-05-29  
> **审查对象**: GPT-5.5  
> **文档性质**: 零代码变更的前置分析 + 风险边界 + 提议方案 + 验收标准  
> **对应计划**: three-agent-rescue-plan.md → Wave 1（P0）

---

## 1. 执行摘要

本轮 Wave 1 包含两个最高优先级（P0）核心风险复核任务：

- **G1**：消除核心 RNG 遗留（`Math.random` 直接使用）
- **G2**：确认季度结算权威来源已收敛（`App.tsx` / `ResultReport.tsx` 不再各自计算）

**当前状态**：基线干净（lint 0 err / build ✓ / 406 tests passed），**尚未锁定任何高风险文件**，本包为纯只读分析。

**请求 GPT-5.5**：审查本包后给出「是否批准进入 Wave 1 执行」的明确结论（YES / CONDITIONAL / NO）。

---

## 2. 基线确认（与 three-agent-rescue-plan 一致）

| 检查项 | 实测结果 | 文档记录 | 一致性 |
|--------|----------|----------|--------|
| `npm run lint` | 0 errors | 0 errors | ✅ |
| `npm run build` | ✓ built in 191ms | 通过 | ✅ |
| `npm test` | 406 passed | 406 passed | ✅ |

**与 handover 文档的唯一历史差异**（已由用户手动修正）：
- `project-status.md` 原记录 383 tests，现已更新为 406/406。

---

## 3. 发现一：RNG 唯一污染点（G1 范围）

### 3.1 静态扫描结果

在整个 `src/` + `tests/` 范围内，**仅存在 1 处直接调用 `Math.random`**：

**文件**: `src/domain/gameEngine.ts:50`

```ts
const randomSkill = rng ? pickRandom(rng, skillKeys) : skillKeys[Math.floor(Math.random() * skillKeys.length)];
```

**上下文**（`processPostSprint` 函数）：
- 当调用方传入 `rng` 参数时 → 使用确定性 `pickRandom(rng, ...)`（正确路径）
- 当调用方**未传入** `rng` 时 → 退化到 `Math.random`（污染路径）

### 3.2 生产调用链路（已安全）

**唯一生产路径**：
- `src/App.tsx:213`
  ```ts
  const newState = processPostSprint(gameState, result, Array.from(selectedAgentIds), rng);
  ```
- `rng` 来源：`executeSprint(..., rng: RNG)` 参数，由上层游戏循环统一创建并向下传递。
- **结论**：生产环境**不会**触发 `Math.random` 分支。

### 3.3 测试调用链路（存在非确定性风险）

以下测试文件直接调用 `processPostSprint` 且**未传第 4 个参数**（共 20+ 处）：

- `tests/gameEngine.test.ts`（多数测试用例）
- `tests/gameLoop.integration.test.ts`（大量集成测试）

**影响**：
- 这些测试在 `processPostSprint` 中执行「技能随机增长」时会使用真正的随机数。
- 导致测试结果在理论上存在微小概率的 flaky（虽然当前 406 次全绿，但不具备可复现性）。
- 违反「相同 seed 行为稳定」这一核心质量要求。

### 3.4 提议修复方案（G1）

**最小侵入方案**（推荐）：
1. 移除 `gameEngine.ts:50` 的 `Math.random` fallback。
2. **强制要求**调用 `processPostSprint` 时必须提供 `rng`（类型层面改为必传）。
3. 批量修复测试调用点，传入确定性 RNG（使用固定 seed 或测试专用的 seeded RNG）。
4. 补充/强化 RNG 确定性回归测试（`tests/random.test.ts` + `tests/gameEngine.test.ts` 中新增带 seed 的用例）。

**验收标准（G1）**：
- [ ] `grep -r "Math\.random" src/ tests/` 结果为空（或仅出现在 `random.ts` 内部实现中）
- [ ] 所有调用 `processPostSprint` 的测试均传入确定性 `rng`
- [ ] 新增至少 1 个「相同 seed 下技能增长路径可复现」的单元测试
- [ ] `npm test` 全绿，且在至少 3 次重复运行中无 flaky

**禁止事项**：
- 不得为通过测试而修改业务数值逻辑（技能增长公式等）
- 不得删除现有测试

---

## 4. 发现二：季度结算双轨制（G2 范围）

### 4.1 当前架构图（权威来源分布）

```
┌─────────────────────────────────────────────────────────────┐
│  旧轨（残留硬编码逻辑）                                      │
│  gameEngine.ts:126-168                                       │
│    - 每 4 个 sprint 硬编码判断 KPI                          │
│    - 写入 SprintResult.quarterKpiResult                     │
│    - 逻辑：完成项目数 + 资金/声望/信心阈值（按季度写死）    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  新轨（推荐权威体系）                                        │
│  quarterSettlement.ts → processQuarterSettlement            │
│    - 调用 quarterlyTarget.ts 的 generateQuarterTarget      │
│    - 调用 evaluateQuarterTarget                             │
│    - 同时处理融资检查点（financing.ts）                     │
│    - 返回 QuarterSettlementResult                           │
│    - 写入 GameState.quarterlyEvaluations                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                    App.tsx:238 调用新轨
                    ResultReport.tsx 仅展示（不计算）
```

### 4.2 具体证据

**旧轨残留位置**：
- `src/domain/gameEngine.ts:126-168`（`processPostSprint` 内）
  - 针对 `endingQuarter === 1/2/3/4/5+` 写死的完成项目数、资金、声望、信心阈值
  - 直接在 `updatedResult.quarterKpiResult` 上赋值

**新轨唯一入口**：
- `src/domain/quarterSettlement.ts:16-38`
  - `processQuarterSettlement(state, reputationScore)`
  - 内部正确调用 `quarterlyTarget.ts` + `financing.ts`

**调用关系**：
- `src/App.tsx:238`
  ```ts
  quarterSettlement = processQuarterSettlement(newState, newReputationScore);
  newState.quarterlyEvaluations = [... , quarterSettlement.targetEvaluation];
  ```
- `src/components/ResultReport.tsx:214-224` 同时渲染 `result.quarterKpiResult`（旧轨）
- `src/components/ResultReport.tsx:340+` 区域渲染新轨内容（基于 `quarterSettlement` prop）

### 4.3 风险分析

**不一致风险**：
- 同一季度可能出现「旧轨 KPI 达标」但「新轨目标未达成」的情况（或反之）。
- UI 同时展示两套结果，玩家困惑。
- 未来维护者不知道应该信任哪一套逻辑。

**当前状态**：
- 权威计算**已部分收敛**到 `quarterSettlement.ts`（正确方向）。
- 但 `gameEngine.ts` 内的旧硬编码逻辑**尚未清理**，仍会在每个季度末执行并污染 `SprintResult`。
- ResultReport 仍在消费旧字段，导致「展示层」也残留双轨痕迹。

### 4.4 提议修复方案（G2）

**最小侵入 + 行为保持方案**（推荐）：

1. **保留 `gameEngine.ts` 中的季度 KPI 硬编码块**（本轮 Wave 1 不删除）。
2. **关键确认点**：确保 `App.tsx` 在季度末**只调用 `processQuarterSettlement`** 并将其结果写入状态，不再有其他并行计算路径。
3. **展示层收敛**（可选本轮或延后）：
   - ResultReport 优先使用新传入的 `quarterSettlement` prop 展示目标达成情况。
   - 旧的 `result.quarterKpiResult` 字段可标记为 deprecated，逐步迁移。
4. **文档化**：在代码或 handover 中明确「季度结算权威来源为 `quarterSettlement.ts`」。

**验收标准（G2）**：
- [ ] `App.tsx` 中季度末结算仅调用 `processQuarterSettlement` 一处（已确认）
- [ ] `ResultReport.tsx` 接收 `quarterSettlement` prop 并主要基于它渲染（旧 `quarterKpiResult` 可并存但不作为权威）
- [ ] 无证据显示 `ResultReport.tsx` 或其他 UI 组件**独立计算**季度目标结果
- [ ] 运行游戏至少 2 个完整季度，人工确认 UI 展示的季度结果与 `quarterlyEvaluations` 数组内容一致

**禁止事项**：
- 本轮 Wave 1 不要求删除 `gameEngine.ts` 内的旧 KPI 逻辑（避免引入行为变化）
- 不改动存档格式

---

## 5. 综合风险清单（供 GPT-5.5 判断）

| 风险 ID | 描述 | 严重程度 | 波及面 | 提议处理 |
|---------|------|----------|--------|----------|
| RNG-01 | 测试中未传 rng 导致技能增长非确定性 | 中 | 测试稳定性 | G1 修复 |
| RNG-02 | 未来若生产路径某处漏传 rng，将引入真随机 | 低（当前已防） | 游戏可复现性 | 类型强制 + 文档 |
| QTR-01 | gameEngine 内残留旧 KPI 逻辑，与新体系并存 | 中 | 可维护性 | G2 确认权威 + 逐步迁移 |
| QTR-02 | ResultReport 同时渲染新旧两套结果 | 低 | 玩家体验 | 展示层收敛（可延后 Wave 1） |
| QTR-03 | 季度结算写入状态的时机与 UI 消费时机不一致 | 低（当前观察未触发） | 状态同步 bug | 集成测试覆盖 |

---

## 6. 执行计划（若获批准）

**执行顺序**（严格串行，GrokBuild 独占锁定期间）：

1. **G1 先执行**（先锁定 `gameEngine.ts`）
   - 移除 Math.random fallback
   - 修复测试调用点
   - 新增 RNG 确定性测试
   - 交付 G1 完成报告（标准格式）

2. **G2 后执行**（在 G1 基础上继续）
   - 确认 App.tsx 季度结算路径唯一性
   - 审查 ResultReport 消费逻辑
   - 可能的小幅展示层调整（不改变计算）
   - 交付 G2 完成报告

**预计对行为的影响**：
- G1：修复后，带 rng 的测试将变为确定性；不带 rng 的测试将被修正。
- G2：**本轮不改变任何季度结算的数值结果**，仅确认权威来源并清理展示歧义。

---

## 7. GPT-5.5 审查请求清单

请 GPT-5.5 明确回答以下问题（可直接回复本节编号）：

1. **进入许可**  
   是否批准 GrokBuild 立即锁定 `src/domain/gameEngine.ts` 并开始 Wave 1 G1 执行？（YES / CONDITIONAL / NO）

2. **RNG 验收标准**  
   文中提出的 G1 验收标准（4 条）是否充分？是否需要增加「至少 N 次重复运行全绿」或「跨平台一致性」要求？

3. **季度结算边界**  
   G2 方案中「本轮保留 gameEngine 旧 KPI 逻辑，仅确认权威来源」是否可接受？还是要求本轮必须清理旧逻辑？

4. **展示层收敛**  
   ResultReport 同时展示新旧两套结果是否必须在本轮 Wave 1 解决？还是可标记为技术债延后？

5. **其他阻塞问题**  
   除上述外，是否还有其他必须在 G1/G2 执行前解决的阻塞项？

---

## 8. 零代码变更声明

截至本文档提交时刻（2026-05-29）：

- GrokBuild **未修改** 任何源代码文件
- GrokBuild **未修改** 任何测试文件
- GrokBuild **未修改** 任何文档（除本审查包及之前的 grokbuild-handover.md）
- 所有分析均基于只读读取 + 命令行验证

**下一步行动将严格等待 GPT-5.5 批准后执行**。

---

## 附录 A：关键文件引用索引（便于 GPT-5.5 快速定位）

| 主题 | 文件:行号 | 说明 |
|------|-----------|------|
| RNG fallback | `src/domain/gameEngine.ts:50` | 唯一 Math.random |
| 生产 RNG 注入 | `src/App.tsx:213` | processPostSprint(..., rng) |
| 旧 KPI 硬编码 | `src/domain/gameEngine.ts:126-168` | quarterKpiResult |
| 新结算入口 | `src/domain/quarterSettlement.ts:16` | processQuarterSettlement |
| 新结算调用 | `src/App.tsx:238` | 季度末唯一调用 |
| 新结算类型 | `src/domain/quarterlyTarget.ts:18-23` | QuarterEvaluation |
| UI 同时渲染 | `src/components/ResultReport.tsx:214` | quarterKpiResult |
| UI 新轨消费 | `src/components/ResultReport.tsx:17,187` | quarterSettlement prop |

---

**文档结束**

*本审查包为 GPT-5.5 提供完整上下文，以便在不阅读全部代码的情况下做出批准决策。*

*GrokBuild 承诺：获得明确 YES/CONDITIONAL 后，将按本包描述的范围与标准执行，并以标准完成报告格式交付每阶段结果供后续审查。*
