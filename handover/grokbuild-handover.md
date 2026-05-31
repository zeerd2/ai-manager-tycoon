# GrokBuild 工作交接与任务规划文档

> **编写模型**: GrokBuild (最高风险核心重构执行者)
> **编写日期**: 2026-05-29
> **审查对象**: GPT-5.5
> **文档用途**: 向 GPT-5.5 审查者清晰交代当前状态、职责边界、计划中的工作

---

## 1. 执行者身份确认

根据 `three-agent-rescue-plan.md` 分配：

| 角色 | 模型 | 职责定位 |
|------|------|----------|
| **最高风险执行者** | **GrokBuild** | 负责 `App.tsx` 拆分、`saveSystem.ts` 拆分、核心 domain 逻辑收敛 |
| 稳定中高复杂度开发者 | MiMo | hook 辅助拆分、CSS 模块化、类型清理 |
| 测试/文档/静态清点执行者 | DeepSeek | 测试补强、handover 文档同步、风险清单 |
| **审查者** | **GPT-5.5** | review、验收、冲突判断、准入控制（不直接写代码） |

**GrokBuild 工作原则**: 最高风险文件串行持有，不与任何模型并行修改。

---

## 2. 当前基线验证（Wave 0 同步确认）

**验证时间**: 2026-05-29 14:42

### 2.1 质量门禁三件套实测结果

| 检查项 | 命令 | 结果 | 基线一致性 |
|--------|------|------|------------|
| ESLint | `npm run lint` | ✅ 0 errors | ✅ 与计划一致 |
| 构建 | `npm run build` | ✅ ✓ built in 191ms | ✅ 通过 |
| 单元测试 | `npm test` | ✅ 406 passed / 24 files | ✅ 与计划一致 |

**验证命令输出摘要**:
```
> npm run lint
> eslint .  (exit code 0)

> npm run build
✓ built in 191ms (dist/index-C7qLkh_5.js 295.07 kB)

> npm test
  Test Files  24 passed (24)
  Tests  406 passed (406)
```

### 2.2 手头 handover 文档状态

| 文档 | 最后更新 | 内容一致性 |
|------|----------|------------|
| `project-status.md` | 2026-05-29 12:13 | ⚠️ 报告 383/383 tests，与实际 406 不符 |
| `module-status.md` | 2026-05-29 09:43 | ✅ 结构完整 |
| `task-history.md` | 2026-05-29 09:43 | ✅ 任务历史清晰 |

**发现问题**:
- `project-status.md:9` 仍记录 "383/383 tests"，实际已为 406
- 建议 DeepSeek 在 Wave 0 统一更新所有 handover 文档中的测试数字

---

## 3. GrokBuild 职责边界（来自 three-agent-rescue-plan）

### 3.1 核心任务清单（按 Wave 排序）

#### Wave 1 — 核心风险复核（P0）
| 任务 ID | 任务描述 | 目标文件 | 验收标准 |
|---------|----------|----------|----------|
| **G1** | 复核并修复核心 RNG 遗留 | `src/domain/gameEngine.ts`, `src/domain/random.ts`, `tests/gameEngine.test.ts`, `tests/random.test.ts` | 相同 seed 行为稳定，相关测试通过 |
| **G2** | 复核季度结算入口一致性 | `src/domain/quarterlyTarget.ts`, `src/App.tsx`, `src/components/ResultReport.tsx` | UI 展示与实际写入状态一致 |

**关键约束**:
- RNG 和季度结算都可能碰 `gameEngine.ts` / `App.tsx`，**必须 GrokBuild 串行处理**
- 不允许为了测试通过改业务数值

#### Wave 2 — `App.tsx` 拆分（P1）
| 任务 ID | 任务描述 | 目标文件 | 验收标准 |
|---------|----------|----------|----------|
| **G3** | 抽 `useGameLoop.ts` | `src/App.tsx` → `src/hooks/useGameLoop.ts` | `App.tsx` 行数下降，行为不变 |

**迁移范围**:
- sprint 执行
- 事件恢复
- 成就 toast
- 项目完成奖励
- 新员工解锁
- 季度结算写入

**注意**: 第一版允许 hook 参数较多，不引入 Redux/Zustand。

#### Wave 3A — 存档迁移链拆分（P1）
| 任务 ID | 任务描述 | 目标文件 | 验收标准 |
|---------|----------|----------|----------|
| **G4** | 新建 `saveMigration.ts` | `src/domain/saveSystem.ts` → `src/domain/saveMigration.ts` | 旧档迁移测试全部通过 |

**迁移内容**:
- v2→v7 迁移函数
- 迁移链
- `migrateSaveData`
- 必要 normalize helper

#### Wave 3B — 存档 checksum 拆分（P2，依赖 Wave 3A）
| 任务 ID | 任务描述 | 目标文件 | 验收标准 |
|---------|----------|----------|----------|
| **G5** | 拆 `saveChecksum.ts` | `src/domain/saveSystem.ts` → `src/domain/saveChecksum.ts` | save API 黑盒测试通过 |

**迁移内容**:
- checksum 生成/校验纯函数

---

### 3.2 文件所有权（GrokBuild 持有期间禁止他人修改）

| 文件/区域 | 持有规则 | 说明 |
|-----------|----------|------|
| `src/App.tsx` | 只能 GrokBuild 或 MiMo 一方持有 | 禁止并行修改 |
| `src/domain/saveSystem.ts` | **只能 GrokBuild 持有** | R4-1/R4-2 必须串行 |
| `src/domain/gameEngine.ts` | **只能 GrokBuild 持有** | 核心数值逻辑禁止多人同时改 |

**GrokBuild 当前持有状态**:
- ⏳ 尚未开始 Wave 1，`gameEngine.ts` / `saveSystem.ts` 暂无锁定
- 建议：开始 Wave 1 前，在 handover 文档中声明锁定

---

### 3.3 禁止事项（GrokBuild 必须遵守）

1. ❌ 禁止多个模型同时改 `App.tsx` / `saveSystem.ts` / `gameEngine.ts`
2. ❌ 禁止为了过测试删除测试
3. ❌ 禁止新增 `eslint-disable` 掩盖问题
4. ❌ 禁止改存档格式（`SAVE_VERSION`、localStorage key、JSON 结构）
5. ❌ 禁止引入 Redux/Zustand 等新状态库
6. ❌ 禁止继续往 `App.tsx` 塞新业务逻辑
7. ❌ 禁止文档写未验证的测试数或质量状态

---

## 4. 交付物格式（GPT-5.5 审查接口）

根据 `three-agent-rescue-plan.md:6`，**每个任务完成后必须输出以下格式的完成报告**：

```markdown
## 修改范围
- 文件列表

## 对应任务
- Wave / Task ID (如 Wave 1 / G1)

## 行为变化
- 是否改变运行时行为
- 是否改变存档格式
- 是否改变视觉表现

## 验证
- [ ] npm run lint
- [ ] npm test
- [ ] npm run build
- [ ] 局部测试: xxx

## 风险
- 剩余风险
- 需要 GPT-5.5 审查的点
```

**GPT-5.5 审查输出格式**:

```markdown
## 审查结论
PASS / FAIL / CONDITIONAL

## 阻塞问题
- 如有，列出必须修复项

## 非阻塞建议
- 可后续处理项

## 是否允许进入下一 Wave
YES / NO
```

---

## 5. 即将开始的工作（Wave 1 准备）

### 5.1 进入 Wave 1 的前提条件

根据计划，Wave 0 由 DeepSeek 负责同步 handover 文档。当前 DeepSeek 尚未更新 `project-status.md` 中的测试数字。

**GrokBuild 建议**:
- 若 DeepSeek 短期内无法同步，GrokBuild 可在开始 Wave 1 前自行更新基线文档中的测试数字（仅限数字校正，不改动其他内容）
- 或直接进入 Wave 1，Wave 5 统一收口时再做最终同步

### 5.2 Wave 1 工作计划（待 GPT-5.5 确认）

**优先级**: P0（最高）

**执行顺序**:
1. **G1** RNG 核心复核（先做，因为涉及 `gameEngine.ts` 锁定）
2. **G2** 季度结算入口复核（后做，避免与 G1 冲突）

**预计风险点**:
- RNG 确定性测试可能需要补充边界用例
- 季度结算可能暴露 `App.tsx` 与 `ResultReport.tsx` 的权威来源不一致

**请求 GPT-5.5 预审的问题**:
- [ ] RNG 复核的验收标准是否仅限"相同 seed 行为稳定"，还是需要更严格的统计学验证？
- [ ] 季度结算复核是否需要人工运行游戏验证 UI 展示与状态一致？

---

## 6. 当前状态总结（供 GPT-5.5 快速判断）

| 维度 | 状态 | 备注 |
|------|------|------|
| **基线质量门禁** | ✅ 通过 | lint 0 err / build ✓ / 406 tests |
| **Wave 0 同步** | ⏳ 待 DeepSeek 更新 | project-status.md 测试数需从 383→406 |
| **GrokBuild 任务就绪** | ✅ 就绪 | 等待 GPT-5.5 确认是否可进入 Wave 1 |
| **文件锁定** | ⏸️ 未锁定 | 尚未开始 Wave 1，gameEngine/saveSystem 暂无并行风险 |
| **风险暴露** | 📋 已知 | RNG 确定性、季度结算权威来源是已知遗留问题 |

---

## 7. GPT-5.5 审查请求

**本轮请 GPT-5.5 审查以下内容**:

1. **身份与职责边界确认**
   - GrokBuild 对自身定位的理解是否与 `three-agent-rescue-plan.md` 一致？

2. **基线验证完整性**
   - GrokBuild 执行的三件套验证是否充分？是否需要补充其他检查？

3. **Wave 1 进入许可**
   - 是否允许 GrokBuild 开始 Wave 1（G1 RNG 复核）？
   - 是否需要等待 DeepSeek 完成 Wave 0 文档同步？

4. **验收标准澄清**
   - RNG 复核的"相同 seed 行为稳定"是否需要更明确的判定阈值？
   - 季度结算复核是否需要人工功能验证？

---

## 附录 A：GrokBuild 工作日志（持续更新）

### 2026-05-29 14:42 — 初始状态同步

**操作**:
- 读取 `three-agent-rescue-plan.md`
- 执行基线验证：lint / build / test
- 读取 handover 文档
- 创建本 handover 文档

**结果**:
- ✅ 基线验证通过（406 tests, lint clean, build clean）
- ⚠️ 发现 `project-status.md` 测试数陈旧（383 vs 406）

**下一步**:
- 等待 GPT-5.5 审查本文档
- 确认是否进入 Wave 1

---

**文档结束**
*本文档将随 GrokBuild 工作进展持续更新，每次任务完成后追加日志并触发 GPT-5.5 审查。*
