export type IncidentType = 'bug' | 'overengineering' | 'hallucination' | 'burnout' | 'breakthrough' | 'drama';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface IncidentEffects {
  progress: number;
  bugs: number;
  techDebt: number;
  morale: number;
  funds?: number;
}

export interface Incident {
  type: IncidentType;
  severity: Severity;
  actor: string;
  title: string;
  description: string;
  effects: IncidentEffects;
  isCombo?: boolean;
  isRare?: boolean;
  comboSource?: string;
}

export interface IncidentTemplate {
  type: IncidentType;
  severity: Severity;
  titleTemplate: string;
  descriptionTemplate: (actorName: string) => string;
  effects: IncidentEffects;
  isCombo?: boolean;
  isRare?: boolean;
  comboSource?: string;
}

export interface ComboIncidentTemplate {
  id: string;
  triggerTypes: [IncidentType, IncidentType];
  severity: Severity;
  titleTemplate: string;
  descriptionTemplate: (actors: string[]) => string;
  effects: IncidentEffects;
}
