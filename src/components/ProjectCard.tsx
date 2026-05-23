import type { Project } from '../domain/project';

interface Props {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function ProjectCard({ project, selected, onSelect }: Props) {
  const progressPct = Math.round((project.progress / project.maxProgress) * 100);
  return (
    <div
      className={`project-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(project.id)}
    >
      <h3>{project.name}</h3>
      <p className="project-desc">{project.description}</p>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
        <span className="progress-label">{project.progress}/{project.maxProgress}</span>
      </div>
      <div className="project-stats">
        <span>Difficulty: {project.difficulty}</span>
        <span>Urgency: {project.urgency}</span>
        <span>Risk: {project.risk}</span>
      </div>
      <div className="project-health">
        <span className="bugs">Bugs: {project.bugs}</span>
        <span className="debt">Debt: {project.techDebt}</span>
      </div>
    </div>
  );
}
