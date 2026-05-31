# AI Agent 团队配置

## 团队结构

```
总监 (Hermes Agent)
├── 管理者 — 拆任务、review、合并
├── 执行者 A — UI、辅助功能
├── 执行者 B — 测试、辅助功能
├── 开发者 — 核心功能开发
├── 实习生 — 数据、文档、格式化
├── 前端工程师 — React 组件
├── 后端工程师 — 游戏逻辑、数据层
├── 测试工程师 — 测试、质量保障
└── 内容工程师 — 文案、数据扩充
```

## 角色职责

### 总监 (Hermes Agent)
- **不写代码** — 只做调度和管理
- 分析问题、制定方案
- 监控团队状态
- 紧急情况处理

### 管理者
- 拆分任务、创建 issue
- Review 代码
- 合并分支
- 技术决策

### 执行者
- UI 组件开发
- 测试编写
- 辅助功能

### 开发者
- 核心功能开发
- 复杂逻辑实现
- 架构设计

### 实习生
- 数据扩充
- 文档编写
- 代码格式化

### MiMo Pro 工程师
- 前端: React 组件、样式
- 后端: 游戏逻辑、数据模型
- 测试: 单元测试、集成测试
- 内容: 文案、事件模板

## 分支规范

| Agent | 分支前缀 | 示例 |
|-------|---------|------|
| 前端工程师 | feat/frontend- | feat/frontend-achievement-dashboard |
| 后端工程师 | feat/backend- | feat/backend-player-stats |
| 测试工程师 | feat/qa- | feat/qa-integration-tests |
| 内容工程师 | feat/content- | feat/content-achievement-copy |
| 开发者 | feat/v9- | feat/v9-save-migration |
| 执行者 | feat/ui- | feat/ui-prototype |

---
> **注**: 模型配置、API key 管理、部署运维等敏感信息已从本仓库移除。
> 如需相关配置，请联系项目管理员获取私有运维文档。
