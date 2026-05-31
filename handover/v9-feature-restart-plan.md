# v9 功能恢复前架构确认计划（G-1）

> **执行模型**: GrokBuild  
> **创建日期**: 2026-05-29  
> **任务编号**: G-1  
> **目标**: 在恢复 v9 功能开发前，先进行架构级确认，避免将新逻辑直接塞回已清理的 App.tsx / saveSystem.ts 等核心文件。  
> **当前基线**: 414 tests / lint 0 errors / build passed（R4-1 完成）

---

## 1. 执行背景

经过 Wave 1~4 的架构抢救（useGameLoop 拆分 + saveMigration 拆分），核心高风险文件已完成初步解耦。

GPT-5.5 在 R4-1 通过后明确允许恢复 v9 功能开发，但要求在真正开始前先做一次“架构确认”，防止历史上的“直接堆功能”问题重演。

本任务（G-1）即为此确认阶段，**禁止直接修改代码**。

---

## 2. v9 待恢复功能清单（基于历史任务与现有数据结构）

根据 `task-history.md`、`roadmap.md`、`module-status.md` 以及当前代码中已预留的 v9 字段，推断 v9 计划中的主要功能如下：

| 编号 | 功能名称 | 历史任务编号 | 描述 | 状态（抢救前） |
|------|----------|--------------|------|----------------|
| V9-1 | 玩家统计仪表盘 (Player Stats Dashboard) | WS-97 | 展示 teamDynamics、performanceHistory、strategyPreferences 等聚合数据 | 原型阶段 |
| V9-2 | 团队动态可视化 | WS-97 延伸 | 基于 teamDynamics 展示团队士气、疲劳、忠诚度趋势 | 未实现 |
| V9-3 | 绩效历史分析 | WS-98 | 基于 performanceHistory 提供最佳/最差 Sprint、Bug 趋势等分析 | 未实现 |
| V9-4 | 策略偏好跟踪与推荐 | WS-98 | 记录玩家常用 strategy，并给出简单偏好分析 | 未实现 |
| V9-5 | 成就系统扩展展示 | WS-97 / WS-100 | 在现有成就面板基础上增加更丰富的解锁条件与文案 | 部分完成 |
| V9-6 | 存档格式最终固化（v9 版本号） | WS-101 | 将当前预留的 v9 字段正式纳入稳定存档格式，可能 bump SAVE_VERSION | 迁移链已就绪 |

**说明**：V9-1 ~ V9-4 是 v9 的核心“玩家数据大功能”，目前数据已在 SaveData 中持久化，但几乎没有消费端。

---

## 3. 每个功能会碰哪些文件（初步影响分析）

| 功能 | 预计涉及文件 | 是否涉及存档格式 | 是否涉及 App.tsx | 是否涉及 gameEngine | 是否涉及 saveSystem / saveMigration | 备注 |
|------|--------------|------------------|------------------|---------------------|-------------------------------------|------|
| V9-1 玩家统计仪表盘 | 新建 `components/PlayerStatsDashboard.tsx` + 可能修改 CompanyDashboard | 否（读已存字段） | 很可能（作为主面板之一） | 否 | 低（仅读取） | 高 UI 影响 |
| V9-2 团队动态可视化 | 新建或扩展 RelationsNetwork / 新组件 | 否 | 可能 | 否 | 低 | 可能与 Relations 组件复用 |
| V9-3 绩效历史分析 | 新建组件 + 可能扩展 HistoryPanel | 否 | 可能 | 否 | 低 | 依赖 SprintResult 历史 |
| V9-4 策略偏好跟踪 | 可能修改 StrategySelector + 新数据层 | 可能（需在 SaveData 增加记录结构） | 是 | 低 | 中（可能需在 saveSystem 增加偏好记录逻辑） | 风险较高 |
| V9-5 成就系统扩展 | `domain/achievement.ts` + AchievementPanel + 可能 data/achievements.ts | 可能（成就条件扩展） | 低 | 中（成就检查可能在 gameEngine 附近） | 低 | 已有基础 |
| V9-6 存档格式固化 | saveSystem.ts + saveMigration.ts | **是**（可能 bump 到 v8 或 v9） | 否 | 否 | **高** | 最高风险项 |

---

## 4. 是否涉及存档格式

- **当前状态**：SaveData 已包含 `teamDynamics`、`performanceHistory`、`strategyPreferences` 字段（自 v6/v7 起预留）。
- **V9-6 存档固化** 是唯一明确需要改动存档格式的功能。
- 其他功能（V9-1~V9-5）**原则上不应**再扩展 SaveData 结构，以避免再次触发大规模迁移链改动。

**建议**：在恢复 v9 前，必须先明确“v9 最终存档版本号是否需要 bump”这一决策。

---

## 5. 是否涉及 App.tsx

- V9-1（玩家统计仪表盘）最有可能直接修改 App.tsx（新增主面板或在 CompanyDashboard 旁边增加新区块）。
- V9-4（策略偏好）也可能轻微触碰 App.tsx 中的策略选择逻辑。
- **风险提示**：App.tsx 刚刚经历 useGameLoop 拆分，目前处于相对干净状态，应尽量避免重新把 v9 逻辑塞回主文件。

**建议**：任何新 v9 UI 功能，优先考虑新建独立组件 + 通过 props/context 注入，减少对 App.tsx 的直接侵入。

---

## 6. 是否涉及 gameEngine / saveSystem

| 模块 | 涉及程度 | 说明 |
|------|----------|------|
| `src/domain/gameEngine.ts` | 低 ~ 中 | 成就检查、季度结算等可能需要轻微扩展以支持新 v9 成就条件 |
| `src/domain/saveSystem.ts` | 低（V9-1~V9-5）<br>高（V9-6） | 仅 V9-6（存档固化）会显著修改 saveSystem |
| `src/domain/saveMigration.ts` | 低（V9-1~V9-5）<br>高（V9-6） | 同上，V9-6 可能需要新增迁移函数 |

**红线提醒**（当前 GrokBuild 禁止修改列表）：
- `src/App.tsx`
- `src/domain/saveSystem.ts`
- `src/domain/gameEngine.ts`
- `src/domain/saveMigration.ts`

除非先提交对应波次的预审文档并获得 GPT-5.5 批准。

---

## 7. 建议执行顺序

推荐按以下顺序逐步恢复 v9 功能（最小风险路径）：

1. **G-1（本任务）**：架构确认 + 文档固化（当前）
2. **G-2**：v9 存档格式最终决策（是否 bump SAVE_VERSION + 字段冻结）
3. **G-3**：V9-5 成就系统扩展（相对独立，风险较低）
4. **G-4**：V9-1 玩家统计仪表盘（新建组件，尽量不碰 App.tsx 核心）
5. **G-5**：V9-2 / V9-3 团队动态与绩效可视化
6. **G-6**：V9-4 策略偏好跟踪（此功能风险最高，建议最后做）
7. **G-7**：V9-6 存档格式固化 + 迁移链更新（必须在所有功能稳定后再做）

**原则**：UI 功能优先新建组件；存档格式改动必须最后做。

---

## 8. 风险分级

| 风险等级 | 功能 | 主要风险点 | 缓解建议 |
|----------|------|------------|----------|
| **高** | V9-6 存档格式固化 | 再次触发大规模迁移链改动、破坏已有 414 测试基线 | 必须最后做；单独开 wave 并提交 prechange snapshot |
| **高** | V9-4 策略偏好跟踪 | 可能污染 StrategySelector + 需要在 saveSystem 增加新逻辑 | 提前规划数据层边界，避免直接改 saveSystem |
| **中** | V9-1 玩家统计仪表盘 | 容易把大量逻辑塞回 App.tsx | 强制要求新建独立组件 + 使用 context/props |
| **中** | V9-2 / V9-3 可视化 | 与现有 RelationsNetwork、HistoryPanel 产生耦合 | 评估是否可复用现有组件 |
| **低** | V9-5 成就系统扩展 | 已有较好隔离 | 可作为 v9 恢复的第一个功能练手 |

---

## 9. 后续建议

- 本文档通过后，建议尽快推进 **G-2（v9 存档格式决策）**，以明确后续功能是否还能安全使用现有 SaveData 结构。
- 所有后续 v9 功能恢复，均应遵循“先提交预审文档 → 获得批准 → 再改代码”的三代理流程。
- 建议在恢复 v9 前，由 GPT-5.5 明确“v9 功能恢复的总负责人”分工（GrokBuild 主攻后端/架构？MiMo 主攻 UI？）。

---

**文档结束**

*本计划文档仅作架构确认与风险预判之用，不包含任何可执行代码变更。*