# Wave 3 — useGameLoop.ts 拆分 前置准备与执行计划

> **准备模型**: GrokBuild  
> **准备日期**: 2026-05-29  
> **审查对象**: GPT-5.5  
> **前置状态**: G1（RNG 确定性）+ G2（季度展示双轨收敛）已全部 PASS  
> **当前基线**: lint 0 errors / 413 tests passed / build passed

---

## 1. 当前阶段状态确认

根据 GPT-5.5 最终审查结论：

- **G1**: PASS（RNG 核心风险已消除）
- **G2**: PASS（季度展示双轨已收敛）
- **Wave 1 核心风险复核**: 已完成
- **G2 文件锁**: 已正式解除
- **当前基线**: 必须使用 **413 tests**（不得再引用 406/411）

**尚未满足最终恢复 v9 开发的最低条件**，因此暂时不进入 Wave 5 收口。

**下一执行重点**：App.tsx 结构化拆分，优先抽取游戏主循环逻辑。

---

## 2. 本阶段任务目标

**核心任务**：将 App.tsx 中负责“游戏流程编排”的逻辑抽取为独立的 `useGameLoop` hook。

**第一版目标**（按 three-agent-rescue-plan 描述）：
- 迁移 sprint 执行
- 事件恢复
- 成就 toast
- 项目完成奖励
- 新员工解锁
- 季度结算写入

**不引入**：
- Redux / Zustand 等新状态管理库
- 大规模状态系统重写
- 一次性把 App.tsx 拆得太干净（允许第一版 hook 参数较多）

---

## 3. 计划迁移范围（初步分析）

### 3.1 建议迁移到 `useGameLoop` 的逻辑

| 类别 | 当前位置 | 说明 |
|------|----------|------|
| `executeSprint` 函数 | App.tsx:183-311 | 核心游戏循环编排 |
| `handleRunSprint` | App.tsx:152-172 | Sprint 启动入口（含事件判定） |
| `handleEventResolve` | App.tsx:174-181 | 事件恢复入口 |
| 季度结算触发与写入 | App.tsx:236-245 | 调用 processQuarterSettlement 并更新状态 |
| 新员工解锁处理 | App.tsx:247-259 | checkUnlocks + UI 通知状态 |
| 成就解锁与 toast | App.tsx:261-299 | checkAchievement + setToastQueue |
| 项目完成奖励与 UI 状态 | App.tsx:302-304 | setProjectCompleted / setProjectBonus |
| 关系系统更新 | App.tsx:193-230 | RelationsManager 相关逻辑 |
| 最后结果与季度结算状态更新 | App.tsx:305-306 | setLastResult / setLastQuarterSettlement |

### 3.2 建议留在 App.tsx 的内容

- 所有 UI 选择状态（selectedAgentIds、selectedProjectId、selectedStrategyId）
- 移动端状态（activeMobileOverlay 等）
- Toast 队列渲染、庆祝动画等纯展示逻辑
- Save / Load / New Game 相关回调
- Autosave 配置
- 其他非游戏流程的副作用

---

## 4. 文件锁定申请（GrokBuild 独占）

根据历史规则和高风险文件保护，**正式申请锁定以下文件**：

| 文件 | 锁定级别 | 理由 |
|------|----------|------|
| `src/App.tsx` | 独占（GrokBuild） | 当前最高风险文件，禁止与其他模型并行修改 |
| `src/hooks/useGameLoop.ts` | 独占（新建） | 新 hook，由 GrokBuild 负责创建和迭代 |
| `tests/gameLoop.integration.test.ts` | 最小必要修改权 | 集成测试需要同步调整 |
| 其他 gameLoop 相关测试 | 最小必要 | 视实际情况申请 |

**申请期间其他模型禁止**：
- 任何模型修改 `src/App.tsx`
- DeepSeek 仅可修改 `handover/*`（不得碰 App.tsx）
- MiMo 仅可处理 CSS 相关文件（不得碰 App.tsx）

---

## 5. 风险分析

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| App.tsx 拆分引入状态同步 bug | 高 | 第一版允许参数较多，不追求完美解耦；保留原有执行顺序 |
| 成就 toast、项目完成庆祝等副作用迁移困难 | 中 | 保留部分本地状态更新在 App.tsx，通过 hook 返回必要数据 |
| 测试覆盖不足导致行为变化 | 高 | 拆分前先建立基线测试；拆分过程中保持测试全绿 |
| 与移动端状态耦合 | 中 | 拆分时明确边界，UI 状态不进入 hook |
| 后续 MiMo / DeepSeek 并行修改导致冲突 | 高 | 严格执行文件锁定规则 |

---

## 6. 验收标准（本阶段）

完成 useGameLoop 抽取后必须满足：

1. `App.tsx` 行数明显下降（游戏流程编排逻辑显著减少）
2. 游戏核心行为完全不变（相同操作下状态变化一致）
3. `npm run lint` / `npm test` / `npm run build` 全部通过
4. 关键集成测试（gameLoop.integration.test.ts）保持全绿
5. 新 hook 边界清晰（即使参数较多也接受）
6. 文档更新（handover 同步到 413 tests）

**禁止**：
- 本阶段不要求把 App.tsx 拆得非常干净
- 不引入新状态管理库
- 不改动 domain 核心逻辑

---

## 7. 禁止事项（本阶段）

1. 禁止在未获 GPT-5.5 批准前修改 App.tsx
2. 禁止扩大范围到 saveSystem.ts 拆分（必须等 useGameLoop 完成后再申请）
3. 禁止删除或大幅重构现有测试
4. 禁止在 hook 中引入 Redux/Zustand
5. 禁止并行修改高风险文件

---

## 8. 执行路线建议（供 GPT-5.5 参考）

**推荐顺序**（与 GPT-5.5 最后指示一致）：

1. **DeepSeek**：优先同步 handover 文档基线到 413 tests
2. **MiMo**：补 R5-3 人工视觉检查结论（CSS）
3. **GrokBuild**：开始 useGameLoop.ts 拆分（本阶段）
4. **GrokBuild**：useGameLoop 完成后，再申请 saveMigration.ts 拆分

---

## 9. GPT-5.5 审查请求

请 GPT-5.5 明确回复以下问题：

1. **文件锁定批准**  
   是否批准 GrokBuild 独占锁定 `src/App.tsx` 和新建 `src/hooks/useGameLoop.ts`？

2. **迁移范围**  
   文中列出的迁移范围是否合理？是否有重要逻辑建议留在 App.tsx 或必须提前迁移？

3. **Hook 设计原则**  
   第一版允许参数较多、状态更新部分留在 App.tsx 的策略是否可接受？

4. **执行顺序**  
   是否同意“先完成 useGameLoop，再申请 saveMigration.ts”的顺序？

5. **其他阻塞或建议**  
   在正式开始拆分前，是否还有其他必须澄清的边界或风险？

---

## 10. 后续文档计划

获得 GPT-5.5 批准后，GrokBuild 将依次产出：

- Wave 3 useGameLoop 拆分前置快照（改动前 App.tsx 核心循环状态）
- 拆分执行计划（分阶段最小改动）
- 每阶段完成报告（按标准格式）
- 最终 useGameLoop 拆分完成报告

---

**文档结束**

*本准备文档旨在让 GPT-5.5 在不阅读全部 App.tsx 的情况下，就能清晰判断边界、风险和锁定必要性。*

*GrokBuild 将严格等待 GPT-5.5 明确批准后，再开始实际修改 App.tsx。*