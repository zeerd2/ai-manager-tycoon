# v9 Backlog 清点报告

> 编写: DeepSeek v4 Flash | 2026-05-29  
> 基线: lint 0 / 414 tests / build ✅  
> 数据来源: `task-history.md` / `roadmap.md` / `module-status.md` / 文件系统

---

## 1. 已完成 v9 项

| Issue | 标题 | 交付物 | 状态 |
|-------|------|--------|------|
| WS-100 | 成就文案扩充 | `src/data/achievements.ts` 成就文案 | ✅ |
| WS-101 | 存档版本迁移 | `src/domain/saveMigration.ts` + 迁移链 | ✅ |
| WS-107 | 成就边界和存档迁移测试 | `tests/achievement.test.ts` (100 expect) | ✅ |

**抢救期间自动完成但未分配 Issue 的：**

| 交付物 | 说明 | 状态 |
|--------|------|------|
| `src/domain/quarterSettlement.ts` | 季度结算统一入口 | ✅ |
| `src/domain/saveMetadata.ts` | 存档元数据提取纯函数 | ✅ |
| `tests/quarterSettlement.test.ts` (5 tests) | 季度结算单元测试 | ✅ |
| `tests/gameLoop.integration.test.ts` (16 tests) | 游戏循环集成测试 | ✅ |
| `tests/saveApi.integration.test.ts` (21 tests) | 存档黑盒 API 安全网 | ✅ |
| lint 清零 / `as any` 清零 / handover 同步 | 质量门禁恢复 | ✅ |

---

## 2. 未完成 v9 项

| Issue | 标题 | 优先级 | 所需文件 | 当前状态 |
|-------|------|--------|----------|----------|
| WS-98 | 玩家统计 API 与成就解锁逻辑 | **P0** | `src/domain/playerStats.ts`, `src/domain/achievementUnlock.ts` | ❌ 未开始 — 文件不存在 |
| WS-97 | 成就系统展示与玩家数据仪表盘 | **P0** | `src/components/PlayerDashboard.tsx`, `src/components/AchievementPanel.tsx` 扩展 | ❌ 未开始 — PlayerDashboard.tsx 不存在 |
| WS-99 | v8 季度目标与声望系统集成测试 | P1 | `tests/` 增量 | ⚠️ **部分已覆盖**（见下） |
| WS-102 | v9 新功能交互原型与动画 | P1 | 动画效果、过渡、手势反馈 | ❌ 未开始 |
| WS-103 | 成就系统与存档迁移 E2E 测试 | P1 | `tests/` 增量 | ❌ 未开始 |

### WS-99 已覆盖分析

抢救期新增的相关测试：

| 抢救测试 | 覆盖的 WS-99 场景 |
|----------|-------------------|
| `quarterSettlement.test.ts` | 季度目标通过/失败、多季度 |
| `gameLoop.integration.test.ts` | Q1 KPI 通过/失败、非季度无 KPI |
| `resultReport.test.tsx` | 季度复盘渲染、quarterSettlement 优先级 |

**结论：WS-99 核心场景已覆盖，不需要额外写测试。** 可将 WS-99 降级或标记为 done。

---

## 3. 被抢救期冻结的项

以下任务在抢救期间（Phase 0-7）被暂停，现可恢复：

| Issue | 标题 | 冻结原因 | 是否阻塞 |
|-------|------|----------|----------|
| WS-98 | 玩家统计 API | 属于新功能开发 | 否 |
| WS-97 | 成就仪表盘 | 属于新功能开发 | 否 |
| WS-102 | 交互原型 | 属于新功能开发 | 否 |
| WS-103 | E2E 测试 | 属于新增测试 | 否 |

**所有冻结项均可解冻。**

---

## 4. 高风险项

| Issue | 风险 | 说明 |
|-------|------|------|
| WS-97 仪表盘 | **中** | 如果往 `App.tsx` 堆代码会退化为上帝组件；必须用现有 hooks 体系 |
| WS-98 playerStats | **低** | 纯 domain 逻辑，不涉及 UI，风险可控 |
| WS-103 E2E | **低** | 新增测试文件，不修改业务代码 |
| WS-102 动画 | **低** | CSS/组件级修改，不涉及 core domain |
| WS-99 剩余 | **低** | 已基本覆盖，无需额外工作 |

---

## 5. 可直接恢复的低风险项

以下项安全级别最高，可直接恢复开发：

| 优先级 | Issue | 理由 |
|--------|-------|------|
| 🟢 | WS-98 `playerStats.ts` | 纯 domain，可独立测试，不影响现有逻辑 |
| 🟢 | WS-98 `achievementUnlock.ts` | 纯 domain，已有 `achievement.ts` 做基础设施 |
| 🟢 | WS-102 动画 | CSS/组件级，不影响 core |
| 🟢 | WS-99 标记完成 | 已覆盖，只需更新 handover 状态 |
| 🟢 | WS-103 可推迟 | 等 WS-97/98 完成后自然补 |

---

## 6. 需要 GrokBuild 预审的项

| Issue | 预审原因 |
|-------|----------|
| WS-98 `playerStats.ts` / `achievementUnlock.ts` | domain 逻辑，可能影响 achievement 检查边界；必须确认不碰 `saveSystem.ts` / `gameEngine.ts` 主流程 |
| WS-97 `PlayerDashboard.tsx` | **必须确认**不往 `App.tsx` 堆代码、使用已有的 `useGameLoop` 上下文 |
| WS-97 `AchievementPanel.tsx` 扩展 | 可能涉及 hooks 接口变更 |

### 预审 checklist

```markdown
- [ ] 新组件是否使用独立文件？
- [ ] 是否通过 props 或 context 获取数据（不使用 App.tsx 中间变量）？
- [ ] 是否不修改 saveSystem.ts / gameEngine.ts 核心逻辑？
- [ ] 是否补充对应的单元测试？
```

---

## 推荐执行顺序

```
Week 1: WS-98 (playerStats + achievementUnlock)  →  纯 domain，无 UI 耦合
Week 2: WS-97 (PlayerDashboard + AchievementPanel) →  GrokBuild 预审后开始
Week 3: WS-102 (动画)                              →  与 WS-97 并行
Week 4: WS-103 (E2E 测试)                          →  WS-97/98 完成后
        WS-99 标记完成 (文档更新)                     →  随时
```

---

## 依赖关系

```
WS-98 (playerStats + achievementUnlock)
  └──→ WS-97 (PlayerDashboard + AchievementPanel)
         └──→ WS-103 (E2E 测试)
WS-100 (已完成) ──→ WS-102 (动画)
WS-99 (已覆盖) — 独立
```

---

*本报告由 DeepSeek v4 Flash 编写。*
