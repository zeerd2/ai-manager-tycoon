# 存档迁移覆盖报告

> 编写: DeepSeek v4 Flash | 2026-05-29  
> 用途: 为 GrokBuild 的 Wave 3A（`saveMigration.ts` 拆分）提供覆盖基线  
> 当前基线: `npm test → 24 files / 414 tests / lint 0 / build ✓`
> R4-1 状态: ✅ GrokBuild 已完成，GPT-5.5 已审查通过
> R4-2 状态: ✅ MiMo 已完成（saveMetadata），GPT-5.5 已审查通过
> saveSystem.ts 当前行数: 777（拆分前约 950）

---

## 迁移链结构

```
migrateSaveData()
  ├── 处理裸 v2 GameState（无 version/gameState 包装）
  └── migrateV2ToV3()  →  v2→v3: skillTrees, relationships, achievements, projectHistory
  └── migrateV3ToV4()  →  v3→v4: version bump
  └── migrateV4ToV5()  →  v4→v5: quarterlyEvaluations, reputationScore, triggeredCheckpoints
  └── migrateV5ToV6()  →  v5→v6: teamDynamics, performanceHistory, strategyPreferences
  └── migrateV6ToV7()  →  v6→v7: checksum, baseVersion, delta
```

---

## 逐场景覆盖

| # | 场景 | 文件 | 测试名 | 覆盖 |
|---|------|------|--------|------|
| 1 | 裸 v2 GameState → v7 | `saveSystem.test.ts` | `migrate raw v2 GameState` | ✅ |
| 2 | v2 带 version 包装 → v7 | `saveSystem.test.ts` | `migrate old v2 structure to v7` | ✅ |
| 3 | v3 → 完整迁移链 → v7 | `saveSystem.test.ts` | `handle v3 save migrating through full chain` | ✅ |
| 4 | v4 → v7 + 默认 v8/v9/v10 字段 | `saveSystem.test.ts` | `migrate old v4 save to v7` | ✅ |
| 5 | v4 字段在迁移后保留 | `saveSystem.test.ts` | `preserve existing v4 fields after v7 migration` | ✅ |
| 6 | v5 → v7 + 计算 v9 字段 | `saveSystem.test.ts` | `migrate v5 save to v7 with calculated v9 fields` | ✅ |
| 7 | v5 缺少 quarterlyEvaluations | `saveSystem.test.ts` | `migrate v5 save without quarterlyEvaluations` | ✅ |
| 8 | v5 旧存档 → slot 1（首次） | `saveSystem.test.ts` | `migrate old save format to slot 1 if empty` | ✅ |
| 9 | v5 旧存档 → slot 1（已占用→跳过） | `saveSystem.test.ts` | `should not overwrite slot 1` | ✅ |
| 10 | v6 缺少 teamDynamics | `saveSystem.test.ts` | `migrate v6 save without teamDynamics` | ✅ |
| 11 | checksum 存储 | `saveSystem.test.ts` | `include checksum in saved data` | ✅ |
| 12 | checksum 不匹配 → 尝试恢复 | `saveSystem.test.ts` | `detect checksum mismatch and attempt recovery` | ✅ |
| 13 | 损坏 JSON → loadFromSlot 抛错 | `saveSystem.test.ts` | `throw on corrupted JSON` | ✅ |
| 14 | 损坏 JSON → validateSlot 无效 | `saveSystem.test.ts` | `return invalid for corrupted JSON` | ✅ |
| 15 | 损坏旧存档 → checkAndMigrate 安全跳过 | `saveSystem.test.ts` | `handle corrupted old save` | ✅ |
| 16 | version 过旧（≤1）→ 验证拒绝 | `saveSystem.test.ts` | `error on version too old` | ✅ |
| 17 | 未来 version（99）→ 警告但通过 | `saveSystem.test.ts` | `warn on future version` | ✅ |
| 18 | 未知 version → 强制到 SAVE_VERSION | `saveSystem.test.ts` | `force unknown version` | ✅ |
| 19 | v6→v7 直接迁移（独立测试） | `saveSystem.test.ts` | `migrate full v6 save to v7` | ✅ R4-1 已补 |
| 20 | 空数据 → null | `saveApi.integration.test.ts` | `return null for slots that were never saved` | ✅ |
| 21 | 备份后删除 → 备份不可恢复 | `saveSystem.test.ts` | `delete backup when slot is deleted` | ✅ |
| 22 | 黑盒 save→load→delete 生命周期 | `saveApi.integration.test.ts` | 21 tests 整体覆盖 | ✅ |

---

## 缺口分析

### 所有迁移场景已覆盖

R4-1（GrokBuild）已补齐唯一的 v6→v7 直接迁移测试。当前 22 个场景全部覆盖，无缺口。

---

## 文件引用

- `tests/saveSystem.test.ts` — 主要迁移测试（~99 tests）
- `tests/saveApi.integration.test.ts` — 黑盒 API 安全网（21 tests）
- `src/domain/saveSystem.ts` — 迁移函数位于 L704-831

---

## 对 GrokBuild 的提示（Wave 3A）

- 迁移函数 (`migrateV2ToV3` … `migrateV6ToV7`) 使用 `any` 类型且有 `eslint-disable`
- 拆分到 `saveMigration.ts` 时可以趁机移除 eslint-disable（用 `unknown` + 类型收窄替换）
- `migrateSaveData` 的 final return block 包含多层默认值——拆分时注意保留所有 fallback 逻辑
- 以上 22 个场景的测试在拆分后不得改动，应全部通过
