# 项目当前状态

## 构建状态

| 检查项 | 状态 | 详情 |
|--------|------|------|
| TypeScript 编译 | ✅ 通过 | `npx tsc -b` 无错误 |
| Vite 构建 | ✅ 通过 | `npx vite build` 成功 |
| 单元测试 | ✅ 414/414 | 24 个测试文件全部通过 |
| ESLint | ✅ 通过 | 0 lint 错误 |

## 代码统计

| 目录 | 文件数 | 说明 |
|------|--------|------|
| src/domain/ | 21 | 核心游戏逻辑（状态、引擎、计算、存档、迁移） |
| src/components/ | 22 | React UI 组件 |
| src/data/ | 9 | 静态数据（员工、项目、事件、成就） |
| src/utils/ | 1 | 工具函数 |
| src/hooks/ | 2 | React hooks（useAutosave, useGameLoop） |
| tests/ | 24 | 单元测试和集成测试 |
| **总计** | **61 源文件** | **~7,900 行 TS/TSX 源码，不含 CSS** |

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2.1 | UI 框架 |
| TypeScript | 6.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| Vitest | 4.x | 单元测试 |
| ESLint | 10.x | 代码规范 |

## 运行方式

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器 (http://localhost:5173)
npm run build      # 构建生产版本
npm test           # 运行测试 (414 个用例)
npm run lint       # 代码检查
```

## 抢救状态

**核心抢救目标已完成。** 详见 [final-rescue-closeout.md](final-rescue-closeout.md)。

恢复 v9 功能开发的前置条件已满足（CONDITIONAL YES），剩余非阻塞遗留项已记录在 closeout 报告中。

## 已知问题

1. **无后端** — 纯前端应用，数据存 localStorage
2. **无部署配置** — 没有 Dockerfile / CI/CD 配置
3. **国际化不完整** — v7 做了 i18n 框架但部分文案仍是中文硬编码
4. **移动端适配** — v6 重构了交互，但部分细节未打磨
