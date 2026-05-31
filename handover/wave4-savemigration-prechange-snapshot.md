# Wave 4 — saveMigration.ts 改动前状态快照

> **创建模型**: GrokBuild  
> **创建日期**: 2026-05-29  
> **当前基线**: 413 tests / 24 files（lint 0 errors / build passed）  
> **锁定状态**: 已获得 GPT-5.5 指示，正式锁定 saveSystem 相关文件进行 R4-1 预审  
> **本快照性质**: 零代码变更的精确现状记录 + 迁移链执行顺序 + 公共 API + 常量 + 测试基线 + 风险点

---

## 1. 当前文件锁状态（已生效）

根据 GPT-5.5 指示与 three-agent-rescue-plan 规则，R4-1 阶段 GrokBuild 独占以下文件：

- `src/domain/saveSystem.ts`（独占）
- `src/domain/saveMigration.ts`（新建，独占）
- `tests/saveSystem.test.ts`（最小必要修改权）
- `tests/saveApi.integration.test.ts`（最小必要修改权）

其他模型限制：
- **DeepSeek**：仅可修改 `handover/*`
- **MiMo**：等待 R4-1 完成后接 R4-2，不得碰 saveSystem.ts 相关源码

**禁止**：任何模型在未获 GPT-5.5 批准前修改上述锁定文件。

---

## 2. 当前 saveSystem.ts 核心状态快照

### 2.1 文件规模
- `src/domain/saveSystem.ts`：约 948 行（单文件 monolith）
- 版本：当前最高支持 `SAVE_VERSION = 7`

### 2.2 版本迁移函数清单（当前实际存在）

| 序号 | 函数名                | 版本跨越 | 主要新增字段 |
|------|-----------------------|----------|--------------|
| 1    | migrateV2ToV3        | v2 → v3  | skillTrees, relationships, achievements, projectHistory |
| 2    | migrateV3ToV4        | v3 → v4  | 仅版本号提升（结构一致） |
| 3    | migrateV4ToV5        | v4 → v5  | quarterlyEvaluations, reputationScore, triggeredCheckpoints |
| 4    | migrateV5ToV6        | v5 → v6  | teamDynamics, performanceHistory, strategyPreferences |
| 5    | migrateV6ToV7        | v6 → v7  | checksum, baseVersion, delta（增量保存支持） |

**迁移链定义**（当前实际数组顺序）：
```ts
const MIGRATION_CHAIN: Array<(data: any) => any> = [
  migrateV2ToV3, // index 0
  migrateV3ToV4, // index 1
  migrateV4ToV5, // index 2
  migrateV5ToV6, // index 3
  migrateV6ToV7, // index 4
];
```

**注意**：所有迁移函数目前均带 `// eslint-disable-next-line @typescript-eslint/no-explicit-any`。

### 2.3 migrateSaveData 执行顺序（当前实际流程）

`migrateSaveData`（第 786 行起）是版本迁移的唯一入口，当前执行顺序如下：

1. 读取 `oldData.version || 2`
2. 若无 version 且无 gameState wrapper → 视为原始 v2 GameState，包装为 `{ version: 2, gameState: oldData, ... }`
3. **while 循环逐步升级**：
   - `currentVersion < SAVE_VERSION`
   - 计算 `migrationIndex = currentVersion - 2`
   - 调用 `MIGRATION_CHAIN[migrationIndex](migrated)`
   - 更新 currentVersion
4. 未知版本 → 警告 + 强制设置为 SAVE_VERSION 后 break
5. **最终字段规范化**（见 2.4）
6. 返回标准 SaveData

**关键**：迁移是**顺序的、逐步的**，不得跳步或改变顺序。

### 2.4 migrateSaveData 最终 fallback 字段清单（当前实际返回结构）

在 `migrateSaveData` 末尾（第 811-829 行），无论经过何种路径，最终都会执行以下完整字段补全：

```ts
return normalizeReputationFields({
  version: SAVE_VERSION,
  gameState: migrated.gameState || migrated,
  savedAt: migrated.savedAt || new Date().toISOString(),
  name: migrated.name,
  skillTrees: migrated.skillTrees || {},
  relationships: migrated.relationships || {},
  achievements: migrated.achievements || [],
  projectHistory: migrated.projectHistory || [],
  quarterlyEvaluations: migrated.quarterlyEvaluations || [],
  reputationScore: migrated.reputationScore ?? 0,
  triggeredCheckpoints: migrated.triggeredCheckpoints || [],
  teamDynamics: migrated.teamDynamics || { averageMorale: 0, totalFatigue: 0, averageLoyalty: 0 },
  performanceHistory: migrated.performanceHistory || {
    bestSprintProgress: 0,
    worstSprintProgress: 0,
    averageSprintProgress: 0,
    totalBugsCreated: 0,
    totalBugsFixed: 0
  },
  strategyPreferences: migrated.strategyPreferences || {},
  checksum: migrated.checksum,
  baseVersion: migrated.baseVersion,
  delta: migrated.delta,
});
```

**此对象即当前 v7 存档的“最小完整形态”**。任何迁移后的数据最终都必须满足此结构。

### 2.5 normalizeReputationFields 行为

```ts
function normalizeReputationFields(saveData: SaveData): SaveData {
  const reputationScore = saveData.reputationScore ?? saveData.gameState.reputationScore ?? 0;
  return {
    ...saveData,
    reputationScore,
    gameState: {
      ...saveData.gameState,
      reputationScore,
    },
  };
}
```

此函数在迁移链末尾和 loadFromSlot 中均会被调用，用于 v5 遗留的声望双轨问题。

---

## 3. saveSystem.ts 当前 Public Exports 完整清单

**常量**
- `SAVE_VERSION = 7`
- `MANUAL_SLOTS = ['1', '2', '3']`
- `AUTO_SLOT = 'auto'`

**接口 / 类型**
- `SaveMetadata`
- `SaveData`
- `SaveValidationResult`
- `AutosaveConfig`
- `AchievementIndex`
- `StatisticsIndex`

**函数（全部 export）**
- `getSlotDisplayName(slotId: string, name?: string): string`
- `resetStorageCheck(): void`
- `isFallbackStorageActive(): boolean`
- `restoreFromBackup(slotId: string): boolean`
- `getAutosaveConfig(): AutosaveConfig`
- `setAutosaveConfig(config: AutosaveConfig): void`
- `saveToSlot(...)`
- `loadFromSlot(slotId: string): SaveData | null`
- `getAchievementIndex(slotId: string): AchievementIndex | null`
- `getStatisticsIndex(slotId: string): StatisticsIndex | null`
- `isAchievementUnlocked(slotId: string, achievementId: string): boolean`
- `batchCheckAchievements(...)`
- `validateSlot(slotId: string): SaveValidationResult`
- `deleteSlot(slotId: string): void`
- `getSaveSlotMetadata(slotId: string): SaveMetadata | null`
- `getSaveSlotsMetadata(): SaveMetadata[]`
- `checkAndMigrateOldSave(): boolean`
- `validateSaveData(data: unknown): SaveValidationResult`
- `clearIndexCache(): void`
- `rebuildIndexes(slotId: string): void`

**内部未导出（供参考）**：
- MIGRATION_CHAIN
- 所有 migrateV*ToV* 函数
- migrateSaveData
- calculateDelta、createBackup、calculateChecksum 等私有辅助

---

## 4. localStorage Key 常量当前值（精确）

| 常量名                  | 当前值                                      | 用途 |
|-------------------------|---------------------------------------------|------|
| `SLOT_KEY_PREFIX`       | `'ai_manager_tycoon_save_slot_'`            | 存档位正文 |
| `AUTOSAVE_CONFIG_KEY`   | `'ai_manager_tycoon_autosave_config'`       | 自动存档配置 |
| `OLD_SAVE_KEY`          | `'ai_manager_tycoon_save_v2'`               | 旧版 v2 单存档（checkAndMigrateOldSave 使用） |
| `BACKUP_KEY_PREFIX`     | `'ai_manager_tycoon_backup_slot_'`          | 每槽位备份 |
| `INDEX_KEY_PREFIX`      | `'ai_manager_tycoon_index_'`                | 成就/统计索引 |

**红线**：R4-1 期间以上所有 key 字符串**不得改动**。

---

## 5. SAVE_VERSION 当前值

- `export const SAVE_VERSION = 7;`

**硬性要求**：整个 R4-1 阶段此常量值**必须保持为 7**，不得 bump 版本号。

---

## 6. 保存相关测试基线（当前精确）

- `tests/saveSystem.test.ts`：1203 行（核心单元测试，覆盖迁移、校验和、索引、增量保存等）
- `tests/saveApi.integration.test.ts`：329 行（端到端 save/load 场景）
- `tests/useAutosave.test.ts`：15 行（轻量）
- **保存相关测试总行数**：约 1547 行
- 全量测试基线：**413 passed / 24 files**

**当前迁移测试情况说明**：
- 迁移链主要通过 `loadFromSlot` + 构造旧版本数据进行间接测试
- 目前**没有**针对 `migrateV6ToV7` 的独立、直接的单元测试用例（v7 新增的 checksum/delta/baseVersion 多通过增量保存路径覆盖）
- `checkAndMigrateOldSave` 有对应测试场景

**是否需要补 v6→v7 直接迁移测试**：此问题留待 GPT-5.5 在审查本快照时明确指示。

---

## 7. 当前高风险点记录（供拆分参考）

1. **迁移链是最高风险区域**：任何顺序错误或字段丢失都会导致老存档无法加载或数据静默损坏。
2. `migrateSaveData` 内部存在大量 `any` + 复杂 fallback 逻辑，迁移时极易引入类型或行为回归。
3. `loadFromSlot` 是迁移的唯一调用入口，改动时必须保持其对迁移函数的调用方式不变。
4. `checkAndMigrateOldSave` 必须留在 saveSystem.ts（GPT-5.5 已明确）。
5. 增量保存（delta / checksum / baseVersion）的**运行时逻辑**必须留在 saveSystem.ts（第一版不拆）。
6. SaveManager.tsx 和 useAutosave.ts **零修改**，因此 saveSystem.ts 必须继续 re-export 所有当前公开符号。
7. 1547 行保存测试对任何行为变化都极其敏感，必须每阶段保持全绿。

---

## 8. R4-1 红线确认（本快照记录）

以下为本次快照时刻的硬性约束，任何后续拆分代码**不得违反**：

- SAVE_VERSION 必须保持 7
- SaveData 接口结构、字段语义、默认值规则不变
- 所有 localStorage key 常量字符串不变
- `checkAndMigrateOldSave` 及其调用逻辑留在 saveSystem.ts
- 增量保存的运行时逻辑（calculateDelta、delta 合并等）留在 saveSystem.ts
- SaveManager.tsx、useAutosave.ts 不得有任何修改
- 迁移函数内部逻辑与执行顺序**机械保留**，不得重构或优化

---

## 9. 进入代码修改前的最终门槛

**只有在 GPT-5.5 明确审查通过本 `wave4-savemigration-prechange-snapshot.md` 之后**，GrokBuild 才能开始以下工作：

- 创建 `src/domain/saveMigration.ts`
- 对 `src/domain/saveSystem.ts` 进行任何编辑
- 修改任何保存相关测试文件

在获得 GPT-5.5 “可以开始拆分”或等效明确批准前，**所有 saveSystem.ts 及新建迁移文件均保持只读**。

---

**快照结束**

*本文档记录了改动前的精确状态，作为 R4-1 拆分的唯一基准。*

*GrokBuild 已完成本阶段任务，等待 GPT-5.5 审查与下一步指令。*