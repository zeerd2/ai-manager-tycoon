# Claude 4.8 Opus 入职说明

> 日期: 2026-05-31  
> 项目: AI Manager Tycoon  
> 角色: 高风险架构 / 复杂实现 / 审计型强执行者  
> 审查者: GPT-5.5

---

## 1. 你加入时的项目状态

AI Manager Tycoon 已完成一轮模块化抢救，当前处于 **v9 功能恢复阶段**。

当前质量基线：

```text
npm run lint  → 0 errors
npm run build → passed
npm test      → 当前目标基线 >= 414 tests
```

最近一次稳定收口基线是：

```text
414 passed / 24 files
```

随后 v9 恢复开发开始：

- GrokBuild 新增了 5 个 v9 成就
- MiMo 新增了 `playerStats` domain API 和 11 个测试
- GrokBuild 曾误缩减 `tests/achievement.test.ts`，后续已恢复到全量 `415 passed`
- 当前仍需 GrokBuild 更新恢复报告中的最新数据

---

## 2. 当前执行团队

| 模型 | 当前定位 |
|------|----------|
| Claude 4.8 Opus | 最高风险架构、复杂实现、重要审计 |
| GrokBuild | 核心逻辑、domain、复杂重构 |
| MiMo | 中风险 UI / domain 小功能 / CSS / 组件实现 |
| DeepSeek | 文档、测试、审计、覆盖报告 |
| GPT-5.5 | 只做审查、验收、风险拦截、任务分配 |

你不是来“随便接着写代码”的。你的优势应优先用在：

```text
1. 高风险设计审查
2. 跨模块一致性检查
3. 复杂功能实施前的 preflight review
4. 发现架构回退风险
5. 在明确批准后处理高难度实现
```

---

## 3. 项目核心规则

### 3.1 先预审，再改代码

任何涉及以下文件的任务，必须先写预审文档并等待 GPT-5.5 批准：

```text
src/App.tsx
src/domain/gameEngine.ts
src/domain/saveSystem.ts
src/domain/saveMigration.ts
src/domain/achievement.ts
src/hooks/useGameLoop.ts
```

### 3.2 不允许破坏质量基线

任何交付不得导致：

```text
lint 失败
test 数量异常下降
build 失败
测试被删除或削弱
```

尤其注意：此前刚发生过 `achievement.test.ts` 被误缩减的问题。你需要主动防止类似事故。

### 3.3 不要重新制造石山

禁止：

```text
继续往 App.tsx 堆业务逻辑
继续往 App.css 追加大段全局样式
随意修改 saveSystem.ts
为了过 lint 添加 eslint-disable
删除测试来让测试通过
未批准就 bump SAVE_VERSION
```

---

## 4. 已完成的重要抢救成果

### 4.1 App.tsx 拆分

已完成：

```text
src/hooks/useGameLoop.ts
src/hooks/useAutosave.ts
```

`App.tsx` 已从 855 行降到约 626 行。

后续新 UI 功能应优先通过独立组件挂载，避免重新污染 `App.tsx`。

### 4.2 saveSystem.ts 拆分

已完成：

```text
src/domain/saveMigration.ts
src/domain/saveMetadata.ts
```

`saveSystem.ts` 当前约 777 行。

尚未拆：

```text
saveChecksum.ts
```

但已经决定暂不继续拆 checksum，除非重新预审。

### 4.3 核心风险修复

已完成：

```text
RNG 确定性修复
季度展示双轨收敛
ResultReport quarterSettlement 优先级测试
v6→v7 直接迁移测试
```

---

## 5. 当前 v9 恢复状态

### 5.1 GrokBuild 当前事项

GrokBuild 已完成 G-2A 成就扩展恢复，当前报告数据需要更新：

```text
achievement.test.ts 当前测试数: 78
全量测试数: 415
lint: 0 errors
build: passed
```

文件锁暂时仍在：

```text
src/domain/achievement.ts
src/data/achievements.ts
tests/achievement.test.ts
```

### 5.2 MiMo 当前事项

MiMo 完成 Stage A：

```text
src/domain/playerStats.ts
tests/playerStats.test.ts
```

`calculatePlayerStats` 是纯函数：

```text
输入: GameState + totalAchievements
输出: PlayerStats
不持久化
不改 GameState
不改 SaveData
```

Stage B UI 暂未开始。

### 5.3 DeepSeek 当前事项

DeepSeek 当前待命，已完成：

```text
v9 backlog audit
WS-99 状态更新
module-status 修正
最终收口文档
迁移覆盖报告
```

---

## 6. 建议分配给你的第一个任务

你的第一个任务建议不是写代码，而是做高质量审计：

```text
handover/v9-current-implementation-review.md
```

目标：复核当前 v9 恢复实施是否安全。

必须检查：

```text
1. GrokBuild 新增的 5 个成就是否合理
2. achievement 测试恢复是否仍有覆盖缺口
3. MiMo 的 playerStats API 是否适合后续 PlayerDashboard
4. PlayerDashboard Stage B 是否安全
5. 是否存在重新污染 App.tsx / saveSystem.ts 的风险
6. 下一步应先补测试、做 UI，还是继续 domain
```

限制：

```text
只读 + 文档输出
不改 src
不改 tests
不改 handover 既有文件，除非明确要求
```

---

## 7. 你需要重点阅读的文档

优先读：

```text
handover/final-rescue-closeout.md
handover/v9-backlog-audit.md
handover/v9-feature-restart-plan.md
handover/v9-achievement-expansion-restoration-report.md
handover/v9-player-stats-dashboard-preparation.md
```

如要审查存档相关，再读：

```text
handover/migration-coverage-report.md
handover/wave4-savemigration-completion-report.md
```

如要审查 CSS/UI，再读：

```text
handover/r5-visual-checklist.md
```

---

## 8. 审查输出格式

请用以下格式提交你的第一份审计报告：

```md
# v9 当前实现审计报告

## 结论
PASS / CONDITIONAL PASS / FAIL

## 发现的问题
- 阻塞问题
- 非阻塞问题

## 对 GrokBuild 的建议

## 对 MiMo 的建议

## 对 DeepSeek 的建议

## 是否允许 MiMo 进入 PlayerDashboard Stage B
YES / NO / CONDITIONAL

## 是否建议先上传 GitHub checkpoint
YES / NO / CONDITIONAL
```

---

## 9. 当前 GitHub 上传节点

当前还没到最终上传点。建议等以下条件满足：

```text
1. GrokBuild 更新 restoration report 到 78 / 415
2. GPT-5.5 确认 G-2A restoration PASS
3. MiMo Stage A 保持通过
4. lint/build/test 全绿
```

之后可以上传一个 checkpoint：

```text
v9 achievement + playerStats domain checkpoint
```

暂不包含：

```text
PlayerDashboard UI Stage B
CompanyDashboard 集成
App.tsx 改动
saveSystem 改动
```

---

## 10. 总结

你加入时，项目已经从抢救期进入 v9 恢复期。现在最重要的不是高速写功能，而是防止恢复开发再次破坏刚修好的结构。

你的首要价值：

```text
高质量审计
复杂实现把关
发现测试/架构回退
在明确批准后承接高风险实现
```

请先完成 `v9-current-implementation-review.md`，再等待 GPT-5.5 审查。