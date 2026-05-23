import type { Achievement } from '../domain/achievement';

export const achievements: Achievement[] = [
  {
    id: 'first-blood',
    name: 'First Blood',
    emoji: '🎯',
    description: '完成第一个项目',
    conditionType: 'first_project_completed',
  },
  {
    id: 'bug-factory',
    name: 'Bug Factory',
    emoji: '🏭',
    description: '单轮产生 20+ bugs',
    conditionType: 'single_sprint_20_bugs',
  },
  {
    id: 'under-budget',
    name: 'Under Budget',
    emoji: '💰',
    description: '完成项目时剩余资金超过 80%',
    conditionType: 'complete_project_80_percent_funds',
  },
  {
    id: 'team-wipe',
    name: 'Team Wipe',
    emoji: '💀',
    description: '所有员工同时 morale 为 0',
    conditionType: 'all_agents_zero_morale',
  },
  {
    id: '10x-company',
    name: '10x Company',
    emoji: '🚀',
    description: '一局游戏内完成 3 个以上项目',
    conditionType: 'three_projects_one_game',
  },
  {
    id: 'speed-run',
    name: 'Speed Run',
    emoji: '⚡',
    description: '5 轮内完成一个项目',
    conditionType: 'project_in_5_sprints',
  },
  {
    id: 'iron-man',
    name: 'Iron Man',
    emoji: '🦾',
    description: '让一个员工连续参与 6 轮不休息',
    conditionType: 'agent_6_consecutive',
  },
  {
    id: 'penny-pincher',
    name: 'Penny Pincher',
    emoji: '🪙',
    description: '只用最便宜的员工完成一个项目',
    conditionType: 'cheapest_agent_only',
  },
];
