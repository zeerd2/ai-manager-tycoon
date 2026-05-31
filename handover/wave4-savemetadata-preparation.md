# R4-2 saveMetadata.ts 拆分预审文档

> 编写人: MiMo v2.5 Pro
> 编写日期: 2026-05-29
> 审查人: GPT-5.5
> 状态: 预审提交

---

## 一、当前基线

```text
npm run lint  → 0 errors
npm test      → 414 passed / 24 files
npm run build → passed
save tests    → 102 passed
```

---

## 二、当前 saveSystem.ts 中 metadata 相关函数清单

### 拟迁移到 saveMetadata.ts 的函数

| 函数 | 行号 | 说明 |
|------|------|------|
| `getSaveSlotMetadata(slotId)` | 625-644 | 获取单个存档位的元数据 |
| `getSaveSlotsMetadata()` | 647-657 | 获取所有存档位的元数据列表 |

### 拟迁移的类型/常量

| 名称 | 行号 | 说明 |
|------|------|------|
| `SaveMetadata` 接口 | 11-19 | 元数据类型定义 |
| `MANUAL_SLOTS` | 90 | 手动存档位 ID 列表 |
| `AUTO_SLOT` | 91 | 自动存档位 ID |

### 不迁移的依赖项（留在 saveSystem.ts）

| 名称 | 说明 | 理由 |
|------|------|------|
| `cachedGetItem()` | localStorage 缓存读取 | 底层存储工具，多处使用 |
| `getSlotKey()` | 存档 key 生成 | 被 save/load/delete 等多处使用 |
| `getSlotDisplayName()` | 存档位显示名 | 被 loadFromSlot 和 metadata 共用 |

---

## 三、行为保持策略

### getSaveSlotMetadata

```ts
// 当前签名（不变）
export function getSaveSlotMetadata(slotId: string): SaveMetadata | null
```

- 从 `saveMetadata.ts` 导出
- 内部调用 `cachedGetItem` 和 `getSlotKey`（从 saveSystem.ts 导入）
- 行为不变：解析 JSON、返回元数据或 null

### getSaveSlotsMetadata

```ts
// 当前签名（不变）
export function getSaveSlotsMetadata(): SaveMetadata[]
```

- 从 `saveMetadata.ts` 导出
- 内部调用 `getSaveSlotMetadata`（同文件）和 `MANUAL_SLOTS`/`AUTO_SLOT`（同文件）
- 行为不变：遍历所有槽位、收集元数据

### saveSystem.ts 重新导出

为保持 public API 兼容，`saveSystem.ts` 将重新导出：

```ts
export { getSaveSlotMetadata, getSaveSlotsMetadata } from './saveMetadata';
```

这样现有导入 `from './domain/saveSystem'` 的代码无需修改。

---

## 四、autosave 单槽读取不退化验证

### 涉及的 autosave 路径

`useAutosave.ts` 中的 autosave 逻辑调用：
- `saveToSlot()` — 留在 saveSystem.ts
- `loadFromSlot()` — 留在 saveSystem.ts
- `getAutosaveConfig()` — 留在 saveSystem.ts

**autosave 不直接调用 metadata 函数**，因此拆分不影响 autosave 读取行为。

### SaveManager.tsx 中的 metadata 使用

`SaveManager.tsx` 调用 `getSaveSlotsMetadata()` 来显示存档列表。由于 saveSystem.ts 重新导出该函数，SaveManager.tsx 无需修改。

---

## 五、public API 兼容声明

### 保持不变的导出

| 导出 | 来源 | 状态 |
|------|------|------|
| `SaveMetadata` | saveMetadata.ts → saveSystem.ts re-export | 不变 |
| `MANUAL_SLOTS` | saveMetadata.ts → saveSystem.ts re-export | 不变 |
| `AUTO_SLOT` | saveMetadata.ts → saveSystem.ts re-export | 不变 |
| `getSaveSlotMetadata` | saveMetadata.ts → saveSystem.ts re-export | 不变 |
| `getSaveSlotsMetadata` | saveMetadata.ts → saveSystem.ts re-export | 不变 |

### 不修改的文件

- `src/components/SaveManager.tsx` — 零修改
- `src/hooks/useAutosave.ts` — 零修改
- `src/App.tsx` — 零修改
- `src/domain/saveMigration.ts` — 零修改

---

## 六、文件锁申请

### 申请锁定

```
src/domain/saveSystem.ts
src/domain/saveMetadata.ts（新建）
tests/saveSystem.test.ts
tests/saveApi.integration.test.ts
```

### 暂不修改

```
src/domain/saveMigration.ts
src/components/SaveManager.tsx
src/hooks/useAutosave.ts
src/App.tsx
```

---

## 七、验证策略

### 自动化验证

```bash
npm run lint        # 0 errors
npm test            # 全量通过
npm run build       # 通过
npm test -- save    # save 相关测试全通过
```

### 兼容性验证

- `SaveManager.tsx` 中 `getSaveSlotsMetadata()` 调用不报错
- `useAutosave.ts` 中 autosave 读写不退化
- `checkAndMigrateOldSave()` 仍能正常工作

---

## 八、预计变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/domain/saveMetadata.ts` | 新建 | 包含 metadata 函数和类型 |
| `src/domain/saveSystem.ts` | 修改 | 删除 metadata 函数，添加 re-export |
| `tests/saveSystem.test.ts` | 可能 | 如果 metadata 测试需要调整导入 |

预计 saveSystem.ts 行数: 801 → ~760（-40 行）

---

*等待 GPT-5.5 审查批准后执行。*
