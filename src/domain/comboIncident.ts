import type { Incident, ComboIncidentTemplate } from './incident';
import type { RNG } from './random';
import { rollChance } from './random';

/** 检测已触发事件中是否存在可组合的配对，有 50% 概率触发组合事件 */
export function detectCombos(
  incidents: Incident[],
  comboTemplates: readonly ComboIncidentTemplate[],
  rng: RNG,
): Incident[] {
  const combos: Incident[] = [];
  const usedIndices = new Set<number>();

  for (let i = 0; i < incidents.length; i++) {
    if (usedIndices.has(i)) continue;
    for (let j = i + 1; j < incidents.length; j++) {
      if (usedIndices.has(j)) continue;

      const inc1 = incidents[i];
      const inc2 = incidents[j];

      for (const template of comboTemplates) {
        const matchForward = inc1.type === template.triggerTypes[0] && inc2.type === template.triggerTypes[1];
        const matchBackward = inc1.type === template.triggerTypes[1] && inc2.type === template.triggerTypes[0];

        if (matchForward || matchBackward) {
          if (rollChance(rng, 0.5)) {
            usedIndices.add(i);
            usedIndices.add(j);
            combos.push({
              type: template.triggerTypes[0], // Or a new type if we wanted
              severity: template.severity,
              actor: 'The Team', // Default combo actor
              title: template.titleTemplate,
              description: template.descriptionTemplate([inc1.actor, inc2.actor]),
              effects: { ...template.effects },
              isCombo: true,
              comboSource: `Triggered by ${inc1.type} and ${inc2.type}`,
            });
            break; // Stop checking templates for this pair
          }
        }
      }
    }
  }

  return combos;
}
