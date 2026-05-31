# WS-102 动画 / 交互原型预审文档

> 编写人: MiMo v2.5 Pro
> 编写日期: 2026-05-29
> 审查人: GPT-5.5
> 状态: 预审提交

---

## 一、当前动画状态

### 已有动画

| 组件 | 动画 | 实现方式 | 状态 |
|------|------|----------|------|
| AchievementToast | 入场/退出（translateX + opacity） | CSS transition | ✅ 已有 |
| AgentCard | hover 边框变色 + 阴影 | CSS transition | ✅ 已有 |
| AgentCard | 选中状态高亮 | CSS transition | ✅ 已有 |
| ProjectCard | hover + shimmer 进度条 | CSS animation | ✅ 已有 |
| ResultReport | 数值脉冲（pulse） | CSS animation | ✅ 已有 |
| Overwork-warning | 闪烁 | CSS animation | ✅ 已有 |
| Lock-icon | 晃动 | CSS animation | ✅ 已有 |

### 缺失动画

| 组件 | 缺失动画 | 优先级 |
|------|----------|--------|
| PlayerDashboard | 展开/折叠过渡 | 高 |
| AchievementCard | 解锁状态高亮脉冲 | 中 |
| StatItem | hover/focus 微交互 | 低 |

---

## 二、动画范围

### 优先级 P0：PlayerDashboard 展开/折叠

**当前问题：** 展开/折叠是瞬间切换，无过渡动画。

**方案：** CSS max-height 过渡

```css
.player-dashboard-content {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.2s ease, margin-top 0.3s ease;
}

.player-dashboard-content.expanded {
  max-height: 500px;
  opacity: 1;
  margin-top: 16px;
}
```

**修改文件：**
- `src/components/PlayerDashboard.css`（新增过渡样式）
- `src/components/PlayerDashboard.tsx`（添加 expanded class 切换）

**风险：** 低。纯 CSS 过渡，不影响逻辑。

### 优先级 P1：AchievementCard 解锁高亮

**当前问题：** 已解锁和未解锁的样式差异不够醒目。

**方案：** 解锁卡片添加脉冲光晕

```css
.achievement-card.unlocked {
  animation: achievement-glow 2s ease-in-out infinite alternate;
}

@keyframes achievement-glow {
  from { box-shadow: 0 0 5px rgba(0, 255, 136, 0.2); }
  to { box-shadow: 0 0 15px rgba(0, 255, 136, 0.4); }
}
```

**修改文件：**
- `src/App.css`（achievement-card 相关区域，或拆出 AchievementPanel.css）

**风险：** 低。纯 CSS 动画。

### 优先级 P2：StatItem hover 微交互

**当前问题：** 统计项无 hover 反馈。

**方案：** hover 时背景微变

```css
.stat-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 4px;
}
```

**修改文件：**
- `src/components/PlayerDashboard.css`

**风险：** 极低。

---

## 三、是否只改 CSS？

**是，优先只改 CSS。**

| 改动 | 类型 | 涉及逻辑 |
|------|------|----------|
| PlayerDashboard 展开过渡 | CSS + 少量 class 切换 | 否 |
| AchievementCard 高亮 | CSS | 否 |
| StatItem hover | CSS | 否 |

如果需要 class 切换（如 expanded），改动量极小（1 行 JSX + 1 行 CSS class）。

---

## 四、是否涉及各组件？

| 组件 | 涉及 | 说明 |
|------|------|------|
| PlayerDashboard | ✅ | 展开/折叠过渡 |
| AchievementToast | ❌ | 已有完整动画，不需改动 |
| AchievementPanel | ✅ | 解锁卡片高亮（可选） |
| CompanyDashboard | ❌ | 不涉及 |
| AgentCard | ❌ | 已有完整动画 |
| ProjectCard | ❌ | 已有完整动画 |

---

## 五、是否涉及移动端？

**需要考虑，但不需要专门适配。**

- PlayerDashboard 的展开/折叠过渡在移动端同样生效（CSS transition 跨端兼容）
- AchievementCard 高亮在移动端同样生效
- 移动端 PlayerDashboard 已有 768px 响应式（单列布局）

---

## 六、文件锁申请

### 优先修改

```
src/components/PlayerDashboard.css
src/components/PlayerDashboard.tsx（仅 class 切换）
```

### 可选修改（需审批）

```
src/App.css（achievement-card 区域，或拆出独立 CSS）
src/components/AchievementPanel.tsx（如需 class 调整）
```

### 禁止修改

```
src/App.tsx
src/domain/*
src/hooks/*
存档逻辑
业务逻辑
```

---

## 七、测试计划

### 自动化测试

| 测试 | 说明 |
|------|------|
| `playerDashboard.test.tsx` | 验证 expanded class 切换 |
| `achievement.test.ts` | 不涉及（纯 CSS 改动） |

### 人工视觉检查

| 检查项 | 说明 |
|--------|------|
| PlayerDashboard 展开过渡 | 平滑展开，无跳帧 |
| PlayerDashboard 折叠过渡 | 平滑收起，无跳帧 |
| AchievementCard 解锁高亮 | 光晕动画循环，不刺眼 |
| StatItem hover | 微妙背景变化 |
| 移动端展开/折叠 | 同样平滑 |

---

## 八、实施计划

### Step 1：PlayerDashboard 展开/折叠过渡

1. 修改 `PlayerDashboard.css`：添加 max-height + opacity 过渡
2. 修改 `PlayerDashboard.tsx`：添加 `expanded` class 到 content div
3. 更新 `playerDashboard.test.tsx`：验证 class 切换
4. 验证：lint + test + build

### Step 2：AchievementCard 高亮（可选，需审批）

1. 在 `App.css` 或新建 `AchievementPanel.css` 中添加脉冲动画
2. 验证：lint + build

### Step 3：StatItem hover

1. 修改 `PlayerDashboard.css`：添加 hover 样式
2. 验证：lint + build

---

## 九、风险评估

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| max-height 过渡在内容高度不确定时可能跳帧 | 低 | 低 | 使用足够大的 max-height 值 |
| CSS 动画性能 | 极低 | 极低 | 使用 transform/opacity，触发 GPU 加速 |
| 移动端动画卡顿 | 极低 | 极低 | 现代浏览器 CSS transition 性能足够 |

---

*等待 GPT-5.5 审查批准后执行。*
