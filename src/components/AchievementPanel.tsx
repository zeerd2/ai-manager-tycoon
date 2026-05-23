import { achievements } from '../data/achievements';

interface Props {
  unlockedAchievementIds: string[];
}

export function AchievementPanel({ unlockedAchievementIds }: Props) {
  return (
    <div className="panel achievement-panel-container">
      <h2>🏆 成就系统 <span className="count">({unlockedAchievementIds.length} / {achievements.length})</span></h2>
      <div className="achievement-grid">
        {achievements.map((achievement) => {
          const isUnlocked = unlockedAchievementIds.includes(achievement.id);
          return (
            <div
              key={achievement.id}
              className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{isUnlocked ? achievement.emoji : '🔒'}</div>
              <div className="achievement-info">
                <div className="achievement-name">{achievement.name}</div>
                <div className="achievement-description">
                  {isUnlocked ? achievement.description : '???'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
