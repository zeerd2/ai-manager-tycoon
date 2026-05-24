import { useEffect, useState } from 'react';
import type { Achievement } from '../domain/achievement';

interface Props {
  achievement: Achievement;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Triggers entrance animation
    const enterTimeout = setTimeout(() => setVisible(true), 50);

    // Triggers exit animation after 2.7s (so it exits before 3s limit)
    const exitTimeout = setTimeout(() => setVisible(false), 2700);

    // Calls onClose after 3s
    const closeTimeout = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      clearTimeout(enterTimeout);
      clearTimeout(exitTimeout);
      clearTimeout(closeTimeout);
    };
  }, [achievement, onClose]);

  return (
    <div className={`achievement-toast ${visible ? 'show' : ''}`}>
      <span className="toast-emoji">{achievement.emoji}</span>
      <div className="toast-content">
        <div className="toast-title">🎯 成就解锁: {achievement.name}</div>
        <div className="toast-desc">{achievement.description}</div>
      </div>
    </div>
  );
}
