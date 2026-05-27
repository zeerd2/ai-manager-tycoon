import { calculateRating } from '../domain/rating';
import { achievements } from '../data/achievements';
import { getPlayerStats } from '../domain/playerStats';
import type { GameState } from '../domain/gameState';

interface Props {
  gameState: GameState;
  onReset: () => void;
}

export function GameOverScreen({ gameState, onReset }: Props) {
  const { funds, sprintCount, projects, completedProjectIds, unlockedAchievementIds, history, gameOverReason } = gameState;

  // Calculate final rating
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

  // Get aggregated player stats
  const stats = getPlayerStats(gameState);

  // Get list of unlocked achievements
  const unlockedAchievements = achievements.filter(a => unlockedAchievementIds.includes(a.id));

  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <h1 className="game-over-title">游戏结束</h1>

        <p className="game-over-reason">{gameOverReason}</p>

        <div className="game-over-stats">
          <div className="game-over-stat">
            <span className="label">最终评级</span>
            <span className={`value rating-${ratingResult.rating}`}>{ratingResult.rating}</span>
            <span className="sub-value">({ratingResult.title})</span>
          </div>
          <div className="game-over-stat-detail">
            <div>完成项目数: <span className="highlight">{completedProjects}</span></div>
            <div>进行 Sprint 数: <span className="highlight">{sprintCount}</span></div>
            <div>最终资金: <span className="highlight">${funds}</span></div>
          </div>
        </div>

        <div className="game-over-stats">
          <h3 style={{ marginBottom: '12px' }}>📊 详细统计</h3>
          <div className="game-over-stat-detail">
            <div>累计进度: <span className="highlight">{stats.totalProgress}</span></div>
            <div>累计 Bug: <span className="highlight">{stats.totalBugs}</span></div>
            <div>累计支出: <span className="highlight">${stats.totalFundsSpent}</span></div>
            <div>平均每轮进度: <span className="highlight">{stats.avgProgressPerSprint}</span></div>
            <div>平均每轮 Bug: <span className="highlight">{stats.avgBugsPerSprint}</span></div>
            <div>最佳单轮进度: <span className="highlight">{stats.bestSprintProgress}</span></div>
            <div>员工数: <span className="highlight">{stats.unlockedAgents} / {stats.totalAgents}</span></div>
            <div>平均士气: <span className="highlight">{stats.avgAgentMorale}</span></div>
            <div>最高技能: <span className="highlight">{stats.highestAgentSkill}</span></div>
            <div>最终声望: <span className="highlight">{stats.reputation}</span></div>
            <div>最终信心: <span className="highlight">{stats.confidence}</span></div>
            <div>累计事件: <span className="highlight">{stats.totalIncidents}</span></div>
          </div>
        </div>

        <div className="game-over-achievements">
          <h3>🏆 已获成就 ({unlockedAchievements.length}/{achievements.length})</h3>
          {unlockedAchievements.length > 0 ? (
            <div className="game-over-achievements-list">
              {unlockedAchievements.map(a => (
                <div key={a.id} className="game-over-achievement-item">
                  <span className="emoji">{a.emoji}</span>
                  <div className="info">
                    <span className="name">{a.name}</span>
                    <span className="desc">{a.description}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-achievements">无已解锁成就</p>
          )}
        </div>

        <button className="btn-restart" onClick={onReset}>
          再来一局
        </button>
      </div>
    </div>
  );
}
