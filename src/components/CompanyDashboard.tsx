import { memo } from 'react';
import { calculateRating } from '../domain/rating';
import { achievements } from '../data/achievements';
import type { GameState } from '../domain/gameState';

interface Props {
  gameState: GameState;
}

export const CompanyDashboard = memo(function CompanyDashboard({ gameState }: Props) {
  const { funds, sprintCount, projects, completedProjectIds, unlockedAchievementIds, history } = gameState;

  // Calculate rating input
  const completedProjects = completedProjectIds.length;
  const totalBugs = projects.reduce((sum, p) => sum + p.bugs, 0);
  const totalTechDebt = projects.reduce((sum, p) => sum + p.techDebt, 0);
  const totalSprintsCost = history.reduce((sum, h) => sum + h.cost, 0);

  const ratingResult = calculateRating({
    completedProjects,
    totalBugs,
    totalTechDebt,
    totalSprintsCost,
    fundsRemaining: funds,
    sprintCount,
  });

  const totalAchievements = achievements.length;
  const unlockedAchievementsCount = unlockedAchievementIds.length;

  // Progress bar calculations for funds. Let's assume a baseline maximum funds of $10000 or similar
  // to show a nice fill, but since funds can go higher, let's cap the visual progress at 100% with a baseline of $10000,
  // or just show a nice percentage representation or constant bar.
  // Wait, the spec says "资金条用进度条样式，资金低于 1000 时变红闪烁".
  // Let's set a visual max of $10000 (since INITIAL_FUNDS is $5000).
  const maxFundsLimit = 10000;
  const fundsPercent = Math.min(100, Math.max(0, (funds / maxFundsLimit) * 100));
  const isLowFunds = funds < 1000;

  return (
    <div className="company-dashboard">
      <div className="dashboard-item funds-container">
        <span className="label">💰 资金:</span>
        <div className={`funds-bar ${isLowFunds ? 'danger-flash' : ''}`}>
          <div className="funds-bar-fill" style={{ width: `${fundsPercent}%` }}></div>
          <span className="funds-text">${funds}</span>
        </div>
      </div>

      <div className="dashboard-item">
        <span className="label">📊 评级:</span>
        <span className={`rating-badge rating-${ratingResult.rating}`}>
          {ratingResult.rating} ({ratingResult.title})
        </span>
      </div>

      <div className="dashboard-item">
        <span className="label">🏆 成就:</span>
        <span className="value">{unlockedAchievementsCount} / {totalAchievements}</span>
      </div>

      <div className="dashboard-item">
        <span className="label">回合 #</span>
        <span className="value highlight">{sprintCount}</span>
      </div>
    </div>
  );
});
