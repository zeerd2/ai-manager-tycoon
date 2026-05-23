import type { Agent } from './agent';
import type { Project } from './project';
import type { Strategy } from './strategy';
import type { Incident, IncidentTemplate } from './incident';
import type { RNG } from './random';
import { rollChance, pickRandom } from './random';
import { detectCombos } from './comboIncident';
import { comboIncidentTemplates } from '../data/comboIncidentTemplates';
import { rareIncidentTemplates } from '../data/rareIncidentTemplates';
import { calculateSprintScores } from './scoring';

export interface SprintResult {
  sprintNumber: number;
  project: Project;
  agents: Agent[];
  strategy: Strategy;
  progressDelta: number;
  bugsDelta: number;
  techDebtDelta: number;
  moraleDelta: number;
  cost: number;
  incidents: Incident[];
  summary: string;
}

export function runSprint(
  sprintNumber: number,
  agents: Agent[],
  project: Project,
  strategy: Strategy,
  incidentTemplates: readonly IncidentTemplate[],
  rng: RNG,
): SprintResult {
  const scores = calculateSprintScores(agents, project, strategy);

  const incidents: Incident[] = [];
  const baseIncidentChance = 0.3 + (project.risk / 200);
  const incidentChance = baseIncidentChance * strategy.modifiers.incidentChanceMul;

  for (const agent of agents) {
    if (rollChance(rng, incidentChance)) {
      const template = pickRandom(rng, incidentTemplates);
      incidents.push({
        type: template.type,
        severity: template.severity,
        actor: agent.name,
        title: template.titleTemplate.replace('{actor}', agent.name),
        description: template.descriptionTemplate(agent.name),
        effects: { ...template.effects },
      });
    }
  }

  const comboIncidents = detectCombos(incidents, comboIncidentTemplates, rng);
  incidents.push(...comboIncidents);

  if (rollChance(rng, 0.03)) {
    const rareTemplate = pickRandom(rng, rareIncidentTemplates);
    incidents.push({
      type: rareTemplate.type,
      severity: rareTemplate.severity,
      actor: '???',
      title: rareTemplate.titleTemplate,
      description: rareTemplate.descriptionTemplate('The team'),
      effects: { ...rareTemplate.effects },
      isRare: true,
    });
  }
  const incidentProgress = incidents.reduce((s, i) => s + i.effects.progress, 0);
  const incidentBugs = incidents.reduce((s, i) => s + i.effects.bugs, 0);
  const incidentTechDebt = incidents.reduce((s, i) => s + i.effects.techDebt, 0);
  const incidentMorale = incidents.reduce((s, i) => s + i.effects.morale, 0);

  const progressDelta = Math.max(0, scores.rawProgress + incidentProgress);
  const bugsDelta = scores.rawBugs + incidentBugs;
  const techDebtDelta = scores.rawTechDebt + incidentTechDebt;
  const moraleDelta = strategy.modifiers.moraleDelta + incidentMorale;

  const summary = buildSummary(progressDelta, bugsDelta, techDebtDelta, moraleDelta, incidents, strategy);

  return {
    sprintNumber,
    project: {
      ...project,
      progress: Math.min(project.maxProgress, project.progress + progressDelta),
      bugs: Math.max(0, project.bugs + bugsDelta),
      techDebt: Math.max(0, project.techDebt + techDebtDelta),
    },
    agents: agents.map(a => ({
      ...a,
      morale: Math.max(0, Math.min(100, a.morale + moraleDelta)),
    })),
    strategy,
    progressDelta,
    bugsDelta,
    techDebtDelta,
    moraleDelta,
    cost: scores.totalCost,
    incidents,
    summary,
  };
}

function buildSummary(
  progress: number,
  bugs: number,
  techDebt: number,
  morale: number,
  incidents: Incident[],
  strategy: Strategy,
): string {
  const parts: string[] = [];
  parts.push(`Strategy "${strategy.name}" deployed.`);
  parts.push(`The team pushed ${progress} progress points.`);

  if (bugs > 0) parts.push(`${bugs} new bugs crawled into production.`);
  if (techDebt > 0) parts.push(`Tech debt grew by ${techDebt}.`);
  if (morale > 0) parts.push(`Morale improved by ${morale}.`);
  if (morale < 0) parts.push(`Morale dropped by ${Math.abs(morale)}.`);
  if (incidents.length > 0) parts.push(`${incidents.length} incident(s) occurred during this sprint.`);

  return parts.join(' ');
}
