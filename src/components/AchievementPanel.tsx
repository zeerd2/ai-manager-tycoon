import { achievements } from '../data/achievements';
import { getAchievementProgress } from '../domain/achievement';
import type { GameState } from '../domain/gameState';
import { useState } from 'react';

interface Props {
  unlockedAchievementIds: string[];
  gameState?: GameState;
}

export function AchievementPanel({ unlockedAchievementIds, gameState }: Props) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'employee' | 'project' | 'economic' | 'incident'>('all');

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'employee', name: '员工相关' },
    { id: 'project', name: '项目相关' },
    { id: 'economic', name: '经济相关' },
    { id: 'incident', name: '事故/日常' },
  ] as const;

  // Filter achievements
  const filteredAchievements = achievements.filter(
    (a) => activeCategory === 'all' || a.category === activeCategory
  );

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common': return '普通';
      case 'rare': return '稀有';
      case 'epic': return '史诗';
      case 'legendary': return '传说';
      default: return '普通';
    }
  };

  return (
    <div className="panel achievement-panel-container">
      <h2>
        🏆 成就系统
        <span className="count">({unlockedAchievementIds.length} / {achievements.length})</span>
      </h2>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="achievement-grid">
        {filteredAchievements.map((achievement) => {
          const isUnlocked = unlockedAchievementIds.includes(achievement.id);

          // Calculate progress if gameState is provided
          let progressInfo = null;
          if (gameState) {
            progressInfo = getAchievementProgress(achievement, gameState);
          }

          const progressPercent = progressInfo
            ? Math.min(100, Math.max(0, (progressInfo.current / progressInfo.target) * 100))
            : 0;

          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{isUnlocked ? achievement.emoji : '🔒'}</div>
              <div className="achievement-info">
                <div className="achievement-meta-row">
                  <div className="achievement-name">{achievement.name}</div>
                  <span className={`rarity-badge rarity-${achievement.rarity}`}>
                    {getRarityLabel(achievement.rarity)}
                  </span>
                </div>
                <div className="achievement-description">
                  {isUnlocked ? achievement.description : '???'}
                </div>

                {/* Progress bar rendering */}
                {progressInfo && (
                  <div className="achievement-progress-container">
                    <div className="achievement-progress-label">
                      <span>{isUnlocked ? '已解锁' : '解锁进度'}</span>
                      <span>{isUnlocked ? '100%' : progressInfo.display}</span>
                    </div>
                    <div className="achievement-progress-bar">
                      <div
                        className="achievement-progress-fill"
                        style={{ width: `${isUnlocked ? 100 : progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
