# Wave 1 G1 改动前状态快照（供 GPT-5.5 审查）

> **创建模型**: GrokBuild  
> **创建时间**: 2026-05-29  
> **锁定状态**: 已锁定 `gameEngine.ts`（见 wave1-g1-lock-declaration.md）  
> **本快照性质**: 零修改的当前状态记录 + 提议最小改动 + 影响分析

---

## 1. 唯一污染点定位

**文件**: `src/domain/gameEngine.ts`  
**行号**: 50  
**污染类型**: 直接调用 `Math.random()`（仅此一处，全仓库）

### 1.1 精确代码上下文（当前状态）

```typescript
// src/domain/gameEngine.ts:32-70 （关键片段）

export function processPostSprint(
  state: GameState,
  result: SprintResult,
  participatingAgentIds: string[],
  rng?: RNG,                    // ← 可选参数
): GameState {
  let newFunds = state.funds - result.cost;
  const updatedResult: SprintResult = { ...result };
  const participatingAgentIdSet = new Set(participatingAgentIds);
  const newAgents = state.agents.map((agent) => {
    if (participatingAgentIdSet.has(agent.id)) {
      let morale = agent.morale;
      if (agent.consecutiveSprints >= 3) {
        morale -= 5;
      }
      
      const newSkills = { ...agent.skills };
      const skillKeys = Object.keys(newSkills) as Array<keyof typeof newSkills>;
      // ========== 问题行 ==========
      const randomSkill = rng 
        ? pickRandom(rng, skillKeys) 
        : skillKeys[Math.floor(Math.random() * skillKeys.length)];  // ← 唯一 Math.random
      // ============================
      newSkills[randomSkill] = Math.min(100, newSkills[randomSkill] + 1);

      return {
        ...agent,
        fatigue: Math.min(100, agent.fatigue + 15),
        consecutiveSprints: agent.consecutiveSprints + 1,
        totalSprintsWorked: agent.totalSprintsWorked + 1,
        morale: Math.max(0, morale),
        skills: newSkills,
      };
    } else {
      // ... 非参与 agent 的疲劳/士气恢复逻辑（与 rng 无关）
    }
  });
  // ... 后续季度 KPI、声望等逻辑（与 rng 无关）
}
```

### 1.2 业务含义

- **触发条件**：员工参与 Sprint 且未被锁定
- **效果**：该员工的 5 项技能之一随机 +1（上限 100）
- **当前随机源**：
  - 传入 `rng` → 使用确定性 `pickRandom`（来自 `random.ts` 的 LCG）
  - 未传入 → 退化到 `Math.random`

**业务逻辑本身完全正确**，问题仅在于 fallback 路径使用了不可重现的随机源。

---

## 2. 调用点分析（改动前）

### 2.1 生产路径（已安全）

**唯一生产调用**：
- `src/App.tsx:213`
  ```ts
  const newState = processPostSprint(gameState, result, Array.from(selectedAgentIds), rng);
  ```
- `rng` 参数：由 `executeSprint(..., rng: RNG)` 透传
- `rng` 来源：上层游戏循环使用 `createRNG(seed)` 创建
- **结论**：生产环境**100% 不会**执行 `Math.random` 分支

### 2.2 测试路径（存在 flaky 风险）

**未传 rng 的调用统计**（截至快照创建时）：

| 测试文件 | 调用次数（未传 rng） | 涉及场景 |
|----------|----------------------|----------|
| `tests/gameEngine.test.ts` | 约 15+ 处 | processPostSprint 各种分支测试 |
| `tests/gameLoop.integration.test.ts` | 约 12+ 处 | 完整 sprint → postSprint 集成流程 |

**典型未传 rng 调用示例**（来自 gameEngine.test.ts）：
```ts
const newState = processPostSprint(state, mockResult, ['1']);  // ← 第 4 参数缺失
```

**影响**：
- 每次运行，参与员工的「技能 +1」目标可能是 5 项技能中的任意一项
- 测试断言通常不检查具体哪个技能增长，因此当前能通过
- 但这违反了「相同 seed 行为稳定」的要求，且在并行或重跑时理论上存在 flaky 可能

---

## 3. 提议的最小改动（G1 范围）

### 3.1 核心修改（仅 1 处）

**目标**：消除 `Math.random`，强制消费传入的 `rng`

**改动前**（行 50）：
```ts
const randomSkill = rng 
  ? pickRandom(rng, skillKeys) 
  : skillKeys[Math.floor(Math.random() * skillKeys.length)];
```

**改动后**（推荐方案）：
```ts
if (!rng) {
  throw new Error('processPostSprint requires rng for deterministic skill growth');
}
const randomSkill = pickRandom(rng, skillKeys);
```

**备选温和方案**（若 GPT-5.5 更倾向静默处理）：
```ts
const randomSkill = rng 
  ? pickRandom(rng, skillKeys) 
  : pickRandom(createRNG(Date.now()), skillKeys); // 明确标记为不推荐
```

**GrokBuild 推荐**：使用**抛错方案**，因为：
- 能立即暴露调用方遗漏 rng 的问题
- 符合 GPT-5.5「必须显式传 rng」的硬性要求
- 生产路径已正确传参，不会触发

### 3.2 是否需要改函数签名？

**当前**：`rng?: RNG`（可选）

**建议**：
- 本轮 **不改为必传**（避免大量调用点类型错误）
- 通过运行时检查 + 清晰错误信息，逐步驱动调用方补全
- 未来 Wave 可在类型层面收紧

### 3.3 对业务逻辑的影响

**零影响**（符合 GPT-5.5 第 4 条硬性标准）：

- 技能成长公式不变：`newSkills[randomSkill] = Math.min(100, newSkills[randomSkill] + 1)`
- 概率分布不变（仍是均匀从 5 项技能中选 1）
- 触发条件不变
- 仅改变随机源的确定性

---

## 4. 后续测试修复范围（G1 必须覆盖）

必须修改的测试调用（将补充固定 seed RNG）：

1. `tests/gameEngine.test.ts` 中所有 `processPostSprint(state, mockResult, ids)` 调用
2. `tests/gameLoop.integration.test.ts` 中所有 `processPostSprint(state, rX, ids)` 调用

**修复模式示例**：
```ts
import { createRNG } from '../src/domain/random';

const rng = createRNG(12345);  // 固定 seed
const newState = processPostSprint(state, mockResult, ['1'], rng);
```

---

## 5. 验收检查清单（改动后必须全部通过）

- [ ] `grep -rn "Math\.random" --include="*.ts" --include="*.tsx" src/domain/gameEngine.ts` → 无结果
- [ ] 全仓库 `src/` 下核心 domain 无直接 `Math.random`（random.ts 内部实现除外）
- [ ] 所有 `processPostSprint` 测试调用均显式传第 4 参数
- [ ] 使用相同 seed 重复运行关键测试，结果一致
- [ ] `npm run lint` 通过
- [ ] `npm test` 全绿（406+）
- [ ] `npm run build` 通过
- [ ] **技能成长数值与概率完全未变**（通过代码审查 + 关键路径测试确认）

---

## 6. 风险与缓解

| 风险 | 缓解措施（已在快照中体现） |
|------|---------------------------|
| 误伤业务逻辑 | 只改随机源选择，不碰 +1 公式 |
| 测试大量修改引入新 bug | 仅添加 rng 参数，不改断言 |
| 生产路径意外触发新错误 | 生产已正确传参，抛错路径不会被命中 |
| 范围扩大 | 本快照明确仅限 G1，GPT-5.5 将在完成报告中验证 |

---

## 7. GPT-5.5 确认请求

在 GrokBuild 执行修改前，请确认：

1. **改动方案选择**  
   推荐「抛错 + 强制 rng」方案是否接受？还是更倾向「温和 fallback」方案？

2. **函数签名**  
   本轮是否需要把 `rng` 从可选改为必传？（GrokBuild 建议暂不改，靠运行时检查）

3. **测试修复粒度**  
   是否允许一次性修复所有未传 rng 的测试调用，还是需要分批提交审查？

4. **新增确定性测试**  
   是否要求本轮必须新增「相同 seed 技能成长可复现」用例？还是 G1 完成后由 DeepSeek 补充也可？

---

**快照结束**

*本快照记录了改动前的精确状态。任何后续代码修改都将以本快照为基准进行 diff 对比。*

*GrokBuild 将在收到 GPT-5.5 明确确认后，立即执行最小改动，并输出标准完成报告。*
