import { memo } from 'react';
import type { Project, DifficultyLevel } from '../domain/project';
import { DIFFICULTY_CONFIGS } from '../domain/project';

interface Props {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  intern: '#4ade80',
  normal: '#60a5fa',
  challenge: '#f97316',
  hell: '#ef4444',
  legend: '#a855f7',
};

export const MobileProjectCard = memo(function MobileProjectCard({ project, selected, onSelect }: Props) {
  const progressPct = Math.round((project.progress / project.maxProgress) * 100);
  const config = DIFFICULTY_CONFIGS[project.difficultyLevel];
  const color = DIFFICULTY_COLORS[project.difficultyLevel];

  return (
    <div
      className={`mobile-project-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(project.id)}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="mobile-project-header">
        <span className="difficulty-badge" style={{ backgroundColor: color }}>
          {config.emoji} {config.label}
        </span>
        <span className="reward-badge">💰 ×{config.rewardMultiplier}</span>
      </div>

      <h3 className="project-title">{project.name}</h3>
      <p className="project-desc">{project.description}</p>

      <div className="progress-bar-compact">
        <div className="bar-track">
          <div className="bar-fill" style={{ width: `${progressPct}%`, backgroundColor: color }} />
        </div>
        <span className="label">{project.progress} / {project.maxProgress} ({progressPct}%)</span>
      </div>

      <div className="mobile-project-stats">
        <div className="stat-row">
          <span>难度: {project.difficulty}</span>
          <span>紧急: {project.urgency}</span>
          <span>风险: {project.risk}</span>
        </div>
        <div className="health-row">
          <span className="bugs">🐛 Bugs: {project.bugs}</span>
          <span className="debt">🏗️ 负债: {project.techDebt}</span>
        </div>
      </div>
    </div>
  );
});
