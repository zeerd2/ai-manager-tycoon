# AI Manager Tycoon — Agent 工作指南

## ⚡ 核心原则：最小化 token 消耗

**每多读一个文件就多烧 token。读之前先问自己：这个文件跟我的任务相关吗？**

## 项目结构

```
src/
├── domain/          # 🧠 核心逻辑（游戏引擎、状态、计算）
│   ├── gameState.ts     # 游戏状态定义（所有类型在此）
│   ├── gameEngine.ts    # Sprint 执行引擎
│   ├── simulation.ts    # 模拟逻辑
│   ├── scoring.ts       # 评分计算
│   ├── rating.ts        # 等级评定
│   ├── achievement.ts   # 成就系统
│   ├── incident.ts      # 事件处理
│   ├── project.ts       # 项目/合同
│   ├── strategy.ts      # 策略
│   ├── skillTree.ts     # 技能树定义
│   ├── skillTreeLogic.ts # 技能树逻辑
│   ├── saveSystem.ts    # 存档系统
│   ├── comboIncident.ts # 组合事件
│   ├── random.ts        # 随机数
│   └── relations/       # 人际关系
├── components/      # 🎨 UI 组件（React）
├── data/            # 📊 静态数据（员工、项目、事件模板等）
├── utils/           # 🔧 工具函数
├── App.tsx          # 主界面
└── App.css          # 样式
tests/               # 🧪 Vitest 测试
```

## 按任务类型，只读相关文件

| 任务类型 | 必读 | 不要读 |
|---------|------|--------|
| **数据模型/类型定义** | `domain/gameState.ts` | components/*, App.tsx |
| **Sprint/游戏逻辑** | `domain/gameEngine.ts`, `domain/simulation.ts`, `domain/scoring.ts` | components/* |
| **成就系统** | `domain/achievement.ts`, `data/achievements.ts` | components/*, domain/gameEngine.ts |
| **事件系统** | `domain/incident.ts`, `data/incidentTemplates.ts` | components/* |
| **UI 组件** | 目标组件 + `domain/gameState.ts`(类型) | domain 其他文件 |
| **存档系统** | `domain/saveSystem.ts` | components/* |
| **技能树** | `domain/skillTree.ts`, `domain/skillTreeLogic.ts`, `data/skillTrees.ts` | components/* |
| **测试** | 目标文件 + 对应 .test.ts | 不要读不相关的测试 |
| **移动端适配** | `components/Mobile*.tsx` + `App.css` | domain/* |

## 命令效率

```bash
# ✅ 好：只看测试结果摘要
npm test 2>&1 | tail -20

# ❌ 差：读完整测试输出（几百行）
npm test 2>&1

# ✅ 好：只看 build 错误
npm run build 2>&1 | grep -E "error|Error"

# ❌ 差：读完整 build 输出
npm run build 2>&1
```

## 代码修改原则

1. **改一个文件前，先读它** — 但只读你要改的那个
2. **不要读整个代码库来"理解项目"** — issue 描述已经告诉你改哪里
3. **测试只跑相关的** — `npm test -- --grep "testName"` 比 `npm test` 省 90% token
4. **git diff 看自己改了什么** — 不要反复读原文件确认
5. **一次改完再提交** — 不要改一点测一点改一点测一点

## 常见浪费模式（禁止）

- ❌ 读 `App.tsx`（485行）然后只改了 `domain/` 下的一个文件
- ❌ 读 10 个文件来"了解项目架构" — issue 描述已经说了改哪里
- ❌ 跑 `npm test` 看全部 16 个测试文件 — 只跑相关的
- ❌ 读 `node_modules` 的任何东西
- ❌ 读 `CHANGELOG.md`、`README.md`（除非任务明确要求更新文档）

## 提交规范

```
git add -A && git commit -m "feat/fix/refactor: 简短描述"
git push origin main  # 或 feat/xxx 分支
```

完成后在 issue 评论里报告：改了哪些文件、跑了什么测试、结果如何。
