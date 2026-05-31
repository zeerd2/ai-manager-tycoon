# v9 成就系统扩展 改动前状态快照

> **创建模型**: GrokBuild  
> **创建日期**: 2026-05-29  
> **当前基线**: 414 tests / 24 files（lint 0 errors / build passed）  
> **任务**: G-2A 成就系统扩展  
> **本快照性质**: 零代码变更的精确现状记录，用于后续拆分/扩展的审查基准

---

## 1. 当前文件锁状态（已生效）

根据 GPT-5.5 指示，G-2A 阶段 GrokBuild 独占以下文件：

- `src/domain/achievement.ts`
- `src/data/achievements.ts`
- `tests/achievement.test.ts`

**禁止修改**（G-2A 期间）：
- `src/hooks/useGameLoop.ts`
- `src/domain/gameEngine.ts`
- `src/domain/saveSystem.ts`
- `src/domain/saveMigration.ts`
- `src/App.tsx`

其他模型在 G-2A 期间不得修改上述锁定文件。

---

## 2. 当前成就系统核心状态

### 2.1 成就数据清单（共 16 个）

| id | name | conditionType | category | rarity |
|----|------|---------------|----------|--------|
| first-blood | 一血 | first_project_completed | project | common |
| bug-factory | Bug 批发商 | single_sprint_15_bugs | incident | common |
| under-budget | 勤俭持家 | complete_project_80_percent_funds | project | rare |
| team-wipe | 全员自闭 | all_agents_zero_morale | employee | legendary |
| 10x-company | 10x 神级公司 | three_projects_one_game | project | epic |
| speed-run | 速通狂魔 | project_in_5_sprints | project | rare |
| iron-man | 钢铁之躯 | agent_6_consecutive | employee | rare |
| penny-pincher | 葛朗台 | cheapest_agent_only | economic | epic |
| max-skill | 满级大佬 | agent_max_skills | employee | legendary |
| big-team | 人才济济 | six_agents_unlocked | employee | rare |
| talent-scout | 伯乐 | five_star_agent | employee | epic |
| legendary-project | 地狱难度通关 | complete_legendary_project | project | legendary |
| financial-freedom | 财务自由 | funds_reach_8000 | economic | common |
| big-spender | 散财童子 | spend_10000_funds | economic | common |
| survivor | 大难不死 | recover_from_bugs | incident | rare |
| murphy-law | Murphy 定律 | fifty_bugs_total | incident | common |

### 2.2 当前支持的 conditionType 清单（共 16 个）

1. first_project_completed
2. single_sprint_15_bugs
3. complete_project_80_percent_funds
4. all_agents_zero_morale
5. three_projects_one_game
6. project_in_5_sprints
7. agent_6_consecutive
8. cheapest_agent_only
9. agent_max_skills
10. six_agents_unlocked
11. five_star_agent
12. complete_legendary_project
13. funds_reach_8000
14. spend_10000_funds
15. recover_from_bugs
16. fifty_bugs_total

### 2.3 checkAchievement 实现概况

- 位置：`src/domain/achievement.ts:48-144`
- 实现方式：大型 switch 语句，根据 `achievement.conditionType` 分支判断
- 所有分支均基于 `AchievementContext` 进行只读判断
- 无副作用，纯函数

### 2.4 getAchievementProgress 实现概况

- 位置：`src/domain/achievement.ts:148-297`
- 为大部分成就提供 `current / target` 进度数据
- 部分成就返回 `null`（如 cheapest_agent_only 在某些情况下）
- 同样为纯函数，不修改状态

---

## 3. AchievementContext 当前结构（精确）

```ts
interface AchievementContext {
  completedProjectIds: string[];
  currentSprintBugs?: number;
  fundsRemaining: number;
  totalFundsSpent: number;
  agents: Array<{
    morale: number;
    locked: boolean;
    salary?: number;
    consecutiveSprints?: number;
    skills?: { coding, debugging, architecture, creativity, speed };
  }>;
  sprintCount: number;
  projectsInOneGame: number;
  history: Array<{ bugsDelta: number; progressDelta: number; cost?: number }>;
  cheapestAgentOnly?: boolean;
}
```

**重要**：该上下文目前不包含任何 v9 字段（teamDynamics、performanceHistory、strategyPreferences）。

---

## 4. 拟新增 4~6 个成就的最终列表（本轮建议）

根据 GPT-5.5 指示，优先选择低风险、**零 context 扩展**的成就。以下为计划新增的 5 个：

| 建议 id | name（建议中文名） | 建议 conditionType | 依据的现有字段 | 是否需要扩展 AchievementContext | 风险等级 | 备注 |
|---------|--------------------|--------------------|----------------|----------------------------------|----------|------|
| long-run-survivor | 长期经营者 | long_run_survivor | sprintCount | 否 | 低 | 建议 >= 20 sprint |
| efficient-project | 高效执行者 | efficient_project | history（progressDelta / cost） | 否 | 低 | 高进度低成本项目 |
| fast-unlock | 快速扩张 | fast_unlock_rate | sprintCount + unlocked agents | 否 | 低 | 较短时间内解锁较多员工 |
| bug-survivor-streak | Bug 耐受专家 | consecutive_high_bug_sprints | history | 否 | 低 | 连续多轮产生较高 bugs 仍完成项目 |
| stable-team | 团队稳定 | no_morale_crash_in_n_sprints | agents.morale + history | 否 | 低 | 连续多轮无全员低士气 |

**确认**：以上 5 个成就全部基于当前 `AchievementContext` 即可判断，**无需扩展 context**，也无需改动存档格式。

---

## 5. 当前测试基线

- `tests/achievement.test.ts`：**88 个测试用例**
- 全量测试基线：**414 passed / 24 files**
- 成就相关测试目前主要覆盖：
  - 所有现有 16 个成就的 `checkAchievement` 正反例
  - 多数成就的 `getAchievementProgress` 计算
  - 部分边界场景

---

## 6. 高风险点记录

1. **checkAchievement switch 膨胀风险**：当前已 16 项，第一批新增建议严格控制在 4~6 个。
2. **context 与实现一致性**：新增成就必须同步更新 `getAchievementProgress`（如需支持进度条）。
3. **测试覆盖**：每个新 conditionType 必须有独立的 checkAchievement 测试。
4. **零 context 扩展承诺**：本次快照明确承诺不扩展 `AchievementContext`，任何新成就若发现必须扩展字段，需在实施前重新提交预审。

---

## 7. 进入代码修改前的门槛

**只有在 GPT-5.5 明确审查通过本 `v9-achievement-expansion-prechange-snapshot.md` 之后**，GrokBuild 才能开始修改以下文件：

- `src/domain/achievement.ts`
- `src/data/achievements.ts`
- `tests/achievement.test.ts`

在获得批准前，**所有相关文件保持只读**。

---

**快照结束**

*本文档记录了改动前的精确状态，作为 G-2A 成就系统扩展的唯一基准。*

*GrokBuild 已完成本阶段任务，等待 GPT-5.5 审查与下一步指令。*