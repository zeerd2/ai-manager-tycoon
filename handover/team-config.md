# AI Agent 团队配置

## 团队结构

```
总监 (Hermes Agent)
├── 管理者 (Claude Opus) — 拆任务、review、合并
├── 执行者 A (Gemini Flash) — UI、辅助功能
├── 执行者 B (Gemini Flash) — 测试、辅助功能
├── 开发者 (GPT 5.5) — 核心功能开发
├── 实习生 (DeepSeek) — 数据、文档、格式化
├── 前端工程师 (MiMo Pro) — React 组件
├── 后端工程师 (MiMo Pro) — 游戏逻辑、数据层
├── 测试工程师 (MiMo Pro) — 测试、质量保障
└── 内容工程师 (MiMo Pro) — 文案、数据扩充
```

## 角色职责

### 总监 (Hermes Agent)
- **不写代码** — 只做调度和管理
- 分析问题、制定方案
- 监控团队状态
- 紧急情况处理

### 管理者 (Claude Opus)
- 拆分任务、创建 issue
- Review 代码
- 合并分支
- 技术决策

### 执行者 (Gemini Flash A/B)
- UI 组件开发
- 测试编写
- 辅助功能

### 开发者 (GPT 5.5)
- 核心功能开发
- 复杂逻辑实现
- 架构设计

### 实习生 (DeepSeek)
- 数据扩充
- 文档编写
- 代码格式化

### MiMo Pro 工程师
- 前端: React 组件、样式
- 后端: 游戏逻辑、数据模型
- 测试: 单元测试、集成测试
- 内容: 文案、事件模板

## 模型配置

| Agent | 模型 | Key | 状态 |
|-------|------|-----|------|
| 管理者 | mimo-v2.5-pro | Xiaomi A | 临时切换 |
| GPT 5.5 开发者 | mimo-v2.5-pro | Xiaomi A | 临时切换 |
| Gemini Flash A | mimo-v2.5-pro | Xiaomi A | 临时切换 |
| Gemini Flash B | mimo-v2.5-pro | Xiaomi B | 临时切换 |
| DeepSeek 实习生 | mimo-v2.5-pro | Xiaomi B | 临时切换 |
| MiMo Pro 前端 | mimo-v2.5-pro | Xiaomi A | 正常 |
| MiMo Pro 后端 | mimo-v2.5-pro | Xiaomi A | 正常 |
| MiMo Pro 测试 | mimo-v2.5-pro | Xiaomi A | 正常 |
| MiMo Pro 内容 | mimo-v2.5-pro | Xiaomi B | 正常 |

**⚠️ 注意:** 2026-05-27 CPA key 全部失效，所有 agent 临时切到 mimo-v2.5-pro。
原始配置应为：管理者/GPT5.5 用 CPA key，Gemini Flash 用 CPA key，DeepSeek 用 CPA key。

## Multica 配置

### Daemon
```bash
multica daemon start      # 启动
multica daemon stop       # 停止
multica daemon restart    # 重启
multica daemon status     # 状态
multica daemon logs -n 50 # 日志
```

### Issue 管理
```bash
multica issue list                    # 列出所有 issue
multica issue list --status todo      # 列出待办
multica issue list --status in_progress  # 列出进行中
multica issue create --title "..." --description "..." --assignee "agent:xxx"
multica issue update <id> --status done
multica issue comment add <id> --content "..."
```

### Agent 管理
```bash
multica agent list          # 列出所有 agent
multica agent get <id>      # 查看 agent 详情
multica agent update <id> --model mimo-v2.5-pro
multica agent update <id> --custom-env '{"ANTHROPIC_API_KEY":"xxx",...}'
```

## 分支规范

| Agent | 分支前缀 | 示例 |
|-------|---------|------|
| 前端工程师 | feat/frontend- | feat/frontend-achievement-dashboard |
| 后端工程师 | feat/backend- | feat/backend-player-stats |
| 测试工程师 | feat/qa- | feat/qa-integration-tests |
| 内容工程师 | feat/content- | feat/content-achievement-copy |
| 开发者 | feat/v9- | feat/v9-save-migration |
| 执行者 | feat/ui- | feat/ui-prototype |

## Key 轮换

Xiaomi Key A (tp-ceyp...): 6 个 agent
Xiaomi Key B (tp-c00t...): 3 个 agent

触发任务时注意轮换，不要只用一个 key。

## 故障排查

### Agent 全部 idle
1. 检查 daemon: `multica daemon status`
2. 检查 key: 看 daemon logs 有无 401
3. 检查内存: `free -h`

### Agent 反复失败
1. 看 issue comments: `multica issue comment list <id>`
2. 检查 API key 是否有效
3. 检查模型是否支持

### 内存爆满
1. `ps aux | grep claude | wc -l` — 进程数
2. `kill` 多余进程
3. `multica daemon restart`

### 全局 settings.json 覆盖
- 症状: agent 配了 Xiaomi key 但实际走 CPA
- 修复: 清空 `~/.claude/settings.json` 的 env
- 验证: daemon logs 看实际用的 key

## Cron Jobs

### 巡检 (暂停中)
- 每 15 分钟检查 agent 状态
- 自动 rerun 失败任务
- 检查内存使用

### 看门狗 (暂停中)
- 每 5 分钟检查 daemon
- 自动重启挂掉的 daemon
