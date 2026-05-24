interface Props {
  activePanel: 'none' | 'achievements' | 'history';
  onOpenAchievements: () => void;
  onOpenHistory: () => void;
}

export function MobileBottomNav({ activePanel, onOpenAchievements, onOpenHistory }: Props) {
  return (
    <nav className="mobile-bottom-nav">
      <button
        className={`mobile-nav-btn ${activePanel === 'achievements' ? 'active' : ''}`}
        onClick={onOpenAchievements}
      >
        <span className="mobile-nav-icon">🏆</span>
        <span className="mobile-nav-label">成就</span>
      </button>
      <button
        className={`mobile-nav-btn ${activePanel === 'history' ? 'active' : ''}`}
        onClick={onOpenHistory}
      >
        <span className="mobile-nav-icon">📋</span>
        <span className="mobile-nav-label">历史</span>
      </button>
    </nav>
  );
}
