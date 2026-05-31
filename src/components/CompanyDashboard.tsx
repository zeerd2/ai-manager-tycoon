import { memo } from 'react';
import { calculateRating, toRatingInput } from '../domain/rating';
import { achievements } from '../data/achievements';
import { PlayerDashboard } from './PlayerDashboard';
import type { GameState } from '../domain/gameState';

interface Props {
  gameState: GameState;
}

export const CompanyDashboard = memo(function CompanyDashboard({ gameState }: Props) {
  const { funds, sprintCount, unlockedAchievementIds, reputation = 50, confidence = 50 } = gameState;

  const ratingResult = calculateRating(toRatingInput(gameState));

  const totalAchievements = achievements.length;
  const unlockedAchievementsCount = unlockedAchievementIds.length;

  const maxFundsLimit = 10000;
  const fundsPercent = Math.min(100, Math.max(0, (funds / maxFundsLimit) * 100));
  const isLowFunds = funds < 1000;

  return (
    <div className="company-dashboard-wrapper">
      <div className="company-dashboard">
        <div className="dashboard-item funds-container" title="当前公司持有的运营资金。每回合结束时扣除工程师薪资并计算开销，若资金归零或为负，公司将面临破产（游戏结束）！">
          <span className="label">💰 资金:</span>
          <div className={`funds-bar ${isLowFunds ? 'danger-flash' : ''}`}>
            <div className="funds-bar-fill" style={{ width: `${fundsPercent}%` }}></div>
            <span className="funds-text">${funds}</span>
          </div>
        </div>

        <div className="dashboard-item" title="基于已完成项目数、累计 Bugs、技术债、历史总支出和剩余资金对你进行的综合管理评级评估。">
          <span className="label">📊 评级:</span>
          <span className={`rating-badge rating-${ratingResult.rating}`}>
            {ratingResult.rating} ({ratingResult.title})
          </span>
        </div>

        <div className="dashboard-item" title="当前公司的行业声望（0-100）。完成合同会增加声望，逾期交付或出现 Bug 会降低声望。">
          <span className="label">👑 声望:</span>
          <span className="value highlight">{reputation}</span>
        </div>

        <div className="dashboard-item" title="团队对公司的信心指数（0-100）。士气高昂会增加信心，信心不足会影响团队表现。">
          <span className="label">🧠 信心:</span>
          <span className="value highlight">{confidence}</span>
        </div>

        <div className="dashboard-item" title="当前已解锁的游戏成就数。尝试解锁更多成就以达成完美通关！">
          <span className="label">🏆 成就:</span>
          <span className="value">{unlockedAchievementsCount} / {totalAchievements}</span>
        </div>

        <div className="dashboard-item" title="当前所处的回合数（Sprint数）。随着回合数的推进，候选人池会自动解锁更强大的 AI 工程师。">
          <span className="label">回合 #</span>
          <span className="value highlight">{sprintCount}</span>
        </div>
      </div>
      <PlayerDashboard gameState={gameState} />
    </div>
  );
});
