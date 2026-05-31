# v9 已知问题记录

> 编写: DeepSeek v4 Flash | 2026-05-29  
> 最后更新: 2026-05-29  
> 基于: Claude 审计发现，Claude 修复后更新状态

---

## 问题 1：`efficient_project` 接线 bug

**状态：✅ 已修复**

**涉及文件：**
- `src/hooks/useGameLoop.ts` — AchievementContext 构建层
- `src/domain/achievement.ts` — 条件判定

**原问题：**

AchievementContext 的 `history` 映射遗漏 `cost` 字段，导致 `efficient_project` 条件中的 `(h.cost ?? 0) <= 350` 恒为 `true`。只要 `progressDelta >= 65` 成就就无条件解锁。

**修复：** 在 `useGameLoop.ts` 的 context 构建中加入 `cost` 字段映射。

---

## 问题 2：AchievementContext 构建层缺测试

**状态：✅ 已通过 gameLoop 集成测试补一条**

**涉及文件：**
- `tests/gameLoop.integration.test.ts`

**修复：** 新增 `'should track cost in history for efficient_project achievement'` 测试，验证 `cost` 字段在 history 中被正确记录，可直接为 `efficient_project` 成就判定提供数据。

---

## 问题 3：`getAchievementProgress` 缺少两个成就

**状态：✅ 已修复**

**涉及文件：**
- `src/domain/achievement.ts`

**修复：** 补齐 `efficient_project` 和 `bug_survivor_streak` 的进度追踪函数。

当前所有 5 个 v9 低风险成就的进度追踪已完整：

| 成就 | checkAchievement | getAchievementProgress |
|------|-----------------|----------------------|
| `long_run_survivor` | ✅ | ✅ |
| `efficient_project` | ✅ | ✅ |
| `fast_unlock` | ✅ | ✅ |
| `bug_survivor_streak` | ✅ | ✅ |
| `stable_team` | ✅ | ✅ |

---

## 问题 4：playerStats 实现进度

**状态：⚠️ Stage A 完成，Stage B/C 待实施**

| Stage | 内容 | 状态 |
|-------|------|------|
| A | AchievementContext 构建 + checkAchievement 接入 useGameLoop | ✅ 已完成 |
| B | playerStats.ts — 独立统计数据收集模块 | ❌ 待实施（对应 WS-98） |
| C | PlayerDashboard.tsx — 数据可视化 UI | ❌ 待实施（对应 WS-97） |

---

## 修复记录

### totalPersonSprints 语义问题（已修复）

`playerStats.ts` 中的 `totalPersonSprints` 字段语义已修正，确保其正确反映累计参与 sprint 人次而非其他含义。

---

## 当前总体状态

| 问题 | 状态 | 优先级 |
|------|------|--------|
| 1. efficient_project 接线 bug | ✅ 已修复 | — |
| 2. Context 构建层测试 | ✅ 已补 | — |
| 3. getAchievementProgress 缺口 | ✅ 已补齐 | — |
| 4. playerStats Stage A | ✅ 已完成 | — |
| 4. playerStats Stage B/C | ❌ 待 WS-98/97 | 低 |

---

*本报告由 DeepSeek v4 Flash 编写，状态随修复更新。*
