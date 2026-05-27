import { useEffect, useCallback } from 'react';
import { getAchievementProgress } from '../domain/achievement';
import type { Achievement } from '../domain/achievement';
import type { GameState } from '../domain/gameState';

interface Props {
  achievement: Achievement;
  isUnlocked: boolean;
  gameState: GameState;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  employee: '员工相关',
  project: '项目相关',
  economic: '经济相关',
  incident: '事故/日常',
};

const RARITY_LABELS: Record<string, string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export function AchievementDetailModal({ achievement, isUnlocked, gameState, onClose }: Props) {
  const progressInfo = getAchievementProgress(achievement, gameState);
  const progressPercent = progressInfo
    ? Math.min(100, Math.max(0, (progressInfo.current / progressInfo.target) * 100))
    : 0;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="achievement-detail-overlay" onClick={onClose}>
      <div className="achievement-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="achievement-detail-close" onClick={onClose} aria-label="关闭">
          ×
        </button>

        <div className="achievement-detail-header">
          <div className="achievement-detail-icon">
            {isUnlocked ? achievement.emoji : '🔒'}
          </div>
          <div className="achievement-detail-title-area">
            <h2 className="achievement-detail-name">{achievement.name}</h2>
            <div className="achievement-detail-badges">
              <span className={`rarity-badge rarity-${achievement.rarity}`}>
                {RARITY_LABELS[achievement.rarity] || achievement.rarity}
              </span>
              <span className="category-badge">
                {CATEGORY_LABELS[achievement.category] || achievement.category}
              </span>
            </div>
          </div>
          {isUnlocked && <span className="achievement-detail-check">✅</span>}
        </div>

        <div className="achievement-detail-body">
          <p className="achievement-detail-desc">
            {isUnlocked ? achievement.description : '??? 未解锁 — 继续努力！'}
          </p>

          {progressInfo && (
            <div className="achievement-detail-progress">
              <div className="achievement-detail-progress-header">
                <span>{isUnlocked ? '已完成' : '解锁进度'}</span>
                <span className="achievement-detail-progress-value">
                  {isUnlocked ? '100%' : progressInfo.display}
                </span>
              </div>
              <div className="achievement-detail-progress-bar">
                <div
                  className="achievement-detail-progress-fill"
                  style={{ width: `${isUnlocked ? 100 : progressPercent}%` }}
                />
              </div>
            </div>
          )}

          <div className="achievement-detail-meta">
            <div className="achievement-detail-meta-item">
              <span className="meta-label">类别</span>
              <span className="meta-value">{CATEGORY_LABELS[achievement.category]}</span>
            </div>
            <div className="achievement-detail-meta-item">
              <span className="meta-label">稀有度</span>
              <span className="meta-value">{RARITY_LABELS[achievement.rarity]}</span>
            </div>
            <div className="achievement-detail-meta-item">
              <span className="meta-label">状态</span>
              <span className={`meta-value ${isUnlocked ? 'unlocked-text' : 'locked-text'}`}>
                {isUnlocked ? '已解锁' : '未解锁'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
