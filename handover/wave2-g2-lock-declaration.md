# Wave 2 G2 文件锁定声明与执行计划

> **锁定模型**: GrokBuild  
> **锁定时间**: 2026-05-29  
> **审查对象**: GPT-5.5  
> **依据**: GPT-5.5 G1 PASS + G2 批准（2026-05-29）

---

## 1. 锁定声明

根据 GPT-5.5 批准，GrokBuild 现正式独占以下文件（G2 执行期间禁止其他模型修改）：

### 1.1 核心锁定文件

| 文件 | 锁定级别 | 允许操作 | 禁止操作 |
|------|----------|----------|----------|
| `src/components/ResultReport.tsx` | 独占 | 修改季度通知展示优先级逻辑 | 改业务计算、改样式结构（除必要）、新增功能 |
| `tests/resultReport.test.tsx` | 独占 | 补充/调整季度展示相关测试 | 删除测试、改无关断言 |
| `src/App.tsx` | 最小必要 | 仅当需要传递 `quarterSettlement` prop 时进行最小修改 | 改游戏循环、改季度结算调用、任何非展示相关改动 |

### 1.2 其他文件状态

- 所有 `src/domain/*` 文件（含 `gameEngine.ts`、`quarterSettlement.ts` 等）：**严格禁止修改**
- `src/domain/quarterlyTarget.ts`、`financing.ts` 等：只读
- 其他组件和测试：DeepSeek / MiMo 可并行修改（不得碰上述锁定文件）

---

## 2. GPT-5.5 G2 执行边界（必须严格遵守）

### 2.1 G2 核心目标

收敛季度展示双轨，实现优先级：

```
quarterSettlement（新权威） > legacy quarterKpiResult（旧 fallback）
```

### 2.2 必须实现的行为

**当 `quarterSettlement` 存在时**：
- ResultReport **只展示** `quarterSettlement` 相关内容
- **不额外展示** legacy `quarterKpiResult` 通知

**当 `quarterSettlement` 不存在时**：
- 允许 `quarterKpiResult` 作为旧历史结果 fallback 展示

### 2.3 允许的最小修改范围

- 主要在 `ResultReport.tsx` 中调整条件渲染逻辑
- 必要时在 `App.tsx` 中最小传递 `quarterSettlement` prop（避免破坏现有调用）
- 测试文件仅补充验证优先级行为

### 2.4 明确禁止事项（本轮）

1. ❌ 删除 `legacy quarterKpiResult` 字段或相关类型
2. ❌ 删除 `gameEngine.ts` 中的旧 KPI 逻辑
3. ❌ 修改任何季度结算公式、融资 checkpoint、声望/信心数值
4. ❌ 改动存档格式
5. ❌ 抽 `useGameLoop` 或进行其他架构重构
6. ❌ 拆分 `saveSystem`
7. ❌ 扩大修改到非展示层逻辑

**G2 是展示优先级收敛，不是季度系统重写。**

---

## 3. G2 执行计划（串行步骤）

### Phase G2-1：前置快照与分析（立即开始）

- [ ] 创建本锁定声明文档
- [ ] 读取 `ResultReport.tsx` 中季度通知渲染全貌（legacy + 新 quarter-review-section）
- [ ] 分析 `quarterSettlement` prop 传递路径（App.tsx 调用点）
- [ ] 检查 `tests/resultReport.test.tsx` 当前季度相关测试覆盖
- [ ] 输出「G2 改动前状态快照」供 GPT-5.5 参考

### Phase G2-2：最小代码修改

- [ ] 在 `ResultReport.tsx` 中实现条件渲染：
  - `quarterSettlement` 存在 → 屏蔽 legacy `quarterKpiResult` 块
  - `quarterSettlement` 不存在 → 保留 legacy 作为 fallback
- [ ] 如 App.tsx 未正确传递 `quarterSettlement` 到 ResultReport，进行最小 prop 传递调整
- [ ] 确保新 `quarter-review-section`（340+ 行）行为不受影响

### Phase G2-3：测试补充

- [ ] 在 `tests/resultReport.test.tsx` 中补充验证：
  - 有 quarterSettlement 时，legacy 通知不渲染
  - 无 quarterSettlement 时，legacy 通知仍可渲染
- [ ] 不删除现有测试

### Phase G2-4：验证与交付

- [ ] 运行指定测试：
  - `npm test -- resultReport`
  - `npm test -- gameEngine quarterSettlement`
- [ ] 运行全量 `npm test`
- [ ] 运行 `npm run lint`
- [ ] 运行 `npm run build`
- [ ] 输出标准格式的 **G2 完成报告**
- [ ] 解除 G2 锁定，等待 GPT-5.5 审查

---

## 4. 风险控制措施

| 风险 | 控制措施 |
|------|----------|
| 误删 legacy 字段 | 本轮仅改条件渲染，不删除任何代码/字段 |
| 破坏新季度复盘 UI | 新 `quarter-review-section` 保持原逻辑，仅调整 legacy 块条件 |
| App.tsx 传递遗漏 | 最小修改，仅在必要时添加 prop 传递 |
| 范围扩大 | 本文档明确禁止事项，GPT-5.5 将在完成报告中验证 |
| 测试覆盖不足 | 明确要求补充优先级场景测试 |

---

## 5. 预期交付物

1. 本 G2 锁定声明（已创建）
2. G2 改动前状态快照（即将创建）
3. 代码最小 diff（仅展示优先级逻辑）
4. **G2 完成报告**（严格按 three-agent-rescue-plan 标准格式，回答 GPT-5.5 要求的 5 个问题）

---

## 6. 下一阶段触发条件

只有当以下全部满足，GrokBuild 才会请求 GPT-5.5 批准结束 Wave 2 或进入后续阶段：

- G2 完成报告已提交并获得 PASS / CONDITIONAL
- 全量三件套通过
- 明确确认展示优先级已收敛（quarterSettlement 优先）
- 无季度结算数值变化
- 无类型/存档格式变化

---

**文档结束**

*本声明一经发布即视为 G2 文件锁定生效。*

*GrokBuild 将严格遵守 GPT-5.5 划定的边界，仅做展示层优先级收敛工作。*
