import { memo } from 'react';
import type { Project, DifficultyLevel } from '../domain/project';
import { DIFFICULTY_CONFIGS } from '../domain/project';
import './ProjectCard.css';

interface Props {
  project: Project;
  selected: boolean;
  onSelect: (id: string) => void;
}

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  intern: '#4ade80',
  normal: '#60a5fa',
  hard: '#f97316',
  legend: '#a855f7',
};

export const ProjectCard = memo(function ProjectCard({ project, selected, onSelect }: Props) {
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
        <span className="difficulty-badge" style={{ backgroundColor: color }} title="项目难度级别。级别越高，完成项目后获得的资金奖励倍数越高！">
          {config.emoji} {config.label}
        </span>
        <span className="reward-badge" title="完成项目后的资金奖励倍数（基准系数）。">💰 ×{config.rewardMultiplier}</span>
      </div>
      <h3>{project.name}</h3>
      <p className="project-desc">{project.description}</p>
      <div className="progress-bar" title="项目的当前进度/目标总进度。达到 100% 后项目完成，并可获得丰厚的资金奖励！">
        <div className="progress-fill" style={{ width: `${progressPct}%`, backgroundColor: color }} />
        <span className="progress-label">{project.progress}/{project.maxProgress}</span>
      </div>
      <div className="project-stats">
        <span title="项目开发难度：数值越高开发进度产生的越慢，对工程师的各项技能要求也越高。">难度: {project.difficulty}</span>
        <span title="紧急度：影响特定负面突发事件的触发概率，通常越高的紧急度越容易触发事故。">紧急度: {project.urgency}</span>
        <span title="项目风险：风险越高，执行 Sprint 时触发突发 Bug 或事故的概率越高。">风险: {project.risk}</span>
      </div>
      <div className="project-health">
        <span className="bugs" title="开发过程中累积的 Bugs。Bugs 会扣减最终项目结算或触发严重的负面事件，可挑选调试能力强的工程师来降低。">🐛 Bugs: {project.bugs}</span>
        <span className="debt" title="技术债：随着开发进行会不断累积。技术债越高，项目进展越慢，且产生的新 Bugs 也越多。">🏗️ Debt: {project.techDebt}</span>
      </div>
    </div>
  );
});
