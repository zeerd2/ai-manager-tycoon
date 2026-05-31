# v9 Player Stats Dashboard 预审文档

> 编写人: MiMo v2.5 Pro
> 编写日期: 2026-05-29
> 审查人: GPT-5.5
> 状态: 预审提交

---

## 一、当前状态

### 现有代码

- `playerStats` API：**不存在**（WS-98 尚未实现）
- `PlayerDashboard` 组件：**不存在**
- `CompanyDashboard`：已有基础仪表盘（资金、评级、声望、信心、成就、回合数）

### 可用的 GameState 数据

| 字段 | 类型 | 可用于统计 |
|------|------|-----------|
| `funds` | number | 资金变化趋势 |
| `sprintCount` | number | 总回合数 |
| `completedProjectIds` | string[] | 完成项目数 |
| `history` | SprintResult[] | 历史数据（进度、Bug、花费、士气变化） |
| `reputation` | number | 当前声望 |
| `confidence` | number | 当前信心 |
| `agents` | Agent[] | 团队规模、技能分布 |
| `unlockedAchievementIds` | string[] | 成就解锁率 |

### SprintResult 历史数据可计算的统计

| 统计项 | 计算方式 |
|--------|----------|
| 总进度 | `sum(history.map(h => h.progressDelta))` |
| 总 Bug | `sum(history.map(h => h.bugsDelta))` |
| 总技术债 | `sum(history.map(h => h.techDebtDelta))` |
| 总花费 | `sum(history.map(h => h.cost))` |
| 平均士气变化 | `avg(history.map(h => h.moraleDelta))` |
| 最佳 Sprint | `max(history.map(h => h.progressDelta))` |
| 灾难 Sprint 数 | `history.filter(h => h.progressDelta === 0).length` |
| 项目完成率 | `completedProjectIds.length / projects.length` |

---

## 二、依赖关系

### 前置依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| WS-98 playerStats API | **未实现** | 需要 domain 层提供统计计算函数 |
| GameState 结构 | 已有 | 可直接从 history 计算 |
| CompanyDashboard | 已有 | 可作为挂载点 |

### 建议实现顺序

1. **先实现 domain 层**：`src/domain/playerStats.ts`（纯函数，计算统计数据）
2. **再实现 UI 层**：`src/components/PlayerDashboard.tsx`（展示统计数据）
3. **最后集成**：在 `CompanyDashboard` 中引入 `PlayerDashboard`

---

## 三、方案设计

### 方案 A：嵌入 CompanyDashboard（推荐）

```
CompanyDashboard
├── 现有仪表盘（资金、评级、声望、信心、成就、回合）
└── PlayerDashboard（新增，折叠面板）
    ├── 概览统计（总进度、总花费、总Bug）
    ├── 趋势图表（最近 N 回合的进度/花费趋势）
    └── 团队统计（平均技能、总工作回合）
```

**优点：**
- 不改 App.tsx
- 不新增顶层组件
- 复用 CompanyDashboard 的布局

**缺点：**
- CompanyDashboard 体积增大

### 方案 B：独立面板

```
App.tsx
└── PlayerDashboard（新增独立面板）
```

**优点：**
- 完全独立，不影响 CompanyDashboard

**缺点：**
- 需要改 App.tsx（违反禁止事项）
- 增加 App.tsx 复杂度

**结论：采用方案 A**

---

## 四、文件规划

### Domain 层

| 文件 | 说明 |
|------|------|
| `src/domain/playerStats.ts` | 统计计算纯函数 |

### UI 层

| 文件 | 说明 |
|------|------|
| `src/components/PlayerDashboard.tsx` | 统计面板组件 |
| `src/components/PlayerDashboard.css` | 样式（CSS 模块化） |

### 测试

| 文件 | 说明 |
|------|------|
| `tests/playerStats.test.ts` | 统计函数单元测试 |
| `tests/playerDashboard.test.tsx` | 组件渲染测试 |

---

## 五、PlayerStats API 设计

```ts
// src/domain/playerStats.ts

export interface PlayerStats {
  // 概览
  totalSprints: number;
  totalProjectsCompleted: number;
  totalFundsSpent: number;
  totalProgress: number;
  totalBugs: number;
  totalTechDebt: number;

  // 平均值
  avgProgressPerSprint: number;
  avgCostPerSprint: number;
  avgMoraleDelta: number;

  // 记录
  bestSprintProgress: number;
  worstSprintProgress: number;
  disasterSprintCount: number; // progressDelta === 0

  // 团队
  currentTeamSize: number;
  avgTeamSkill: number;
  totalSprintsWorked: number;

  // 效率
  progressPerFund: number; // totalProgress / totalFundsSpent
  bugsPerProject: number;  // totalBugs / totalProjectsCompleted

  // 成就
  achievementCount: number;
  achievementRate: number; // unlocked / total
}

export function calculatePlayerStats(
  gameState: GameState,
  totalAchievements: number
): PlayerStats
```

---

## 六、测试计划

### playerStats.test.ts

| 测试 | 说明 |
|------|------|
| 空历史返回零值 | history=[] 时所有统计为 0 |
| 单次 Sprint 统计正确 | 1 条历史记录的计算 |
| 多次 Sprint 累加正确 | 多条历史记录的累加 |
| 灾难 Sprint 计数 | progressDelta === 0 的计数 |
| 最佳/最差 Sprint | max/min progressDelta |
| 效率指标 | progressPerFund 计算 |
| 成就率 | unlocked / total |

### playerDashboard.test.tsx

| 测试 | 说明 |
|------|------|
| 渲染概览统计 | 包含总进度、总花费 |
| 渲染团队统计 | 包含团队规模 |
| 空历史不崩溃 | history=[] 时正常渲染 |
| 数据来源正确 | 传入 mock GameState 验证数值 |

---

## 七、样式文件

新建 `src/components/PlayerDashboard.css`：

- 复用现有 CSS 变量（`--bg-card`, `--border`, `--text-h` 等）
- 使用与 CompanyDashboard 一致的卡片风格
- 响应式：768px 以下单列布局
- 不修改 App.css

---

## 八、文件锁申请

### 申请锁定

```
src/components/CompanyDashboard.tsx（添加 PlayerDashboard 引用）
src/components/PlayerDashboard.tsx（新建）
src/components/PlayerDashboard.css（新建）
src/domain/playerStats.ts（新建）
tests/playerStats.test.ts（新建）
tests/playerDashboard.test.tsx（新建）
```

### 不修改

```
src/App.tsx
src/App.css
src/domain/gameState.ts
src/domain/saveSystem.ts
```

---

## 九、风险评估

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| CompanyDashboard 体积增大 | 低 | 低 | 使用折叠面板，默认收起 |
| 统计计算性能 | 低 | 低 | history 通常 < 100 条，无性能问题 |
| CSS 样式冲突 | 低 | 低 | 使用独立 CSS 文件，命名空间隔离 |
| WS-98 前置依赖 | 中 | 中 | 本方案不依赖 WS-98，直接从 GameState 计算 |

---

## 十、与 WS-98 的关系

本方案**不依赖 WS-98**。

WS-98 可能涉及：
- 持久化统计数据到存档
- 跨会话统计
- 排行榜

本方案仅涉及：
- 从当前 GameState 实时计算
- 不持久化
- 不跨会话

如果 WS-98 后续实现，可将 `calculatePlayerStats` 替换为从存档读取预计算的统计数据。

---

*等待 GPT-5.5 审查批准后执行。*
