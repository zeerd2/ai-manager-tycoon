export function getTutorialStepText(
  sprintCount: number,
  selectedAgentCount: number,
  selectedProjectId: string | null,
  selectedStrategyId: string | null
): string | null {
  if (sprintCount >= 3) return null;
  if (sprintCount === 0) {
    if (selectedAgentCount === 0) {
      return '👉 第一步：请在下方【团队】面板中点击工程师卡片以选中他们（例如 Claude Opus 或 Gemini 3.5 Flash）。注意：每位选中的工程师会在回合结束时扣除相应的“薪资”。';
    } else if (!selectedProjectId) {
      return '👉 第二步：已选择工程师！现在请在【项目】面板中点击选择一个你想推进的项目。初次游玩推荐选择难度较低的“TODO App”。';
    } else if (!selectedStrategyId) {
      return '👉 第三步：已选择项目！现在请在【策略】面板中点击选择一种开发策略。初次游玩推荐选择“常规开发”。';
    } else {
      return '✨ 全部准备就绪！现在请点击页面最下方的【执行 Sprint】按钮来推进你团队的第一个回合！';
    }
  }
  if (sprintCount === 1) {
    if (selectedAgentCount === 0) {
      return '👉 第一步：请选择本回合参与工作的工程师。建议挑选之前未连续工作的工程师让他们轮流休息，这样能迅速清空他们的疲劳值！';
    } else if (!selectedProjectId) {
      return '👉 第二步：选择你想继续推进的项目。你可以继续做刚才那个，也可以开新项目，但建议专注先把“TODO App”开发完以获取奖励资金。';
    } else if (!selectedStrategyId) {
      return '👉 第三步：选择开发策略。可以尝试不同的策略（如“追求速度”或“质量优先”），观察它们对进度和 Bug 的修正系数。';
    } else {
      return '✨ 准备就绪！现在点击页面最下方的【执行 Sprint】按钮，开始你的第二个回合！';
    }
  }
  if (sprintCount === 2) {
    if (selectedAgentCount === 0) {
      return '👉 第一步：选择本回合要工作的工程师。如果资金充足，你还可以点击卡片上的【技能树】按钮来升级解锁更强大的技能属性！';
    } else if (!selectedProjectId) {
      return '👉 第二步：选择本回合的开发项目。你的 TODO App 应该快要接近 100% 了，继续加油！';
    } else if (!selectedStrategyId) {
      return '👉 第三步：选择适合的策略。如果当前项目累积了太多 Bug 或技术债，可以尝试选择能清理 Bug 的特定策略。';
    } else {
      return '✨ 最后一轮引导准备完毕！点击【执行 Sprint】按钮开始推进，第三个回合结束后新手引导将自动结束！';
    }
  }
  return '';
}
