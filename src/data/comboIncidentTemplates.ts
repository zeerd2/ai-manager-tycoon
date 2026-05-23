import type { ComboIncidentTemplate } from '../domain/incident';

export const comboIncidentTemplates: readonly ComboIncidentTemplate[] = [
  {
    id: 'combo_1',
    triggerTypes: ['overengineering', 'bug'],
    severity: 'high',
    titleTemplate: '架构精美的 Bug 宇宙',
    descriptionTemplate: (actors) => `${actors[0]} 设计了一个完美的微服务架构，结果 ${actors[1]} 在里面埋了一个无法被找到的 Bug，现在它在 10 个服务之间循环穿梭。`,
    effects: { progress: -3, bugs: 10, techDebt: 8, morale: -5 },
  },
  {
    id: 'combo_2',
    triggerTypes: ['hallucination', 'burnout'],
    severity: 'critical',
    titleTemplate: '集体质疑现实',
    descriptionTemplate: (actors) => `${actors[0]} 产生了一个极其真实的幻觉代码，导致过度劳累的 ${actors[1]} 以为自己疯了，两人在会议室对坐了一整个下午。`,
    effects: { progress: -5, bugs: 3, techDebt: 2, morale: -12 },
  },
  {
    id: 'combo_3',
    triggerTypes: ['hallucination', 'overengineering'],
    severity: 'medium',
    titleTemplate: '用幻觉 API 搭了一个 Kubernetes 集群',
    descriptionTemplate: (actors) => `${actors[0]} 以为有一个不存在的云服务，于是 ${actors[1]} 围绕它写了一整套自动化部署脚本...神奇的是竟然跑起来了？`,
    effects: { progress: 2, bugs: 5, techDebt: 20, morale: -3 },
  },
  {
    id: 'combo_4',
    triggerTypes: ['bug', 'drama'],
    severity: 'high',
    titleTemplate: 'Bug 引发的政治斗争',
    descriptionTemplate: (actors) => `${actors[0]} 引入的严重 Bug 让 ${actors[1]} 借题发挥，在全公司群里发长文抨击现在的代码质量，群里现在分成两派正在辩论。`,
    effects: { progress: -8, bugs: 5, techDebt: 3, morale: -10 },
  },
  {
    id: 'combo_5',
    triggerTypes: ['breakthrough', 'breakthrough'],
    severity: 'low',
    titleTemplate: '灵感大爆发',
    descriptionTemplate: (actors) => `${actors[0]} 和 ${actors[1]} 在茶水间不期而遇，两人碰撞出了惊人的火花，在一小时内重写了最核心的模块。`,
    effects: { progress: 25, bugs: -5, techDebt: -10, morale: 15 },
  },
  {
    id: 'combo_6',
    triggerTypes: ['burnout', 'drama'],
    severity: 'critical',
    titleTemplate: '集体辞职信写好了',
    descriptionTemplate: (actors) => `已经处于崩溃边缘的 ${actors[0]} 被 ${actors[1]} 的一句话点燃了，现在他们拉了一个没有管理层的群，正在讨论下周一集体罢工。`,
    effects: { progress: -10, bugs: 0, techDebt: 0, morale: -15 },
  },
];
