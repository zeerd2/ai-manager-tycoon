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

export function ProjectCard({ project, selected, onSelect }: Props) {
  const progressPct = Math.round((project.progress / project.maxProgress) * 100);
  const config = DIFFICULTY_CONFIGS[project.difficultyLevel];
  const color = DIFFICULTY_COLORS[project.difficultyLevel];

  return (
    <div
      className={`project-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(project.id)}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <div className="project-header">
        <span className="difficulty-badge" style={{ backgroundColor: color }}>
          {config.emoji} {config.label}
        </span>
        <span className="reward-badge">💰 ×{config.rewardMultiplier}</span>
      </div>
      <h3>{project.name}</h3>
      <p className="project-desc">{project.description}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPct}%`, backgroundColor: color }} />
        <span className="progress-label">{project.progress}/{project.maxProgress}</span>
      </div>
      <div className="project-stats">
        <span>难度: {project.difficulty}</span>
        <span>紧急度: {project.urgency}</span>
        <span>风险: {project.risk}</span>
      </div>
      <div className="project-health">
        <span className="bugs">🐛 Bugs: {project.bugs}</span>
        <span className="debt">🏗️ Debt: {project.techDebt}</span>
      </div>
    </div>
  );
}
