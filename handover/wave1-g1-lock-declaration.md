# Wave 1 G1 文件锁定声明与执行计划

> **锁定模型**: GrokBuild  
> **锁定时间**: 2026-05-29  
> **审查对象**: GPT-5.5  
> **依据**: GPT-5.5 CONDITIONAL YES 审查结论（2026-05-29）

---

## 1. 锁定声明

根据 GPT-5.5 批准，GrokBuild 现正式独占以下文件（执行期间禁止其他模型修改）：

### 1.1 核心锁定文件

| 文件 | 锁定级别 | 允许操作 | 禁止操作 |
|------|----------|----------|----------|
| `src/domain/gameEngine.ts` | 独占 | 修复 RNG fallback、调整类型、修复相关调用 | 改业务数值、删测试、加新功能 |
| `src/domain/random.ts` | 独占 | 只读（除非 GPT-5.5 单独批准） | 任何重写 |
| `tests/gameEngine.test.ts` | 最小必要修改 | 补 rng 参数到 processPostSprint 调用 | 删除测试、改断言逻辑 |
| `tests/gameLoop.integration.test.ts` | 最小必要修改 | 补 rng 参数到 processPostSprint 调用 | 删除测试、改断言逻辑 |

### 1.2 其他文件状态

- `src/App.tsx`：**暂不锁定**（G1 不涉及；G2 阶段再评估）
- `src/components/ResultReport.tsx`：**暂不锁定**（G2 阶段处理）
- `src/domain/quarterSettlement.ts`、`quarterlyTarget.ts`：只读
- 其他测试文件：DeepSeek 可并行修改（不碰上述锁定文件）

---

## 2. GPT-5.5 批准边界（必须严格遵守）

### 2.1 G1 必须满足的 5 条硬性标准

1. ✅ 核心 domain 逻辑中不再直接调用 `Math.random()`
2. ✅ 生产路径继续使用 `App.tsx` 注入的 seeded rng
3. ✅ 所有涉及技能成长随机性的测试必须显式传 rng，避免 flaky
4. ✅ **不改变**技能成长概率、数值、触发条件
5. ✅ `npm run lint` / `npm test` / `npm run build` 全部通过

### 2.2 允许的最小修法

- `processPostSprint` 必须消费传入的 `rng`
- 测试中补固定 seed rng
- **不要**为了确定性修改概率公式

### 2.3 不建议 / 禁止

- 不要引入新的全局随机源
- 不要让 fallback 继续使用 `Math.random()`
- 不要重写 `random.ts`
- 本轮禁止扩大范围（不删旧 KPI 逻辑、不抽 hook、不拆存档等）

---

## 3. G1 执行计划（串行步骤）

### Phase G1-1：前置快照与分析（当前）

- [x] 创建本锁定声明文档
- [ ] 读取 `gameEngine.ts` 中 RNG fallback 精确上下文（第 41-60 行附近）
- [ ] 读取 `processPostSprint` 函数签名与 rng 使用全貌
- [ ] 统计所有未传 rng 的 `processPostSprint` 测试调用点
- [ ] 输出「G1 改动前状态快照」供 GPT-5.5 参考

### Phase G1-2：最小代码修改

- [ ] 修改 `gameEngine.ts`：移除 `Math.random` fallback，强制使用传入 rng
- [ ] 如需调整函数签名（rng 改为必传），同步更新类型定义
- [ ] **不改**任何技能成长计算公式

### Phase G1-3：测试修复

- [ ] 修复 `tests/gameEngine.test.ts` 中所有 `processPostSprint(..., )` 未传 rng 的调用
- [ ] 修复 `tests/gameLoop.integration.test.ts` 中对应调用
- [ ] 为每个修复点使用**固定 seed** 的 RNG（确保可复现）
- [ ] 确保不删除任何原有测试断言

### Phase G1-4：新增确定性测试（可选但推荐）

- [ ] 在 `tests/gameEngine.test.ts` 或 `tests/random.test.ts` 新增至少 1 个「相同 seed 下技能成长路径可复现」的用例
- [ ] 验证多次运行结果一致

### Phase G1-5：验证与交付

- [ ] 运行相关测试（`npm test -- --grep "processPostSprint|gameEngine"`）
- [ ] 运行全量 `npm test`
- [ ] 运行 `npm run lint`
- [ ] 运行 `npm run build`
- [ ] 输出标准格式的 **G1 完成报告**
- [ ] 解除或保持锁定（视 GPT-5.5 是否批准进入 G2）

---

## 4. 风险控制措施

| 风险 | 控制措施 |
|------|----------|
| 误删业务逻辑 | 只改 fallback 行，不碰技能成长公式 |
| 测试 flaky 残留 | 所有 processPostSprint 调用必须补 rng |
| 引入新随机源 | 禁止任何 `Math.random` 新增 |
| 行为变化 | 修改前后用相同 seed 对比关键路径 |
| 范围蔓延 | 本文档明确禁止事项，GPT-5.5 将在完成报告中验证 |

---

## 5. 预期交付物

1. 本锁定声明 + 执行计划（已创建）
2. G1 改动前状态快照（即将创建）
3. 代码修改（最小 diff）
4. **G1 完成报告**（严格按 three-agent-rescue-plan 标准格式）
   - 修改范围
   - 对应任务（Wave 1 / G1）
   - 行为变化（明确回答：是否改变技能成长概率）
   - 验证结果（三件套 + 局部测试）
   - 剩余风险 + GPT-5.5 需审查点

---

## 6. 下一阶段触发条件

只有当以下全部满足，GrokBuild 才会请求 GPT-5.5 批准进入 G2：

- G1 完成报告已提交并获得 PASS / CONDITIONAL
- 全量三件套通过
- 确认已无 `Math.random` 直接调用于核心 domain
- 所有技能成长相关测试已显式传 rng

---

**文档结束**

*本声明一经发布即视为文件锁定生效。任何其他模型试图修改上述锁定文件，GrokBuild 将在后续审查中报告违规。*

*GrokBuild 将在每个阶段关键节点前创建可审查的中间文档，确保 GPT-5.5 始终掌握上下文。*
