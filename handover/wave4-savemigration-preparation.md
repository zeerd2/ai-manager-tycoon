# Wave 4 — saveMigration.ts 拆分 前置准备与执行计划

> **准备模型**: GrokBuild  
> **准备日期**: 2026-05-29  
> **审查对象**: GPT-5.5  
> **前置状态**: Wave 3（useGameLoop 拆分）已获得 GPT-5.5 最终 PASS  
> **当前基线**: lint 0 errors / 413 tests passed / build passed

---

## 1. 当前阶段状态确认

根据 GPT-5.5 2026-05-29 最终审查结论：
- **Wave 3**: PASS（useGameLoop 拆分完成，lint 0 errors，413 tests 全绿）
- **G3 文件锁**: 已解除（useGameLoop / App.tsx 相关）
- **当前基线**: 必须使用 **413 tests**（不得引用更早数字）
- **下一步指令**: "YES — 可以准备 R4-1 `saveMigration.ts` 拆分预审文档"

**尚未满足最终恢复 v9 开发的最低条件**，因此暂时不进入 Wave 5 收口。

**下一执行重点**：saveSystem.ts 结构化拆分，优先抽取版本迁移链逻辑。

---

## 2. 本阶段任务目标

**核心任务**：将 `src/domain/saveSystem.ts` 中负责“版本迁移与存档格式演进”的逻辑抽取为独立的 `saveMigration.ts`（或 `saveMigrationLogic.ts`）模块。

**第一版目标**（按 three-agent-rescue-plan 描述 + GPT-5.5 要求）：
- 迁移版本迁移链（MIGRATION_CHAIN + migrateV2ToV3 ~ migrateV6ToV7）
- 迁移 `migrateSaveData` 主调度函数
- 迁移 `normalizeReputationFields` 等与版本相关的辅助逻辑
- 迁移旧版 v2 存档检测与迁移入口（`checkAndMigrateOldSave` 相关逻辑）
- 保持 `SAVE_VERSION` 常量与公共 API 签名 100% 不变

**严格禁止引入**：
- 任何 SAVE_VERSION 版本号变更
- 任何存档 JSON 结构变更（SaveData 字段增删、重命名）
- 任何 localStorage key 格式变更（SLOT_KEY_PREFIX、OLD_SAVE_KEY 等）
- 任何运行时行为或迁移顺序的改变

**不引入**：
- 新状态管理库
- 大规模重构 saveSystem 内部其他模块（索引、增量保存、fallback storage 等第一版暂缓）

---

## 3. 当前 saveSystem.ts 架构快照（改动前精确状态）

### 3.1 文件规模与测试基线
- `src/domain/saveSystem.ts`：约 948 行（单文件 monolith）
- 相关测试：
  - `tests/saveSystem.test.ts`：1203 行（核心单元测试）
  - `tests/saveApi.integration.test.ts`：329 行（集成/端到端场景）
  - `tests/useAutosave.test.ts`：15 行（轻量）
  - **合计约 1547 行保存相关测试**，必须 100% 保持绿

### 3.2 核心导出与公共 API（当前使用方依赖）
**App.tsx 直接使用**（第 9-14 行）：
```ts
import {
  saveToSlot,
  deleteSlot,
  getAutosaveConfig,
  setAutosaveConfig
} from './domain/saveSystem';
```
另通过 `useAutosave` hook 间接使用。

**SaveManager.tsx 重度直接使用**（第 2-13 行）：
```ts
import {
  MANUAL_SLOTS,
  AUTO_SLOT,
  SAVE_VERSION,
  getSaveSlotsMetadata,
  saveToSlot,
  loadFromSlot,
  deleteSlot,
  checkAndMigrateOldSave,
  isFallbackStorageActive,
  validateSlot
} from '../domain/saveSystem';
```
**类型依赖**：SaveMetadata、AutosaveConfig、SaveValidationResult 等。

**useAutosave.ts 使用**：
- `AUTO_SLOT`、`getSaveSlotMetadata`、`getSlotDisplayName`、`saveToSlot`

**当前公共 API 必须 100% 保持兼容**（第一版拆分红线）。

### 3.3 版本迁移链现状（本阶段核心迁移目标）
当前 `saveSystem.ts` 内存在以下私有/半私有迁移函数（约 160 行）：

```ts
// 迁移函数（带 eslint-disable @typescript-eslint/no-explicit-any）
function migrateV2ToV3(oldData: any): any { ... }  // v3: relationships, achievements, projectHistory
function migrateV3ToV4(oldData: any): any { ... }  // 仅版本号提升
function migrateV4ToV5(oldData: any): any { ... }  // v5: quarterlyEvaluations, reputationScore, triggeredCheckpoints
function migrateV5ToV6(oldData: any): any { ... }  // v6: teamDynamics, performanceHistory, strategyPreferences
function migrateV6ToV7(oldData: any): any { ... }  // v7: checksum, baseVersion, delta（增量保存）

const MIGRATION_CHAIN: Array<(data: any) => any> = [
  migrateV2ToV3, migrateV3ToV4, migrateV4ToV5, migrateV5ToV6, migrateV6ToV7
];
```

**主迁移入口**：
- `migrateSaveData(oldData: any): SaveData`（第 786 行起）—— 逐步调用链 + 原始 v2 GameState 兜底 + 最终字段补全
- `loadFromSlot` 内自动调用：`if (!data.version || data.version < SAVE_VERSION || !data.gameState) { return migrateSaveData(data); }`

**旧版 v2 存档迁移**：
- `checkAndMigrateOldSave()` + `OLD_SAVE_KEY = 'ai_manager_tycoon_save_v2'`

**其他版本相关辅助**：
- `normalizeReputationFields`
- `calculateTeamDynamics` / `calculatePerformanceHistory`（v6 迁移时使用）

### 3.4 建议迁移到 `saveMigration.ts` 的内容
| 类别 | 当前位置 | 说明 |
|------|----------|------|
| MIGRATION_CHAIN 常量 | saveSystem.ts 内部 | 版本迁移函数数组 |
| migrateV2ToV3 ~ migrateV6ToV7 | 同上 | 各版本差异处理 |
| migrateSaveData | 同上 | 主调度 + 原始数据兜底 + 最终字段规范化 |
| normalizeReputationFields | 同上 | 声望字段归一化（v5 遗留） |
| checkAndMigrateOldSave 核心逻辑 | 同上 | 旧 v2 存档检测与导入 |
| calculateTeamDynamics / calculatePerformanceHistory | 同上 | v6 迁移依赖的统计函数 |
| 相关类型（若需内化） | SaveData 部分字段注释 | 迁移上下文 |

### 3.5 建议留在 saveSystem.ts 的内容（第一版）
- 所有公共 API（saveToSlot、loadFromSlot、deleteSlot、validateSlot 等）**保持导出签名不变**
- 索引系统（achievementIndex、statisticsIndex）
- 增量保存（delta / checksum）核心逻辑
- Fallback storage、缓存、localStorage 封装
- AutosaveConfig 读写
- 常量（SAVE_VERSION、SLOT_KEY_PREFIX 等）—— **必须留在原文件以保持向后兼容**
- `loadFromSlot` 内部调用迁移函数的“胶水代码”（通过重新导出或参数化注入）

**设计原则**：第一版优先“机械搬运”迁移链，**不追求完美解耦**。saveSystem.ts 仍可 import 新模块的迁移函数。

---

## 4. 文件锁定申请（GrokBuild 独占）

根据历史规则和高风险文件保护，**正式申请锁定以下文件**：

| 文件 | 锁定级别 | 理由 |
|------|----------|------|
| `src/domain/saveSystem.ts` | 独占（GrokBuild） | 当前最高风险文件，存档核心，禁止与其他模型并行修改 |
| `src/domain/saveMigration.ts`（新建） | 独占（新建） | 新迁移模块，由 GrokBuild 负责创建和迭代 |
| `tests/saveSystem.test.ts` | 最小必要修改权 | 核心 1203 行测试，可能需极少量 import 路径调整 |
| `tests/saveApi.integration.test.ts` | 最小必要 | 集成场景可能受影响 |
| `src/components/SaveManager.tsx` | 禁止修改（第一版） | 重度依赖公共 API，暂不触碰 |
| `src/hooks/useAutosave.ts` | 禁止修改（第一版） | 轻量消费者，保持不变 |

**申请期间其他模型禁止**：
- 任何模型修改 `src/domain/saveSystem.ts`
- 任何模型修改新建的 `saveMigration.ts`
- DeepSeek 仅可修改 `handover/*`（不得碰 save 相关源码）
- MiMo 仅可处理 CSS 相关文件（不得碰 save 相关源码）

---

## 5. 风险分析

| 风险 | 严重程度 | 缓解措施 |
|------|----------|----------|
| 迁移链 bug 导致老存档无法加载或数据损坏 | **极高** | 机械搬运 + 逐函数比对；**严禁**改变任何迁移逻辑或顺序；所有测试必须 100% 通过 |
| SAVE_VERSION 或 JSON 结构被意外修改 | **极高** | 准备文档明确红线；每次提交前用 `git diff` 检查 SAVE_VERSION 与 SaveData 接口 |
| SaveManager / useAutosave 因 import 路径变化而破裂 | 高 | 第一版不改这两个文件；saveSystem.ts 继续 re-export 必要符号 |
| 1547 行保存测试覆盖不足导致静默回归 | 高 | 拆分前确认基线 413 全绿；拆分中每阶段运行 `npm test -- save` 并记录 |
| 增量保存（v7 delta）与迁移链交互复杂 | 中 | 第一版暂不拆增量保存逻辑，留在 saveSystem.ts |
| lint 0 errors 硬性要求 | 中 | 迁移时同步清理 any（若有），避免新增 eslint-disable |

---

## 6. 验收标准（本阶段）

完成 saveMigration 拆分后必须满足：

1. `saveSystem.ts` 行数明显下降（迁移链 ~150-180 行被移除）
2. **新建 `saveMigration.ts`**（或同等命名），包含完整迁移链与调度逻辑
3. **SAVE_VERSION 保持 7**，`SaveData` 接口与所有 localStorage key 格式 100% 不变
4. 游戏核心行为完全不变（相同操作下状态与存档加载结果一致）
5. `npm run lint` → **0 errors**
6. `npm test -- save` → 所有保存相关测试全绿（~1547 行测试文件）
7. `npm test` 全量 → **413 passed**
8. `npm run build` → 通过
9. 关键集成测试 `saveApi.integration.test.ts` 保持全绿
10. 文档更新（handover 同步到 413 tests + 本次拆分说明）

**禁止**：
- 本阶段不要求把 saveSystem.ts 拆得非常干净
- 不改动 SAVE_VERSION / 存档 JSON 结构 / key 格式
- 不引入新状态管理库
- 不并行修改高风险文件

---

## 7. 禁止事项（本阶段）

1. 禁止在未获 GPT-5.5 批准前修改 `saveSystem.ts` 或新建迁移文件
2. 禁止扩大范围到其他 domain 文件（如 gameEngine、relations 等）
3. 禁止删除或大幅重构现有保存测试
4. 禁止改变任何迁移函数的内部逻辑或执行顺序
5. 禁止在迁移模块中引入 Redux/Zustand 或新依赖
6. 禁止并行修改高风险文件（saveSystem、SaveManager、useAutosave）

---

## 8. 执行路线建议（供 GPT-5.5 参考）

**推荐顺序**（与 GPT-5.5 最后指示一致）：
1. **GrokBuild**：立即产出本 `wave4-savemigration-preparation.md`
2. **GPT-5.5**：审查并给出 CONDITIONAL YES / 明确批准 + 任何额外边界澄清
3. **GrokBuild**：获得批准后，产出 `wave4-savemigration-prechange-snapshot.md`（改动前精确状态 + 13 步等价的迁移链执行顺序）
4. **GrokBuild**：分阶段最小改动实施拆分（每阶段提交完成报告，回答 GPT-5.5 要求的 7 个问题）
5. **GrokBuild**：最终产出 `wave4-savemigration-completion-report.md`
6. 完成后方可申请下一波次（如 Wave 5 收口或其他高风险模块）

---

## 9. GPT-5.5 审查请求

请 GPT-5.5 明确回复以下问题：

1. **文件锁定批准**  
   是否批准 GrokBuild 独占锁定 `src/domain/saveSystem.ts` + 新建 `src/domain/saveMigration.ts`（或同等命名）？是否同时锁定 `tests/saveSystem.test.ts` 和 `tests/saveApi.integration.test.ts` 的最小必要修改权？

2. **迁移范围边界**  
   文中列出的迁移范围（MIGRATION_CHAIN + migrateSaveData + 相关辅助 + 旧 v2 迁移）是否完整？是否有遗漏或必须提前/暂缓迁移的逻辑？

3. **公共 API 兼容性保证**  
   第一版要求 saveSystem.ts 继续 re-export 必要符号、SaveManager / useAutosave 零修改的策略是否可接受？是否有更严格的接口冻结要求？

4. **增量保存（v7 delta）处理**  
   增量保存逻辑是否应在第一版一并迁移，还是明确留在 saveSystem.ts 内部？

5. **执行顺序**  
   是否同意“先完成 saveMigration 拆分 + 所有测试全绿 + lint 0 + build 通过，再申请下一波次”的顺序？

6. **其他阻塞或建议**  
   在正式开始拆分前，是否还有其他必须澄清的边界、风险或验收附加条件？

---

## 10. 后续文档计划

获得 GPT-5.5 批准后，GrokBuild 将依次产出：
- `wave4-savemigration-prechange-snapshot.md`（改动前精确状态 + 迁移链执行顺序 + 风险点）
- 拆分执行计划（分阶段最小改动）
- 每阶段完成报告（按标准格式，回答 7 个问题）
- 最终 `wave4-savemigration-completion-report.md`

---

**文档结束**

*本准备文档旨在让 GPT-5.5 在不阅读全部 saveSystem.ts 的情况下，就能清晰判断边界、风险和锁定必要性。*

*GrokBuild 将严格等待 GPT-5.5 明确批准后，再开始任何 saveSystem.ts 代码修改。*
