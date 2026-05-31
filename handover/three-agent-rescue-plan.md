# 三模型抢救分工计划

> 编写日期: 2026-05-29  
> 执行模型: GrokBuild / MiMo / DeepSeek  
> GPT-5.5 职责: 只做审查、验收、风险拦截，不直接承担实现任务。

---

## 1. 当前基线

当前项目质量门禁基线:

```text
npm run lint  → 0 errors
npm run build → 通过
npm test      → 24 files / 406 tests passed
```

后续任何任务完成后，都必须保持三件套通过:

```bash
npm run lint
npm test
npm run build
```

如果任务只影响局部文件，可先跑相关测试；但交付前必须跑全量三件套。

---

## 2. 模型能力排序与职责

| 模型 | 能力定位 | 适合任务 | 不适合任务 |
|------|----------|----------|------------|
| GrokBuild | 最强执行者，负责高风险架构和核心逻辑 | `App.tsx` 拆分、`saveSystem.ts` 拆分、核心 domain 逻辑收敛 | 纯文档、机械 CSS 搬运 |
| MiMo | 稳定中高复杂度开发者，负责中风险重构和 UI/CSS 收敛 | hook 辅助拆分、CSS 模块化、类型清理、测试修复 | 单独负责最高风险迁移链设计 |
| DeepSeek | 测试/文档/静态清点执行者 | 测试补强、handover 文档同步、风险清单、静态审计 | 高耦合核心逻辑重构 |
| GPT-5.5 | 审查者 | review、验收、冲突判断、是否允许进入下一阶段 | 不直接写实现代码 |

---

## 3. 文件所有权规则

为避免多模型互相覆盖，以下文件必须严格锁定:

| 文件/区域 | 同一时间负责人 | 规则 |
|-----------|----------------|------|
| `src/App.tsx` | 只能 GrokBuild 或 MiMo 一方持有 | 禁止并行修改 |
| `src/domain/saveSystem.ts` | 只能 GrokBuild 持有 | R4-1/R4-2 必须串行 |
| `src/domain/gameEngine.ts` | 只能 GrokBuild 持有 | 核心数值逻辑禁止多人同时改 |
| `src/App.css` | MiMo 持有 | CSS 拆分期间其他人不改 |
| `handover/*` | DeepSeek 持有 | 文档同步由 DeepSeek 统一做 |
| `tests/*` | DeepSeek 优先，MiMo 可协助 | 测试改动必须对应具体重构 |

---

## 4. 推荐执行路线

### Wave 0 — 基线同步与任务冻结

目标: 让三模型基于同一个真实状态继续工作。

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| DeepSeek | 更新 handover 当前状态，统一 406 tests / lint clean / build clean | `handover/project-status.md`, `handover/module-status.md`, `handover/task-history.md` | 文档数字与真实命令一致 |
| GPT-5.5 | 审查文档是否仍有旧状态，如 338/360/382/383 tests 或 lint 失败描述 | 只读审查 | 给出 PASS/FAIL |

禁止:
- 不在 Wave 0 改业务代码。
- 不在文档里写未验证的状态。

---

### Wave 1 — 核心风险复核

目标: 确认 Phase 2 是否真正完成，避免在不稳定核心上继续拆分。

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| GrokBuild | 复核并修复核心 RNG 遗留，确保核心逻辑不直接使用 `Math.random()` | `src/domain/gameEngine.ts`, `src/domain/random.ts`, `tests/gameEngine.test.ts`, `tests/random.test.ts` | 相同 seed 行为稳定，相关测试通过 |
| GrokBuild | 复核季度结算入口，确认 `App.tsx` / `ResultReport.tsx` 不再各自计算权威结果 | `src/domain/quarterlyTarget.ts`, `src/App.tsx`, `src/components/ResultReport.tsx`, 相关测试 | UI 展示与实际写入状态一致 |
| DeepSeek | 补一组回归测试，覆盖 RNG 确定性和季度结算展示一致性 | `tests/*` | 测试先失败再由修复通过，或证明已有覆盖 |
| GPT-5.5 | 审查 GrokBuild 的核心逻辑改动是否改变数值平衡 | review only | 不允许无意调整游戏平衡 |

注意:
- RNG 和季度结算都可能碰 `gameEngine.ts` / `App.tsx`，必须 GrokBuild 串行处理。
- 不允许为了测试通过改业务数值。

---

### Wave 2 — `App.tsx` 拆分

目标: 把游戏流程编排从上帝组件中移出。

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| GrokBuild | 抽 `useGameLoop.ts`，迁移 sprint 执行、事件恢复、成就 toast、项目完成奖励、新员工解锁、季度结算写入 | `src/App.tsx`, `src/hooks/useGameLoop.ts`, 必要 domain tests | `App.tsx` 行数下降，行为不变 |
| MiMo | 在 GrokBuild 完成后，拆 UI selection/mobile 局部 hooks，如 `useGameSelection.ts` / `useMobileNavigation.ts` | `src/App.tsx`, `src/hooks/*` | 只拆 UI 状态，不碰核心 game loop |
| DeepSeek | 跑并补充 game loop 集成测试缺口 | `tests/gameLoop.integration.test.ts`, 相关 UI 测试 | 覆盖运行 sprint、项目完成、季度结算、事件恢复 |
| GPT-5.5 | 审查 hook 边界是否清晰，是否引入闭包/状态同步 bug | review only | PASS 后进入 Wave 3 |

第一版允许 hook 参数较多，不引入 Redux/Zustand，不做状态系统重写。

---

### Wave 3 — `saveSystem.ts` 串行拆分

目标: 降低存档系统维护风险，不改变存档格式。

#### Wave 3A — 拆迁移链

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| GrokBuild | 新建 `saveMigration.ts`，迁移 v2→v7 迁移函数、迁移链、`migrateSaveData`、必要 normalize helper | `src/domain/saveSystem.ts`, `src/domain/saveMigration.ts`, `tests/saveSystem.test.ts`, `tests/saveApi.integration.test.ts` | 旧档迁移测试全部通过 |
| DeepSeek | 对照迁移测试清单，确认 v2/v5/v6/损坏 JSON/checksum 场景仍覆盖 | `tests/saveSystem.test.ts`, `tests/saveApi.integration.test.ts` | 形成覆盖报告 |
| GPT-5.5 | 审查是否改变存档格式、localStorage key、checksum 行为 | review only | 不允许格式变化 |

#### Wave 3B — 拆 checksum / metadata

必须等 Wave 3A 完成后才能开始。

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| GrokBuild | 拆 `saveChecksum.ts`，迁移 checksum 生成/校验纯函数 | `src/domain/saveSystem.ts`, `src/domain/saveChecksum.ts` | save API 黑盒测试通过 |
| MiMo | 拆 `saveMetadata.ts`，迁移 `getSaveSlotMetadata` / `getSaveSlotsMetadata` 和 metadata helper | `src/domain/saveSystem.ts`, `src/domain/saveMetadata.ts` | autosave 单槽读取行为不退化 |
| DeepSeek | 跑全量 save 测试并补 metadata 回归用例 | `tests/saveSystem.test.ts`, `tests/saveApi.integration.test.ts` | 存档测试全绿 |
| GPT-5.5 | 审查模块边界和 public API 是否保持兼容 | review only | PASS 后进入 Wave 4 |

禁止:
- 不改 `SAVE_VERSION`。
- 不改 localStorage key。
- 不改存档 JSON 结构。
- 不删除旧迁移测试。

---

### Wave 4 — CSS 剩余拆分

目标: 继续降低 `App.css` 体积，保持视觉不变。

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| MiMo | 拆 `AgentCard.css` | `src/App.css`, `src/components/AgentCard.tsx`, `src/components/MobileAgentCard.tsx`, `src/components/AgentCard.css` | class 不重命名，build/lint 通过 |
| MiMo | 拆 `ProjectCard.css` | `src/App.css`, `src/components/ProjectCard.tsx`, `src/components/MobileProjectCard.tsx`, `src/components/ProjectCard.css` | class 不重命名，build/lint 通过 |
| DeepSeek | 做 CSS class 清点，确认没有孤儿 class 或重复移动 | CSS / components 只读为主 | 输出检查结果 |
| GPT-5.5 | 审查导入顺序和移动端覆盖关系 | review only | 不破坏移动端样式优先级 |

人工检查项:
- 桌面员工卡
- 桌面项目卡
- 移动员工卡
- 移动项目卡
- locked / selected / completed 状态

---

### Wave 5 — 文档收口与恢复开发判断

目标: 判断抢救阶段是否可以结束，是否恢复 v9 功能开发。

| 负责人 | 任务 | 文件范围 | 验收 |
|--------|------|----------|------|
| DeepSeek | 更新最终 handover 状态、模块状态、任务历史 | `handover/*` | 所有数字与真实命令一致 |
| GrokBuild | 提供核心重构完成报告，列明行为是否变化 | handover 报告 | 明确风险和未完成项 |
| MiMo | 提供 CSS/UI 拆分完成报告 | handover 报告 | 明确人工视觉检查项 |
| GPT-5.5 | 最终审查，给出是否允许恢复 v9 功能开发的结论 | review only | PASS/FAIL/CONDITIONAL |

恢复 v9 功能开发的最低条件:

```text
1. npm run lint 通过
2. npm test 全量通过
3. npm run build 通过
4. App.tsx 已完成至少 useGameLoop 拆分
5. saveSystem.ts 已完成 migration 拆分
6. handover 文档状态可信
```

---

## 5. 任务优先级总表

| 优先级 | 任务 | 负责人 | 状态 |
|--------|------|--------|------|
| P0 | handover 基线同步 | DeepSeek | 待做 |
| P0 | RNG / 季度结算核心复核 | GrokBuild | 待做 |
| P1 | 抽 `useGameLoop.ts` | GrokBuild | 待做 |
| P1 | 拆 `saveMigration.ts` | GrokBuild | 待做 |
| P2 | 拆 `saveChecksum.ts` | GrokBuild | 待做 |
| P2 | 拆 `saveMetadata.ts` | MiMo | 待做，依赖 checksum/migration 拆分 |
| P2 | 拆 AgentCard / ProjectCard CSS | MiMo | 待做 |
| P2 | 测试补强和覆盖报告 | DeepSeek | 持续 |
| P2 | 最终 handover 收口 | DeepSeek | 待做 |
| Review | 每轮审查和准入判断 | GPT-5.5 | 持续 |

---

## 6. 每轮交付格式

每个模型完成任务后必须写完成报告:

```md
## 修改范围
- 文件列表

## 对应任务
- Wave / Task ID

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

GPT-5.5 审查输出格式:

```md
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

## 7. 禁止事项

1. 禁止多个模型同时改 `App.tsx`。
2. 禁止多个模型同时改 `saveSystem.ts`。
3. 禁止为了过测试删除测试。
4. 禁止新增 `eslint-disable` 掩盖问题。
5. 禁止改存档格式，除非单独批准。
6. 禁止引入 Redux/Zustand 等新状态库。
7. 禁止继续往 `App.tsx` 塞新业务逻辑。
8. 禁止继续往 `App.css` 追加大段全局样式。
9. 禁止文档写未验证的测试数或质量状态。

---

## 8. 总结

本轮分工调整为:

```text
GrokBuild: 主攻最高风险核心重构
MiMo: 承接中风险 UI/CSS/metadata 拆分
DeepSeek: 负责测试、文档、静态审计和完成报告
GPT-5.5: 只做审查、验收和风险拦截
```

执行顺序以文件所有权为准，不以模型空闲度为准。宁可慢一点，也不要让多个模型同时修改同一个高风险文件。
