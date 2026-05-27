import { memo } from 'react';
import { achievements } from '../data/achievements';
import type { GameState } from '../domain/gameState';

interface Props {
  gameState: GameState;
}

export const PlayerDataDashboard = memo(function PlayerDataDashboard({ gameState }: Props) {
  const {
    funds,
    sprintCount,
    agents,
    completedProjectIds,
    unlockedAchievementIds,
    history,
    reputation = 50,
    confidence = 50,
    quarterlyEvaluations = [],
  } = gameState;

  const totalBugs = history.reduce((sum, h) => sum + h.bugsDelta, 0);
  const totalCost = history.reduce((sum, h) => sum + h.cost, 0);
  const totalProgress = history.reduce((sum, h) => sum + h.progressDelta, 0);
  const unlockedAgents = agents.filter(a => !a.locked);
  const totalAgents = agents.length;
  const avgMorale = unlockedAgents.length > 0
    ? Math.round(unlockedAgents.reduce((sum, a) => sum + a.morale, 0) / unlockedAgents.length)
    : 0;
  const avgFatigue = unlockedAgents.length > 0
    ? Math.round(unlockedAgents.reduce((sum, a) => sum + a.fatigue, 0) / unlockedAgents.length)
    : 0;
  const avgSalary = unlockedAgents.length > 0
    ? Math.round(unlockedAgents.reduce((sum, a) => sum + a.salary, 0) / unlockedAgents.length)
    : 0;

  const totalAchievements = achievements.length;
  const unlockedCount = unlockedAchievementIds.length;
  const achievementPercent = totalAchievements > 0
    ? Math.round((unlockedCount / totalAchievements) * 100)
    : 0;

  const quartersPassed = quarterlyEvaluations.length;
  const quartersAchieved = quarterlyEvaluations.filter((q: { achieved?: boolean }) => q.achieved).length;

  const bugsPerSprint = sprintCount > 0 ? (totalBugs / sprintCount).toFixed(1) : '0';
  const costPerSprint = sprintCount > 0 ? Math.round(totalCost / sprintCount) : 0;

  return (
    <div className="player-data-dashboard">
      <h2 className="dashboard-title">
        <span>📊</span> 玩家数据仪表盘
      </h2>

      <div className="dashboard-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-icon">🏃</div>
          <div className="dash-stat-value">{sprintCount}</div>
          <div className="dash-stat-label">总 Sprint 数</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">✅</div>
          <div className="dash-stat-value">{completedProjectIds.length}</div>
          <div className="dash-stat-label">已完成项目</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">🐛</div>
          <div className="dash-stat-value">{totalBugs}</div>
          <div className="dash-stat-label">累计 Bug 数</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">💰</div>
          <div className="dash-stat-value">${totalCost}</div>
          <div className="dash-stat-label">累计花费</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">📈</div>
          <div className="dash-stat-value">{totalProgress}</div>
          <div className="dash-stat-label">累计进度</div>
        </div>

        <div className="dash-stat-card">
          <div className="dash-stat-icon">💵</div>
          <div className="dash-stat-value">${funds}</div>
          <div className="dash-stat-label">当前资金</div>
        </div>
      </div>

      <div className="dashboard-sections">
        <div className="dash-section">
          <h3 className="dash-section-title">👥 团队概况</h3>
          <div className="dash-detail-grid">
            <div className="dash-detail-item">
              <span className="dash-detail-label">已解锁员工</span>
              <span className="dash-detail-value">{unlockedAgents.length} / {totalAgents}</span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">平均士气</span>
              <span className={`dash-detail-value ${avgMorale < 30 ? 'danger' : avgMorale > 70 ? 'success' : ''}`}>
                {avgMorale}%
              </span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">平均疲劳</span>
              <span className={`dash-detail-value ${avgFatigue > 70 ? 'danger' : ''}`}>
                {avgFatigue}%
              </span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">平均薪资</span>
              <span className="dash-detail-value">${avgSalary}</span>
            </div>
          </div>
        </div>

        <div className="dash-section">
          <h3 className="dash-section-title">🏆 成就进度</h3>
          <div className="dash-achievement-bar-wrapper">
            <div className="dash-achievement-bar-header">
              <span>{unlockedCount} / {totalAchievements}</span>
              <span>{achievementPercent}%</span>
            </div>
            <div className="dash-achievement-bar">
              <div
                className="dash-achievement-bar-fill"
                style={{ width: `${achievementPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="dash-section">
          <h3 className="dash-section-title">📅 季度评估</h3>
          <div className="dash-detail-grid">
            <div className="dash-detail-item">
              <span className="dash-detail-label">已评估季度</span>
              <span className="dash-detail-value">{quartersPassed}</span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">达标季度</span>
              <span className={`dash-detail-value ${quartersAchieved > 0 ? 'success' : ''}`}>
                {quartersAchieved}
              </span>
            </div>
          </div>
        </div>

        <div className="dash-section">
          <h3 className="dash-section-title">📊 效率指标</h3>
          <div className="dash-detail-grid">
            <div className="dash-detail-item">
              <span className="dash-detail-label">平均 Bug/Sprint</span>
              <span className="dash-detail-value">{bugsPerSprint}</span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">平均花费/Sprint</span>
              <span className="dash-detail-value">${costPerSprint}</span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">公司声望</span>
              <span className="dash-detail-value">{reputation}</span>
            </div>
            <div className="dash-detail-item">
              <span className="dash-detail-label">团队信心</span>
              <span className="dash-detail-value">{confidence}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
