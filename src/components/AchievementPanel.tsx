import { memo } from 'react';
import { achievements } from '../data/achievements';
import { achievementUI, formatAchievementCount, getRarityIcon } from '../data/achievementUI';
import { getAchievementProgress } from '../domain/achievement';
import type { GameState } from '../domain/gameState';
import { useState } from 'react';

interface Props {
  unlockedAchievementIds: string[];
  gameState?: GameState;
}

export const AchievementPanel = memo(function AchievementPanel({ unlockedAchievementIds, gameState }: Props) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'employee' | 'project' | 'economic' | 'incident'>('all');

  const categories = [
    { id: 'all', name: achievementUI.categories.all },
    { id: 'employee', name: achievementUI.categories.employee },
    { id: 'project', name: achievementUI.categories.project },
    { id: 'economic', name: achievementUI.categories.economic },
    { id: 'incident', name: achievementUI.categories.incident },
  ] as const;

  // Filter achievements
  const filteredAchievements = achievements.filter(
    (a) => activeCategory === 'all' || a.category === activeCategory
  );

  const getRarityLabel = (rarity: string) => {
    return achievementUI.rarity[rarity as keyof typeof achievementUI.rarity] || achievementUI.rarity.common;
  };

  return (
    <div className="panel achievement-panel-container">
      <h2>
        🏆 {achievementUI.panel.title}
        <span className="count">{formatAchievementCount(unlockedAchievementIds.length, achievements.length)}</span>
      </h2>
      <p className="achievement-subtitle">{achievementUI.panel.subtitle}</p>

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

      {filteredAchievements.length === 0 ? (
        <div className="achievement-empty-state">{achievementUI.panel.emptyState}</div>
      ) : (
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

            const isHidden = achievement.description === '???' && !isUnlocked;

            return (
              <div
                key={achievement.id}
                className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'} ${isHidden ? 'hidden' : ''}`}
              >
                <div className="achievement-icon">
                  {isUnlocked ? achievement.emoji : isHidden ? '❓' : achievementUI.card.lockedIcon}
                </div>
                <div className="achievement-info">
                  <div className="achievement-meta-row">
                    <div className="achievement-name">
                      {isHidden ? achievementUI.progress.hidden : achievement.name}
                    </div>
                    <span className={`rarity-badge rarity-${achievement.rarity}`}>
                      {getRarityIcon(achievement.rarity)} {getRarityLabel(achievement.rarity)}
                    </span>
                  </div>
                  <div className="achievement-description">
                    {isUnlocked
                      ? achievement.description
                      : isHidden
                        ? achievementUI.progress.hiddenDescription
                        : achievement.description}
                  </div>

                  {/* Progress bar rendering */}
                  {progressInfo && !isHidden && (
                    <div className="achievement-progress-container">
                      <div className="achievement-progress-label">
                        <span>{isUnlocked ? achievementUI.progress.unlocked : achievementUI.progress.label}</span>
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
      )}
    </div>
  );
});
