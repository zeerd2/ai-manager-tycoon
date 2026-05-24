export interface AgentRelation {
  agentIdA: string;
  agentIdB: string;
  relationshipScore: number; // -100 to 100
}

export interface TeamEventTemplate {
  id: string;
  title: string;
  description: string;
  options: TeamEventOption[];
}

export interface TeamEventOption {
  id: string;
  label: string;
  effects: TeamEventEffect;
}

export interface TeamEventEffect {
  moraleDelta: number;
  fundsDelta: number;
  relationshipDeltas?: {
    agentIdA?: string;
    agentIdB?: string;
    delta: number;
    all?: boolean; // if true, applies to all selected agents
  };
  progressDelta?: number;
  bugsDelta?: number;
}
