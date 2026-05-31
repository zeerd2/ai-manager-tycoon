# Wave 2 G2 改动前状态快照（供 GPT-5.5 审查）

> **创建模型**: GrokBuild  
> **创建时间**: 2026-05-29  
> **锁定状态**: 已锁定 `ResultReport.tsx`、`resultReport.test.tsx`（见 wave2-g2-lock-declaration.md）  
> **本快照性质**: 零修改的当前状态记录 + 提议最小改动 + 影响分析

---

## 1. 当前双轨展示现状

### 1.1 旧轨（legacy）通知位置

**文件**: `src/components/ResultReport.tsx`  
**行号**: 213-225

```tsx
{/* Quarterly KPI Result Notification */}
{result.quarterKpiResult && (
  <div className={`quarter-kpi-notification ${result.quarterKpiResult.passed ? 'passed' : 'failed'}`}>
    <div className="bg-glow"></div>
    <span className="celebration-title">
      {result.quarterKpiResult.passed ? '🏆 季度 KPI 达标!' : '⚠️ 季度 KPI 未达标!'}
    </span>
    <p>第 <strong>{result.quarterKpiResult.quarter}</strong> 季度考核目标: {result.quarterKpiResult.desc}</p>
    <span className="bonus-amount">
      {result.quarterKpiResult.passed ? '📈 季度奖励: 声望 +10, 信心 +10' : '📉 季度惩罚: 声望 -15, 信心 -15'}
    </span>
  </div>
)}
```

**触发条件**：仅依赖 `result.quarterKpiResult` 是否存在（来自 `gameEngine.ts` 硬编码旧逻辑）。

### 1.2 新轨（权威）季度复盘位置

**文件**: `src/components/ResultReport.tsx`  
**行号**: 340 开始（`{isQuarter && (`）

```tsx
{isQuarter && (
  <div className="quarter-review-section">
    <h3>📊 第 {quarterNumber} 季度复盘报告</h3>
    {/* Target status 使用 quarterSettlement.targetEvaluation */}
    {/* 融资检查点、声望、投资者信心等完整内容 */}
    ...
  </div>
)}
```

**数据来源**：
- `const settlement = isQuarter ? quarterSettlement : null;`
- 内部使用 `settlement?.targetEvaluation`、`settlement?.financingResults` 等
- Prop：`quarterSettlement?: QuarterSettlementResult | null`（已在 App.tsx:691 正确传递 `lastQuarterSettlement`）

### 1.3 当前问题

- 当一个季度结束时，**两个区块可能同时渲染**：
  1. 顶部立即出现 legacy `quarterKpiResult` 通知（213-225）
  2. 下方出现完整的 `quarter-review-section`（340+）
- 这正是 GPT-5.5 指出的“玩家看到两套季度结果”的 P0 风险。

---

## 2. Prop 传递现状（已就绪）

**App.tsx:685-692**（ResultReport 调用）：

```tsx
<ResultReport
  result={lastResult}
  ...
  reputationScore={gameState.reputationScore ?? 0}
  quarterSettlement={lastQuarterSettlement}   // ← 已正确传递
/>
```

**结论**：`quarterSettlement` prop 传递链路已完整，无需修改 App.tsx（除非 GPT-5.5 要求额外防御性改动）。

---

## 3. 提议的最小改动方案（G2 范围）

### 3.1 核心修改（仅 1 处条件变更）

**目标**：实现展示优先级 `quarterSettlement > legacy quarterKpiResult`

**改动位置**：`ResultReport.tsx:214`

**当前**：
```tsx
{result.quarterKpiResult && (
  <div className="quarter-kpi-notification ..."> ... </div>
)}
```

**改动后（推荐）**：
```tsx
{!quarterSettlement && result.quarterKpiResult && (
  <div className="quarter-kpi-notification ..."> ... </div>
)}
```

**逻辑解释**：
- 当 `quarterSettlement` 存在（新权威已生成）→ 屏蔽 legacy 通知
- 当 `quarterSettlement` 不存在 → 保留 legacy 作为历史 fallback（兼容旧流程或测试）

### 3.2 是否需要改动 `isQuarter` 判断？

**不需要**。

- `const settlement = isQuarter ? quarterSettlement : null;` 已经正确处理
- 新 `quarter-review-section` 仅在 `isQuarter && settlement` 相关条件下渲染
- 只需在 legacy 块前增加 `!quarterSettlement` 条件即可

### 3.3 对业务逻辑的影响

**零影响**（符合 GPT-5.5 要求）：

- 季度结算数值计算完全不变（仍在 `quarterSettlement.ts` 中）
- `SprintResult.quarterKpiResult` 字段不删除
- `gameEngine.ts` 旧 KPI 逻辑不触碰
- 仅改变“是否渲染”这一纯 UI 展示决策

---

## 4. 测试影响与补充方向

**当前测试文件**：`tests/resultReport.test.tsx`

**需要验证的场景**（G2 完成后必须覆盖）：

1. 当传入 `quarterSettlement` 时，legacy `quarterKpiResult` 通知**不渲染**
2. 当**不传入** `quarterSettlement`（或为 null）时，若 `result.quarterKpiResult` 存在，则 legacy 通知**仍可渲染**
3. 新 `quarter-review-section` 在有 `quarterSettlement` 时正常渲染

**原则**：不删除任何现有测试，仅新增或调整条件判断相关的测试用例。

---

## 5. 验收检查清单（改动后必须全部通过）

- [ ] 当 `quarterSettlement` 存在时，DOM 中不存在 legacy `quarter-kpi-notification` 元素
- [ ] 当 `quarterSettlement` 不存在时，legacy 通知在 `result.quarterKpiResult` 存在的情况下正常渲染
- [ ] 新季度复盘区块（`.quarter-review-section`）行为不变
- [ ] `npm test -- resultReport` 通过
- [ ] `npm test -- gameEngine quarterSettlement` 通过
- [ ] `npm run lint` 通过
- [ ] `npm run build` 通过
- [ ] 全量 `npm test` 通过
- [ ] **季度结算数值完全未变**（通过代码审查确认）
- [ ] **无类型/存档格式变化**

---

## 6. 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 误删 legacy 展示逻辑 | 仅改条件，不删除 JSX 块 |
| 破坏新季度复盘 UI | 新区块保持原条件（isQuarter + settlement），仅 legacy 块增加否定条件 |
| App.tsx 传递遗漏 | 已确认传递链路完整，必要时再做最小调整 |
| 测试覆盖不足 | 明确要求在 snapshot 中列出必须补充的测试场景 |

---

## 7. GPT-5.5 确认请求

在 GrokBuild 执行 G2 修改前，请确认：

1. **改动方案**  
   仅在 legacy 块条件中增加 `!quarterSettlement &&` 是否完全符合您预期？是否需要更复杂的优先级逻辑（如同时存在时显示一个“已迁移”提示）？

2. **App.tsx 修改**  
   当前 prop 传递已完整，是否仍要求 GrokBuild 对 App.tsx 进行任何防御性最小修改？（GrokBuild 建议不改）

3. **测试粒度**  
   是否要求本轮必须新增专门的“优先级收敛”集成测试用例，还是仅在现有 `resultReport.test.tsx` 中补充 1-2 个条件测试即可？

4. **其他边界**  
   是否允许顺手清理 ResultReport 中与季度展示无关的任何小问题？（GrokBuild 将严格控制在本轮范围外）

---

**快照结束**

*本快照记录了改动前的精确状态。任何后续代码修改都将以本快照为基准进行 diff 对比。*

*GrokBuild 将在收到 GPT-5.5 明确确认后，立即执行最小改动，并输出标准完成报告。*
