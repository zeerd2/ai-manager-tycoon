import React, { useState } from 'react';

interface Props {
  sprintCount: number;
  selectedAgentCount: number;
  selectedProjectId: string | null;
  selectedStrategyId: string | null;
}

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
  return '';
}

export const TutorialGuide: React.FC<Props> = ({
  sprintCount,
  selectedAgentCount,
  selectedProjectId,
  selectedStrategyId
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (sprintCount >= 3 || !isOpen) return null;

  const renderContent = () => {
    switch (sprintCount) {
      case 0: {
        const stepText = getTutorialStepText(sprintCount, selectedAgentCount, selectedProjectId, selectedStrategyId);

        return (
          <div className="tutorial-step">
            <h4>💡 新手引导：第一步 (Sprint 0) — 部署你的首个项目</h4>
            <p className="tutorial-intro">
              欢迎来到 <strong>AI Manager Tycoon</strong>！在这里，你将作为 AI 工程经理来管理工程师团队、选择项目并制定策略。你的终极目标是高效推进项目并避免公司破产。
            </p>
            <div className="tutorial-highlight-box pulse">
              {stepText}
            </div>
            <p className="tutorial-tip">
              * 提示：你可以将鼠标悬停在工程师的“士气”、“疲劳”或项目的“Bugs”、“技术债”上，以查看详细的关键机制说明。
            </p>
          </div>
        );
      }
      case 1:
        return (
          <div className="tutorial-step">
            <h4>💡 新手引导：第二步 (Sprint 1) — 结算报告与精力管理</h4>
            <p className="tutorial-intro">
              太棒了！你已经完成了第一个 Sprint。仔细阅读下方的<strong>「Sprint 报告」</strong>，这里会展示你取得的进度、产生的 Bug 数量以及突发事件。
            </p>
            <div className="tutorial-highlight-box">
              <strong>🔋 工程师状态管理：</strong><br />
              每个工程师的卡片都有<strong>士气</strong>和<strong>疲劳</strong>条。工程师每工作一个回合，疲劳度就会上升，连续工作 3 个回合及以上会导致<strong>「过劳警告」</strong>并降低士气。<br />
              <strong>💤 安排休息：</strong>如果本回合不选中某位工程师，他就会自动进入<strong>“休息状态”</strong>，大幅降低疲劳值并恢复士气。合理轮换你的团队成员以避免发生罢工事件！
            </div>
            <p className="tutorial-tip">
              * 现在的目标：继续挑选人员、项目 and 策略，来进一步完成你的 TODO App 项目！
            </p>
          </div>
        );
      case 2:
        return (
          <div className="tutorial-step">
            <h4>💡 新手引导：第三步 (Sprint 2) — 技能树、新员工与人际网络</h4>
            <p className="tutorial-intro">
              随着项目的不断推进，是时候了解一些高级工程管理机制了：
            </p>
            <div className="tutorial-highlight-box">
              <strong>🌳 工程师技能树：</strong>点击工程师卡片上的“技能树”按钮，可以消耗资金来解锁和升级他们的各项技能，升级后将能带来极大的被动效率加成。<br />
              <strong>🔓 工程师解锁：</strong>随着 Sprint 回合数的推进，候选人池会自动解锁更强大的 AI 工程师（如第 2 回合解锁的 AlphaFold 3）。<br />
              <strong>🔗 团队关系网络：</strong>当同一批工程师共同协作并顺利完成项目时，他们的关系度会上升（+5）。关系度高的工程师在一起共同执行项目时能获得<strong>额外的进度产出加成</strong>！
            </div>
            <p className="tutorial-tip">
              * 恭喜你掌握了核心玩法！此引导窗口将在第 3 个 Sprint 自动关闭。祝你的 AI 帝国繁荣昌盛！
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="tutorial-guide-banner">
      <div className="tutorial-guide-header">
        <span className="tutorial-icon">🎮 经理入门指南</span>
        <button className="tutorial-close-btn" onClick={() => setIsOpen(false)} title="关闭引导">
          不再显示 &times;
        </button>
      </div>
      <div className="tutorial-guide-body">
        {renderContent()}
      </div>
    </div>
  );
};
