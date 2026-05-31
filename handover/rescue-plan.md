# AI Manager Tycoon — 模块化抢救计划

> 编写日期: 2026-05-27  
> 目标: 在高并发 agent 协作下，先止血、再拆石山、最后恢复可持续开发节奏。  
> 当前判断: 项目可运行，核心 MVP 成立，但 `App.tsx`、`App.css`、`saveSystem.ts` 已经形成局部石山；handover 文档存在质量状态失真，继续直接堆 v9 功能会放大风险。

---

## 0. 当前真实状态快照

### 已验证通过

```bash
npm test
# 20 个测试文件，338 个测试全部通过

npm run build
# TypeScript + Vite 构建通过
```

### 已验证失败

```bash
npm run lint
# 24 errors
```

主要失败点:

- `src/components/CompanyDashboard.tsx` — Fast Refresh 导出规则失败
- `src/components/QuarterlyGoalsPanel.tsx` — Fast Refresh 导出规则失败
- `src/components/TutorialGuide.tsx` — Fast Refresh 导出规则失败
- `src/components/ResultReport.tsx:198-199` — `any[]`
- `src/domain/gameEngine.ts:123-124` — 无用赋值
- `src/domain/gameState.ts:21` — `quarterlyEvaluations?: any[]`
- `src/domain/saveSystem.ts:317` — `as any`
- `tests/reputation.test.ts` — 未使用 import
- `tests/resultReport.test.tsx` / `tests/saveSystem.test.ts` — 多处 `any`

---

## 1. 抢救原则

### 1.1 禁止事项

高并发抢修时，所有 agent 必须遵守:

1. 不允许大范围重写。
2. 不允许同时改同一个文件。
3. 不允许顺手新增功能。
4. 不允许绕过 lint / test。
5. 不允许用 `// eslint-disable` 掩盖新问题。
6. 不允许修改业务数值平衡，除非任务明确要求。
7. 不允许改 `package.json` 依赖，除非管理者明确批准。
8. 不允许删除测试来让 CI 通过。
9. 不允许继续往 `App.tsx` 塞新业务逻辑。
10. 不允许继续往 `App.css` 追加大段全局样式。

### 1.2 验收底线

每个抢修分支必须至少满足:

```bash
npm run build
npm test
npm run lint
```

如果任务只影响单测，可先跑相关测试，但最终合并前必须跑全量三件套。

### 1.3 分支命名建议

| 类型        | 分支前缀             | 示例                           |
| --------- | ---------------- | ---------------------------- |
| lint 修复   | `rescue/lint-`   | `rescue/lint-type-cleanup`   |
| domain 抢救 | `rescue/domain-` | `rescue/domain-rng-quarter`  |
| UI 拆分     | `rescue/ui-`     | `rescue/ui-app-hook-extract` |
| CSS 拆分    | `rescue/css-`    | `rescue/css-result-report`   |
| 测试补强      | `rescue/test-`   | `rescue/test-game-loop`      |
| 文档修正      | `rescue/docs-`   | `rescue/docs-handover-truth` |

---

## 2. 模型能力分工

当前可用模型:

1. GPT-5.5
2. Gemini 3.5 Flash
3. MiMo v2.5 Pro
4. DeepSeek v4 Flash

### 2.1 推荐定位

| 模型                | 推荐角色           | 适合任务                                  | 不适合任务            |
| ----------------- | -------------- | ------------------------------------- | ---------------- |
| GPT-5.5           | 总架构 / 高风险核心逻辑  | `App.tsx` 拆分、季度结算统一、随机数一致性、存档系统边界     | 纯机械改文案、批量 CSS 搬运 |
| Gemini 3.5 Flash  | 快速 UI / 样式执行   | CSS 拆分、组件小修、Fast Refresh 修复、移动端 UI 微调 | 复杂领域逻辑、迁移链设计     |
| MiMo v2.5 Pro     | 稳定中等复杂度开发      | lint 修复、类型补齐、测试修复、组件内聚清理              | 大架构决策、跨系统重构      |
| DeepSeek v4 Flash | 数据 / 文档 / 测试补充 | handover 修正、TODO 清点、测试用例补齐、静态数据校验     | 高耦合核心逻辑改造        |

### 2.2 并发策略

高并发不要按“功能”乱切，要按“文件所有权”切。

推荐同一轮最多并发 4 条线:

1. GPT-5.5: domain 高风险修复
2. MiMo v2.5 Pro: lint/type 修复
3. Gemini 3.5 Flash: UI/CSS 非核心拆分
4. DeepSeek v4 Flash: 文档校正 + 测试补强

不要让两个 agent 同时改:

- `src/App.tsx`
- `src/App.css`
- `src/domain/saveSystem.ts`
- `src/domain/gameEngine.ts`
- `src/domain/gameState.ts`

---

## 3. 抢救阶段总览

| 阶段      | 目标                | 是否允许并发   | 预计负责人                    |
| ------- | ----------------- | -------- | ------------------------ |
| Phase 0 | 冻结范围、建立真实基线       | 低并发      | GPT-5.5                  |
| Phase 1 | 质量门禁止血，lint 全绿    | 高并发      | MiMo + Gemini + DeepSeek |
| Phase 2 | 修核心确定性和季度逻辑割裂     | 中并发      | GPT-5.5                  |
| Phase 3 | 拆 `App.tsx` 上帝组件  | 低并发      | GPT-5.5 + MiMo           |
| Phase 4 | 拆 `saveSystem.ts` | 低并发      | GPT-5.5                  |
| Phase 5 | 拆 `App.css`       | 高并发但按组件切 | Gemini + MiMo            |
| Phase 6 | 集成测试 / E2E 补强     | 高并发      | DeepSeek + MiMo          |
| Phase 7 | handover 文档重写     | 高并发      | DeepSeek                 |

---

## 4. Phase 0 — 冻结与基线

### 目标

防止高并发抢救期间继续制造新债务。

### 任务 R0-1: 建立抢救基线

负责人: GPT-5.5  
难度: 中  
风险: 低  
文件范围:

- 不改代码，只记录状态

执行:

```bash
npm run build
npm test
npm run lint
```

产出:

- 记录真实输出
- 标记当前 lint 失败清单
- 确认 build/test 仍通过

验收:

- 得到一份当前真实质量状态
- 不修改业务代码

### 任务 R0-2: 冻结 v9 新功能

负责人: GPT-5.5 / 管理者  
难度: 低  
风险: 低

规则:

- 抢救期间暂停 WS-97 / WS-98 / WS-102 继续开发
- 只允许修复质量门禁、重构、测试补强
- 新功能需求进入 backlog，不进入抢救分支

---

## 5. Phase 1 — Lint 止血

目标: 让 `npm run lint` 从 24 errors 变成 0 errors。

这是最高优先级，因为 handover 当前声称 lint 通过但实际失败，说明质量门禁已经失真。

### 任务 R1-1: 修复 React Fast Refresh 导出问题

负责人: Gemini 3.5 Flash  
备选: MiMo v2.5 Pro  
难度: 低  
风险: 低  
文件范围:

- `src/components/CompanyDashboard.tsx`
- `src/components/QuarterlyGoalsPanel.tsx`
- `src/components/TutorialGuide.tsx`

问题:

这些组件文件导出了非组件函数，触发:

```text
react-refresh/only-export-components
```

建议做法:

- 如果函数只被测试使用，移动到新文件，例如:
  - `src/components/companyDashboardUtils.ts`
  - `src/components/quarterlyGoalsUtils.ts`
  - `src/components/tutorialGuideUtils.ts`
- 组件文件只保留组件导出。
- 更新测试 import。

禁止:

- 禁用 eslint 规则
- 删除测试

验收:

```bash
npm run lint
npm test -- CompanyDashboard QuarterlyGoalsPanel TutorialGuide
```

如果测试过滤不好用，直接跑:

```bash
npm test
```

---

### 任务 R1-2: 修复 ResultReport 类型逃逸

负责人: MiMo v2.5 Pro  
备选: GPT-5.5  
难度: 中  
风险: 中  
文件范围:

- `src/components/ResultReport.tsx`
- `tests/resultReport.test.tsx`
- 必要时只读 `src/domain/financing.ts`

问题:

`src/components/ResultReport.tsx:198-199`:

```ts
let checkpoints: any[] = [];
let evaluatedCheckpoints: any[] = [];
```

建议做法:

- 从 `domain/financing.ts` 导出或复用已有类型。
- 如果已有返回类型可以推导，使用:

```ts
type Checkpoint = ReturnType<typeof getDefaultCheckpoints>[number];
type EvaluatedCheckpoint = ReturnType<typeof evaluateQuarterCheckpoints>[number];
```

- 替换测试中的 `any` mock。

禁止:

- 用 `unknown as any`
- 添加 eslint-disable

验收:

```bash
npm run lint
npm test -- resultReport
npm run build
```

---

### 任务 R1-3: 修复 GameState 中的 `any`

负责人: MiMo v2.5 Pro  
备选: GPT-5.5  
难度: 中  
风险: 中  
文件范围:

- `src/domain/gameState.ts`
- `src/domain/quarterlyTarget.ts`
- `src/App.tsx`
- `src/domain/saveSystem.ts`
- 相关测试

问题:

`src/domain/gameState.ts:21`:

```ts
quarterlyEvaluations?: any[];
```

建议做法:

定义明确类型，例如:

```ts
export interface QuarterlyEvaluationRecord {
  quarterNumber: number;
  target: QuarterTarget;
  achieved: boolean;
  actualValue: number;
}
```

注意:

- 类型应与 `App.tsx:290-298` 实际写入结构一致。
- 不要改变运行时结构，只补类型。

验收:

```bash
npm run lint
npm test -- quarterlyTarget saveSystem
npm run build
```

---

### 任务 R1-4: 修复 gameEngine 无用赋值

负责人: MiMo v2.5 Pro  
备选: Gemini 3.5 Flash  
难度: 低  
风险: 中  
文件范围:

- `src/domain/gameEngine.ts`
- `tests/gameEngine.test.ts`

问题:

`src/domain/gameEngine.ts:123-124`:

```ts
let kpiPassed = false;
let kpiDesc = '';
```

lint 认为初始赋值无用。

建议做法:

- 改为未初始化但明确赋值:

```ts
let kpiPassed: boolean;
let kpiDesc: string;
```

- 或抽成纯函数:

```ts
const { passed, desc } = evaluateLegacyKpi(...);
```

如果只为 lint 止血，优先最小改动。

验收:

```bash
npm run lint
npm test -- gameEngine
```

---

### 任务 R1-5: 修复测试中的 any / unused import

负责人: DeepSeek v4 Flash  
备选: Gemini 3.5 Flash  
难度: 低到中  
风险: 低  
文件范围:

- `tests/reputation.test.ts`
- `tests/resultReport.test.tsx`
- `tests/saveSystem.test.ts`

问题:

- `DEFAULT_IMPACT` 未使用
- 测试中大量 `any`

建议做法:

- 删除未使用 import。
- 测试 mock 使用明确类型。
- 对旧存档迁移测试，可定义局部 legacy 类型，而不是 `any`。
- 如果确实是未知旧数据，优先用 `unknown` + 类型收窄，而不是 `any`。

验收:

```bash
npm run lint
npm test -- reputation resultReport saveSystem
```

---

### Phase 1 合并顺序

推荐顺序:

1. R1-4 `gameEngine` 小修
2. R1-5 测试小修
3. R1-1 组件导出拆分
4. R1-3 `GameState` 类型补齐
5. R1-2 `ResultReport` 类型补齐
6. 最后统一跑全量:

```bash
npm run lint
npm test
npm run build
```

---

## 6. Phase 2 — 核心确定性与逻辑权威入口

目标: 修掉领域逻辑最危险的隐性风险。

### 任务 R2-1: 修复核心逻辑中的 `Math.random()`

负责人: GPT-5.5  
难度: 中  
风险: 高  
文件范围:

- `src/domain/gameEngine.ts`
- `src/domain/random.ts`
- `src/App.tsx`
- `tests/gameEngine.test.ts`
- `tests/random.test.ts`

问题:

`src/domain/gameEngine.ts:45`:

```ts
const randomSkill = skillKeys[Math.floor(Math.random() * skillKeys.length)];
```

核心逻辑绕过了项目自定义 RNG。

建议方案:

方案 A，推荐:

- `processPostSprint` 增加 `rng?: RNG` 参数。
- `executeSprint` 调用时传入已有 rng。
- 测试里传固定 seed RNG。

方案 B:

- 把技能成长随机提前到 `runSprint` 或 simulation 层。
- `processPostSprint` 只消费 result。

推荐选 A，改动更小。

验收:

- 相同 seed 下，多次 sprint 后技能成长一致。
- 旧测试全部通过。

```bash
npm test -- gameEngine random
npm run build
npm run lint
```

---

### 任务 R2-2: 统一季度结算入口

负责人: GPT-5.5  
协助: MiMo v2.5 Pro  
难度: 高  
风险: 高  
文件范围:

- `src/domain/quarterlyTarget.ts`
- `src/domain/financing.ts`
- `src/domain/reputation.ts`
- `src/domain/gameEngine.ts`
- `src/App.tsx`
- `src/components/ResultReport.tsx`
- `tests/quarterlyTarget.test.ts`
- `tests/financing.test.ts`
- `tests/reputation.test.ts`
- `tests/resultReport.test.tsx`

当前问题:

季度相关逻辑分散在:

- `gameEngine.ts` — legacy KPI 奖惩
- `App.tsx` — 季度目标和融资 checkpoint 写状态
- `ResultReport.tsx` — 展示时重新生成和评估季度结果

风险:

UI 展示和真实状态可能不一致。

建议目标结构:

```ts
export interface QuarterSettlementResult {
  quarterNumber: number;
  targetEvaluation: QuarterlyEvaluationRecord;
  financingResults: FinancingEvaluationResult[];
  totalFinancingReward: number;
  reputationDelta: number;
  confidenceDelta: number;
  triggeredCheckpointIds: string[];
}

export function processQuarterSettlement(input): QuarterSettlementResult
```

落地步骤:

1. 先不改变数值公式。
2. 把现有逻辑搬进一个 domain 函数。
3. `App.tsx` 只调用一次该函数并写入 state。
4. `ResultReport.tsx` 优先展示 `gameState.quarterlyEvaluations` 里的结果，不再自行重新评估作为权威。
5. 补充测试验证 App 写入结构和 ResultReport 展示一致。

验收:

```bash
npm test -- quarterlyTarget financing reputation resultReport gameEngine
npm run build
npm run lint
```

---

## 7. Phase 3 — `App.tsx` 模块化抢救

目标: 让 `App.tsx` 从 855 行下降，去除核心业务编排。

### 任务 R3-1: 抽离 autosave hook

负责人: MiMo v2.5 Pro  
备选: Gemini 3.5 Flash  
难度: 中  
风险: 低  
文件范围:

- `src/App.tsx`
- 新增 `src/hooks/useAutosave.ts` 或 `src/domain/saveSystem.ts` 附近 helper
- 相关测试可选

当前位置:

- `src/App.tsx:139-178`

建议:

```ts
useAutosave({
  currentSlotId,
  gameState,
  autosaveConfig,
});
```

要求:

- 行为不变。
- 仍然保存 `reputationScore`、`quarterlyEvaluations`、`triggeredCheckpoints`。
- 不改变 localStorage key。

验收:

```bash
npm run build
npm run lint
npm test -- saveSystem
```

---

### 任务 R3-2: 抽离 game loop hook

负责人: GPT-5.5  
难度: 高  
风险: 高  
文件范围:

- `src/App.tsx`
- 新增 `src/hooks/useGameLoop.ts`
- `src/domain/gameEngine.ts`
- 相关 tests

当前位置:

- `src/App.tsx:198-390`

建议:

将以下内容移出 App:

- `handleRunSprint`
- `handleEventResolve`
- `executeSprint`
- 成就解锁处理
- 项目完成奖励状态计算
- pending team event resume

保留在 App 中:

- UI state
- props wiring
- modal open/close
- layout rendering

目标接口示例:

```ts
const gameLoop = useGameLoop({
  gameState,
  setGameState,
  selectedAgentIds,
  selectedProjectId,
  selectedStrategyId,
  setSelectedAgentIds,
  setLastResult,
  setToastQueue,
  setProjectCompleted,
  setProjectBonus,
  setNewlyUnlockedAgents,
});
```

注意:

第一轮可以接受 hook 参数多，不要过早引入复杂状态管理库。目标是先把业务流程从 JSX 文件移出。

验收:

```bash
npm test -- gameEngine achievement teamEvents resultReport
npm run build
npm run lint
```

---

### 任务 R3-3: 拆 UI 状态为局部 hooks

负责人: MiMo v2.5 Pro  
难度: 中  
风险: 中  
文件范围:

- `src/App.tsx`
- 新增 `src/hooks/useMobileNavigation.ts`
- 新增 `src/hooks/useGameSelection.ts`

建议拆出:

- selected agents/project/strategy
- activeMainSection
- activeMobileOverlay
- online/offline tracking

验收:

```bash
npm test -- responsiveNavigation mobileUxShell
npm run build
npm run lint
```

---

## 8. Phase 4 — `saveSystem.ts` 模块化抢救

目标: 降低 925 行存档大文件风险，为 v10 云同步做准备。

### 任务 R4-1: 拆迁移链

负责人: GPT-5.5  
协助: DeepSeek v4 Flash 补测试  
难度: 高  
风险: 高  
文件范围:

- `src/domain/saveSystem.ts`
- 新增 `src/domain/saveMigration.ts`
- `tests/saveSystem.test.ts`

建议移动:

- `migrateV2ToV3`
- `migrateV3ToV4`
- `migrateV4ToV5`
- `migrateV5ToV6`
- `migrateV6ToV7`
- `MIGRATION_CHAIN`
- `migrateSaveData`

要求:

- 对外行为不变。
- 旧测试必须全部通过。
- 不改存档格式。

验收:

```bash
npm test -- saveSystem
npm run build
npm run lint
```

---

### 任务 R4-2: 拆 checksum / metadata / indexes

负责人: MiMo v2.5 Pro  
难度: 中到高  
风险: 中  
文件范围:

- `src/domain/saveSystem.ts`
- 新增:
  - `src/domain/saveChecksum.ts`
  - `src/domain/saveMetadata.ts`
  - `src/domain/saveIndexes.ts`

建议:

先拆纯函数，避免动核心 `saveToSlot` / `loadFromSlot` 太多。

验收:

```bash
npm test -- saveSystem
npm run build
npm run lint
```

---

## 9. Phase 5 — `App.css` 模块化抢救

目标: 停止 3958 行全局 CSS 继续膨胀。

### 任务 R5-1: 拆 ResultReport 样式

负责人: Gemini 3.5 Flash  
难度: 中  
风险: 中  
文件范围:

- `src/App.css`
- `src/components/ResultReport.tsx`
- 新增 `src/components/ResultReport.css`

要求:

- 只移动 ResultReport 相关 class。
- 不改视觉效果。
- 不改 JSX 结构，除非 class 名不变。

验收:

```bash
npm run build
npm run lint
npm test -- resultReport
```

需要人工视觉抽查:

- 普通 sprint 结果
- 项目完成结果
- 季度结算结果
- 移动端结果面板

---

### 任务 R5-2: 拆移动端样式

负责人: Gemini 3.5 Flash  
协助: DeepSeek v4 Flash 清点 class  
难度: 中  
风险: 中  
文件范围:

- `src/App.css`
- `src/components/Mobile*.tsx`
- 新增 `src/components/mobile.css`

要求:

- 只移动 `.mobile-*` 相关样式和移动端 media 相关样式。
- 不重命名 class。
- 不改变断点。

验收:

```bash
npm test -- mobileUxShell responsiveNavigation
npm run build
npm run lint
```

---

### 任务 R5-3: 拆卡片样式

负责人: MiMo v2.5 Pro  
难度: 中  
风险: 低到中  
文件范围:

- `src/App.css`
- `src/components/AgentCard.tsx`
- `src/components/ProjectCard.tsx`
- `src/components/MobileAgentCard.tsx`
- `src/components/MobileProjectCard.tsx`

新增:

- `src/components/AgentCard.css`
- `src/components/ProjectCard.css`

验收:

```bash
npm run build
npm run lint
```

人工抽查:

- 桌面员工卡
- 桌面项目卡
- 移动员工卡
- 移动项目卡
- locked / selected / completed 状态

---

## 10. Phase 6 — 测试补强

目标: 不再只靠单元测试数字制造安全感。

### 任务 R6-1: 补完整游戏循环集成测试

负责人: DeepSeek v4 Flash  
协助: MiMo v2.5 Pro  
难度: 中  
风险: 低  
文件范围:

- 新增或扩展 `tests/gameEngine.test.ts`
- 可能新增 `tests/gameLoop.integration.test.ts`

覆盖流程:

1. 初始状态
2. 选择工程师
3. 执行 sprint
4. 项目进度增加
5. 资金扣除
6. 历史记录增加
7. 项目完成后奖励发放
8. 成就可能解锁
9. 季度结束触发记录

验收:

```bash
npm test -- gameEngine gameLoop
npm run lint
```

---

### 任务 R6-2: 补存档损坏和迁移测试

负责人: DeepSeek v4 Flash  
难度: 中  
风险: 低  
文件范围:

- `tests/saveSystem.test.ts`

新增用例:

- localStorage 中 JSON 损坏
- checksum 不匹配
- v2 裸 GameState 迁移
- v5 缺少 `quarterlyEvaluations`
- v6 缺少 `teamDynamics`
- 增量保存无变化时跳过
- 自动存档槽和手动槽互不污染

验收:

```bash
npm test -- saveSystem
npm run lint
```

---

### 任务 R6-3: 补 UI 关键路径测试

负责人: MiMo v2.5 Pro  
协助: Gemini 3.5 Flash  
难度: 中  
风险: 中  
文件范围:

- `tests/responsiveNavigation.test.tsx`
- `tests/mobileUxShell.test.tsx`
- `tests/tutorialGuide.test.tsx`
- 可能新增 `tests/appSmoke.test.tsx`

覆盖:

- 首次进入显示存档管理或新手引导
- 移动端 tab 切换
- 选择团队/项目/策略后按钮可执行
- ResultReport 渲染不崩

验收:

```bash
npm test -- responsiveNavigation mobileUxShell tutorialGuide appSmoke
npm run build
npm run lint
```

---

## 11. Phase 7 — handover 文档修正

目标: 让交接文档重新可信。

### 任务 R7-1: 修正项目状态文档

负责人: DeepSeek v4 Flash  
难度: 低  
风险: 低  
文件范围:

- `handover/project-status.md`
- `handover/README.md`
- `handover/module-status.md`

要求:

- 在 lint 修复前，不能写“lint 通过”。
- 明确 v9 是开发中，不是完成。
- 更新真实文件数量和测试数量。
- 标注抢救计划位置。

验收:

- 文档与实际命令结果一致。

---

### 任务 R7-2: 清理 team-config 中敏感运维信息

负责人: DeepSeek v4 Flash  
审核: GPT-5.5  
难度: 低  
风险: 中  
文件范围:

- `handover/team-config.md`

问题:

当前文件包含 agent/key 轮换、供应商和故障排查细节。即使 key 被截断，也不适合公开交接。

建议:

- 保留角色职责和协作方式。
- 移除 key 前缀、供应商 key 状态、具体环境变量修复方式。
- 如确需保留，迁移到私有运维文档，不放仓库。

验收:

- 文档不再包含 key 片段或具体 token 命名。

---

## 12. 推荐并发排期

### Wave 1: 止血并行

目标: lint 清零。

| Agent | 模型                | 任务                 | 文件所有权                              |
| ----- | ----------------- | ------------------ | ---------------------------------- |
| A     | MiMo v2.5 Pro     | R1-2 / R1-3 类型修复   | `ResultReport.tsx`, `gameState.ts` |
| B     | Gemini 3.5 Flash  | R1-1 Fast Refresh  | 3 个组件 + utils                      |
| C     | DeepSeek v4 Flash | R1-5 测试 lint       | tests                              |
| D     | GPT-5.5           | R1-4 + review 合并冲突 | `gameEngine.ts`                    |

合并门槛:

```bash
npm run lint
npm test
npm run build
```

---

### Wave 2: 核心风险修复

目标: 修确定性和季度逻辑割裂。

| Agent | 模型                | 任务                     | 文件所有权                        |
| ----- | ----------------- | ---------------------- | ---------------------------- |
| A     | GPT-5.5           | R2-1 RNG 修复            | `gameEngine.ts`, `random.ts` |
| B     | GPT-5.5 或 MiMo    | R2-2 季度结算入口            | quarter/finance/reputation   |
| C     | DeepSeek v4 Flash | R6-1/R6-2 补测试          | tests                        |
| D     | Gemini 3.5 Flash  | 暂停核心逻辑，准备 CSS class 清点 | 只读/文档                        |

注意:

R2-1 和 R2-2 都可能碰 `gameEngine.ts`，不要同时改同一个分支。可以先做 R2-1，再做 R2-2。

---

### Wave 3: App.tsx 拆分

目标: 降低上帝组件风险。

| Agent | 模型                | 任务                  | 文件所有权                       |
| ----- | ----------------- | ------------------- | --------------------------- |
| A     | MiMo v2.5 Pro     | R3-1 autosave hook  | `App.tsx`, `useAutosave.ts` |
| B     | GPT-5.5           | R3-2 game loop hook | `App.tsx`, `useGameLoop.ts` |
| C     | DeepSeek v4 Flash | 测试补强                | tests                       |
| D     | Gemini 3.5 Flash  | 暂不碰 App，做 CSS 拆分准备  | CSS 清点                      |

注意:

R3-1 和 R3-2 都改 `App.tsx`，不要真正同时落地。推荐先 R3-1 小拆，再 R3-2 大拆。

---

### Wave 4: CSS 和存档系统拆分

目标: 降低长期维护成本。

| Agent | 模型                | 任务                        | 文件所有权                |
| ----- | ----------------- | ------------------------- | -------------------- |
| A     | GPT-5.5           | R4-1 save migration 拆分    | save files           |
| B     | MiMo v2.5 Pro     | R4-2 checksum/metadata 拆分 | save files，需等 R4-1 后 |
| C     | Gemini 3.5 Flash  | R5-1/R5-2 CSS 拆分          | CSS + 组件样式           |
| D     | DeepSeek v4 Flash | R7 文档修正                   | handover             |

注意:

`saveSystem.ts` 拆分必须串行，不能两个 agent 同时改。

---

## 13. 风险矩阵

| 风险                       | 概率  | 影响  | 应对                       |
| ------------------------ | ---:| ---:| ------------------------ |
| 多 agent 改同一文件冲突          | 高   | 高   | 文件所有权锁定                  |
| lint 修复变成行为变化            | 中   | 中   | 每个 lint 修复必须跑对应测试        |
| App 拆分引入状态闭包 bug         | 中   | 高   | 先抽 autosave，再抽 game loop |
| 存档拆分破坏旧档加载               | 中   | 高   | 迁移测试先补强，再拆               |
| CSS 拆分造成视觉回归             | 高   | 中   | class 不重命名，人工抽查          |
| handover 再次失真            | 中   | 中   | 文档必须引用真实命令结果             |
| agent 为过 lint 添加 disable | 高   | 中   | 明确禁止，review 拦截           |

---

## 14. 每个 PR / 分支的交付模板

每个 agent 完成后必须在评论或交接中写:

```md
## 修改范围
- 改了哪些文件

## 解决的问题
- 对应 rescue task ID
- 修复了什么风险

## 未解决的问题
- 哪些问题留给后续任务

## 验证
- [ ] npm run lint
- [ ] npm test
- [ ] npm run build
- [ ] 相关局部测试: xxx

## 风险说明
- 是否改变运行时行为
- 是否改变存档格式
- 是否需要人工视觉检查
```

---

## 15. 最小抢救成功定义

如果时间有限，最低限度完成以下任务即可认为“抢救第一阶段成功”:

1. `npm run lint` 通过。
2. `Math.random()` 从核心 gameEngine 移除。
3. `App.tsx` 至少抽出 autosave hook。
4. `quarterlyEvaluations` 有明确类型。
5. handover 文档不再声称错误状态。
6. team-config 不再暴露 key/供应商运维细节。

达成后项目状态可调整为:

```text
核心 MVP 可运行，质量门禁恢复，局部石山已开始拆解，允许继续 v9 功能开发。
```

---

## 16. 不建议立刻做的事

这些事情看起来诱人，但当前不建议抢救期做:

1. 引入 Redux / Zustand 全局状态库。
   - 理由: 会扩大改动面；先用 hooks 拆分即可。
2. 全量重写 CSS 为 Tailwind。
   - 理由: 视觉回归风险高。
3. 重写存档格式。
   - 理由: 会破坏已有迁移链和测试。
4. 做后端服务。
   - 理由: 当前前端质量门禁未恢复，先别扩大战线。
5. 继续 v9 dashboard / player stats 大功能。
   - 理由: 这些功能会继续压到 `App.tsx` 和 `saveSystem.ts` 上。

---

## 17. 总结

这个项目当前不是无药可救，但已经出现自动 agent 高速堆功能后的典型结构风险。抢救重点不是“重写”，而是:

1. 先恢复质量门禁。
2. 再修核心确定性。
3. 然后拆最大的三个泥球:
   - `App.tsx`
   - `App.css`
   - `saveSystem.ts`
4. 最后补集成测试和修正文档。

高并发可以用，但必须按文件所有权和风险等级切任务。GPT-5.5 处理高风险架构和核心逻辑；MiMo v2.5 Pro 处理中等复杂度类型和组件整理；Gemini 3.5 Flash 处理 UI/CSS 和机械拆分；DeepSeek v4 Flash 处理测试补强、文档修正和静态清点。
