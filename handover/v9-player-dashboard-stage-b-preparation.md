# v9 Player Dashboard Stage B 预审文档（升级版）

> 编写人: MiMo v2.5 Pro
> 编写日期: 2026-05-29
> 审查人: GPT-5.5 / Claude
> 状态: 预审提交

---

## 一、当前状态

### Stage A 状态

```text
src/domain/playerStats.ts: 已完成
tests/playerStats.test.ts: 11 tests passed
全量测试: 待恢复（当前 345，预期 414+）
```

### 前置依赖

| 依赖 | 状态 | 说明 |
|------|------|------|
| Stage A playerStats API | ✅ 已完成 | `calculatePlayerStats` 纯函数 |
| 全量测试基线 | ⏳ 待恢复 | 等 Claude 修完 P1 |
| `getAchievementProgress` | ✅ 已存在 | `src/domain/achievement.ts` |
| `efficient_project` 成就 | ✅ 已存在 | `src/data/achievements.ts` |

---

## 二、Claude 审计要求回应

### 1. PlayerDashboard 是否展示 efficient_project 相关数据？

**方案：展示成就进度摘要，不单独展示 efficient_project。**

PlayerDashboard 展示的是玩家整体统计，不是单个成就详情。`efficient_project` 的进度已在 `AchievementPanel` 中展示。

PlayerDashboard 中可展示：
- 成就解锁率：`unlockedAchievementIds.length / achievements.length`
- 总成就数：`achievements.length`

不展示单个成就进度（那是 AchievementPanel 的职责）。

### 2. 是否依赖 getAchievementProgress？

**不直接依赖。**

PlayerDashboard 使用 `calculatePlayerStats`（Stage A），其中 `achievementCount` 和 `achievementRate` 仅依赖 `unlockedAchievementIds.length` 和 `achievements.length`。

如果后续需要展示成就进度条，可引入 `getAchievementProgress`，但当前 MVP 不需要。

### 3. 如何避免 App.tsx 改动？

**在 CompanyDashboard 内嵌入 PlayerDashboard。**

```tsx
// CompanyDashboard.tsx
import { PlayerDashboard } from './PlayerDashboard';

export const CompanyDashboard = memo(function CompanyDashboard({ gameState }: Props) {
  return (
    <div className="company-dashboard-wrapper">
      <div className="company-dashboard">
        {/* 现有仪表盘 */}
      </div>
      <PlayerDashboard gameState={gameState} />
    </div>
  );
});
```

App.tsx 零修改。

### 4. 如何挂入 CompanyDashboard？

**直接在 CompanyDashboard 的 JSX 尾部添加。**

位置：`company-dashboard-wrapper` 内，`company-dashboard` 之后。

这样：
- 不改 App.tsx
- 不新增顶层面板
- 复用 CompanyDashboard 的布局上下文

### 5. 是否需要 achievement progress 缺口先修完？

**不需要。**

PlayerDashboard 的成就展示仅使用 `unlockedAchievementIds.length`，不使用 `getAchievementProgress`。

成就进度缺口（如 `efficient_project` 的进度追踪）是 `AchievementPanel` 的问题，不影响 PlayerDashboard。

### 6. 测试计划

详见下方第五节。

---

## 三、文件规划

### 允许修改

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/PlayerDashboard.tsx` | 新建 | 统计面板组件 |
| `src/components/PlayerDashboard.css` | 新建 | 样式文件 |
| `src/components/CompanyDashboard.tsx` | 修改 | 添加 PlayerDashboard 引用 |
| `tests/playerDashboard.test.tsx` | 新建 | 组件测试 |

### 禁止修改

| 文件 | 原因 |
|------|------|
| `src/App.tsx` | 违反禁止事项 |
| `src/App.css` | CSS 模块化，不污染全局 |
| `src/domain/saveSystem.ts` | 不涉及存档 |
| `src/domain/gameEngine.ts` | 不涉及游戏引擎 |

---

## 四、PlayerDashboard 组件设计

### Props

```ts
interface Props {
  gameState: GameState;
}
```

### 内部状态

```ts
const [expanded, setExpanded] = useState(false); // 默认折叠
```

### 数据来源

```ts
import { calculatePlayerStats } from '../domain/playerStats';
import { achievements } from '../data/achievements';

const stats = calculatePlayerStats(gameState, achievements.length);
```

### 展示内容

#### 概览区（始终可见）

| 指标 | 来源 | 格式 |
|------|------|------|
| 总回合数 | `stats.totalSprints` | 数字 |
| 完成项目 | `stats.totalProjectsCompleted` | 数字 |
| 总进度 | `stats.totalProgress` | 数字 |
| 成就解锁 | `stats.achievementCount / stats.achievementRate` | 数字 + 百分比 |

#### 详细区（展开后可见）

| 分组 | 指标 |
|------|------|
| 效率 | 平均进度/回合、平均花费/回合、进度/资金比 |
| 记录 | 最佳Sprint、最差Sprint、灾难Sprint数 |
| 团队 | 团队规模、平均技能、总工作回合 |
| Bug | 总Bug、Bug/项目比 |

### 折叠交互

```tsx
<div className="player-dashboard">
  <button className="player-dashboard-toggle" onClick={() => setExpanded(!expanded)}>
    📊 个人统计 {expanded ? '▼' : '▶'}
  </button>
  {expanded && (
    <div className="player-dashboard-content">
      {/* 详细统计 */}
    </div>
  )}
</div>
```

---

## 五、测试计划

### tests/playerDashboard.test.tsx

| 测试 | 说明 |
|------|------|
| 渲染概览统计 | 包含总回合、完成项目、总进度 |
| 渲染成就统计 | 包含成就解锁数 |
| 空历史不崩溃 | history=[] 时正常渲染 |
| 默认折叠 | 初始状态不显示详细统计 |
| 展开后显示详细统计 | 点击后显示效率/记录/团队 |
| 数据来源正确 | 传入 mock GameState 验证数值 |

---

## 六、样式设计

### PlayerDashboard.css

```css
.player-dashboard {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
}

.player-dashboard-toggle {
  background: transparent;
  border: none;
  color: var(--text-h);
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  width: 100%;
  text-align: left;
  padding: 8px 0;
}

.player-dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.stat-group h4 {
  color: var(--accent);
  font-size: 0.85rem;
  margin-bottom: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  padding: 4px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.stat-item .label { color: var(--text-dim); }
.stat-item .value { color: var(--text-h); font-weight: 600; }

@media (max-width: 768px) {
  .player-dashboard-content {
    grid-template-columns: 1fr;
  }
}
```

---

## 七、文件锁申请

### 申请锁定

```
src/components/PlayerDashboard.tsx
src/components/PlayerDashboard.css
src/components/CompanyDashboard.tsx
tests/playerDashboard.test.tsx
```

### 不修改

```
src/App.tsx
src/App.css
src/domain/saveSystem.ts
src/domain/gameEngine.ts
src/domain/playerStats.ts（Stage A 已完成，不修改）
```

---

## 八、验收标准

```bash
npm run lint        # 0 errors
npm test            # 全量通过（预期 414+）
npm run build       # 通过
```

完成报告必须回答：

```text
1. PlayerDashboard 是否展示 efficient_project 数据（否，仅展示整体成就率）
2. 是否依赖 getAchievementProgress（否）
3. 是否修改 App.tsx（否）
4. 如何挂入 CompanyDashboard（在 JSX 尾部添加）
5. 是否需要 achievement progress 缺口先修完（否）
6. 测试结果
```

---

## 九、执行顺序

1. **等待基线恢复**：全量测试从 345 恢复到 414+
2. **Step 1**：新建 `PlayerDashboard.css`
3. **Step 2**：新建 `PlayerDashboard.tsx`
4. **Step 3**：修改 `CompanyDashboard.tsx`（添加引用）
5. **Step 4**：新建 `tests/playerDashboard.test.tsx`
6. **验证**：lint + test + build

---

*等待 GPT-5.5 审查批准 + 基线恢复后执行。*
