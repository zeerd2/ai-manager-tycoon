import { useState, memo } from 'react';
import { calculatePlayerStats } from '../domain/playerStats';
import { achievements } from '../data/achievements';
import type { GameState } from '../domain/gameState';
import './PlayerDashboard.css';

interface Props {
  gameState: GameState;
}

export const PlayerDashboard = memo(function PlayerDashboard({ gameState }: Props) {
  const [expanded, setExpanded] = useState(false);
  const stats = calculatePlayerStats(gameState, achievements.length);

  return (
    <div className="player-dashboard">
      <button
        className="player-dashboard-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        <span className="player-dashboard-arrow">{expanded ? '▼' : '▶'}</span>
        📊 个人统计
      </button>

      <div className="player-dashboard-overview">
        <div className="player-dashboard-stat">
          <span className="stat-value">{stats.totalSprints}</span>
          <span className="stat-label">总回合</span>
        </div>
        <div className="player-dashboard-stat">
          <span className="stat-value">{stats.totalProjectsCompleted}</span>
          <span className="stat-label">完成项目</span>
        </div>
        <div className="player-dashboard-stat">
          <span className="stat-value">{stats.totalProgress}</span>
          <span className="stat-label">总进度</span>
        </div>
        <div className="player-dashboard-stat">
          <span className="stat-value">
            {stats.achievementCount}
            <small style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              {' '}({Math.round(stats.achievementRate * 100)}%)
            </small>
          </span>
          <span className="stat-label">成就解锁</span>
        </div>
      </div>

      <div className={`player-dashboard-content${expanded ? ' expanded' : ''}`}>
          <div className="stat-group">
            <h4>⚡ 效率</h4>
            <div className="stat-item">
              <span className="stat-item-label">平均进度/回合</span>
              <span className="stat-item-value">{stats.avgProgressPerSprint.toFixed(1)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">平均花费/回合</span>
              <span className="stat-item-value">${stats.avgCostPerSprint.toFixed(0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">进度/资金比</span>
              <span className="stat-item-value">{stats.progressPerFund.toFixed(3)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">Bug/项目</span>
              <span className="stat-item-value negative">{stats.bugsPerProject.toFixed(1)}</span>
            </div>
          </div>

          <div className="stat-group">
            <h4>🏆 记录</h4>
            <div className="stat-item">
              <span className="stat-item-label">最佳Sprint</span>
              <span className="stat-item-value positive">+{stats.bestSprintProgress}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">最差Sprint</span>
              <span className="stat-item-value negative">{stats.worstSprintProgress}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">灾难Sprint</span>
              <span className="stat-item-value negative">{stats.disasterSprintCount}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">平均士气变化</span>
              <span className={`stat-item-value ${stats.avgMoraleDelta >= 0 ? 'positive' : 'negative'}`}>
                {stats.avgMoraleDelta >= 0 ? '+' : ''}{stats.avgMoraleDelta.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="stat-group">
            <h4>👥 团队</h4>
            <div className="stat-item">
              <span className="stat-item-label">团队规模</span>
              <span className="stat-item-value">{stats.currentTeamSize}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">平均技能</span>
              <span className="stat-item-value">{stats.avgTeamSkill.toFixed(0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">累计工作量</span>
              <span className="stat-item-value">{stats.totalPersonSprints}</span>
            </div>
          </div>

          <div className="stat-group">
            <h4>🐛 Bug & 债务</h4>
            <div className="stat-item">
              <span className="stat-item-label">总Bug</span>
              <span className="stat-item-value negative">{stats.totalBugs}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">总技术债</span>
              <span className="stat-item-value negative">{stats.totalTechDebt}</span>
            </div>
            <div className="stat-item">
              <span className="stat-item-label">总花费</span>
              <span className="stat-item-value">${stats.totalFundsSpent}</span>
            </div>
          </div>
        </div>
    </div>
  );
});
