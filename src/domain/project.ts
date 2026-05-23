export interface Project {
  id: string;
  name: string;
  description: string;
  difficulty: number;
  urgency: number;
  risk: number;
  progress: number;
  bugs: number;
  techDebt: number;
  maxProgress: number;
}

export function isProjectComplete(project: Project): boolean {
  return project.progress >= project.maxProgress;
}
