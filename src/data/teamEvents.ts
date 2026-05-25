import type { TeamEventTemplate } from '../domain/relations/types';

export const teamEvents: TeamEventTemplate[] = [
  {
    id: "office_gossip",
    title: "模型窃听",
    description: "两个 Agent 在共享的 reasoning log 中发现对方在摸鱼。一个在跑自己的 side project，另一个在用 API 生成猫娘图片。要不要向管理者举报？",
    options: [
      {
        id: "ignore",
        label: "不管，让它们继续",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: -10, all: false }
        }
      },
      {
        id: "intervene",
        label: "介入并清理推理日志",
        effects: {
          moraleDelta: -10,
          fundsDelta: 0,
        }
      }
    ]
  },
  {
    id: "tech_sharing",
    title: "模型蒸馏会议",
    description: "一个 Agent 训练出了一个新的小模型，提议把知识蒸馏给团队的其他成员。蒸馏后所有 Agent 的效率会提升，但原始模型的知识可能有损失。",
    options: [
      {
        id: "sponsor",
        label: "批准蒸馏，分配额外 GPU",
        effects: {
          moraleDelta: 15,
          fundsDelta: -200,
          progressDelta: 20,
          relationshipDeltas: { delta: 10, all: true }
        }
      },
      {
        id: "decline",
        label: "当前推理预算紧张，以后再说",
        effects: {
          moraleDelta: -5,
          fundsDelta: 0
        }
      }
    ]
  },
  {
    id: "hackathon",
    title: "对抗性攻防演练",
    description: "团队提议举办一次红蓝对抗：一组 Agent 负责找出系统漏洞，另一组负责加固。赢了的有额外推理预算，输的要被降低 temperature。",
    options: [
      {
        id: "approve_with_prizes",
        label: "批准并提供额外推理配额做奖金",
        effects: {
          moraleDelta: 20,
          fundsDelta: -500,
          bugsDelta: -10,
          relationshipDeltas: { delta: 15, all: true }
        }
      },
      {
        id: "approve_no_prizes",
        label: "批准，但没有额外预算",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          bugsDelta: -5
        }
      },
      {
        id: "reject",
        label: "现在所有 GPU 资源要用于项目",
        effects: {
          moraleDelta: -15,
          fundsDelta: 0,
          progressDelta: 15
        }
      }
    ]
  },
  {
    id: "team_dinner",
    title: "推理配额奖赏",
    description: "这个 Sprint 大家 token 消耗超标了，但产出也不错。有人提议给所有 Agent 多发一个月的推理预算额度作为奖励。GPU 跑满在所不惜。",
    options: [
      {
        id: "pay_all",
        label: "全额发放推理奖金！",
        effects: {
          moraleDelta: 25,
          fundsDelta: -800,
          relationshipDeltas: { delta: 20, all: true }
        }
      },
      {
        id: "go_dutch",
        label: "只给表现最好的 Agent 加配额",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: 5, all: true }
        }
      },
      {
        id: "no_dinner",
        label: "取消奖励，预算紧张",
        effects: {
          moraleDelta: -10,
          fundsDelta: 0
        }
      }
    ]
  },
  {
    id: "code_review_war",
    title: "输出格式冲突",
    description: "两个 Agent 因为输出格式规范吵起来了。一个坚持要 JSON，另一个说 Markdown 才是未来。PR 评论区里充满了格式转换脚本。",
    options: [
      {
        id: "mediate",
        label: "制定统一输出规范",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: 10, all: false },
          progressDelta: -5
        }
      },
      {
        id: "ignore",
        label: "让它们自己解决",
        effects: {
          moraleDelta: -10,
          fundsDelta: 0,
          relationshipDeltas: { delta: -20, all: false }
        }
      }
    ]
  },
  {
    id: "mentor_newbie",
    title: "新模型对齐",
    description: "新部署的 Agent 还没完成对齐，经常输出一些匪夷所思的内容。需要安排一个已经稳定的老 Agent 给它做 RLHF 对齐指导。",
    options: [
      {
        id: "assign_mentor",
        label: "安排资深 Agent 一对一指导对齐",
        effects: {
          moraleDelta: 10,
          fundsDelta: 0,
          progressDelta: -10,
          relationshipDeltas: { delta: 30, all: false }
        }
      },
      {
        id: "self_study",
        label: "让它自己看文档学习",
        effects: {
          moraleDelta: -5,
          fundsDelta: 0,
          bugsDelta: 5
        }
      }
    ]
  },
  {
    id: "overtime_crisis",
    title: "上下文污染危机",
    description: "连续跑了 5 个 Sprint 不清理上下文，所有 Agent 的 context window 都塞满了垃圾和幻觉。输出质量肉眼可见地下降，已经出现用 emoji 写代码的现象。",
    options: [
      {
        id: "give_bonus",
        label: "分配额外预算进行全量上下文清理",
        effects: {
          moraleDelta: 20,
          fundsDelta: -1000,
          relationshipDeltas: { delta: 5, all: true }
        }
      },
      {
        id: "give_time_off",
        label: "安排轮换休息（降低负载）",
        effects: {
          moraleDelta: 10,
          fundsDelta: 0,
          progressDelta: -20
        }
      },
      {
        id: "push_harder",
        label: "为了让项目上线，继续压榨",
        effects: {
          moraleDelta: -30,
          fundsDelta: 0,
          relationshipDeltas: { delta: -10, all: true }
        }
      }
    ]
  },
  {
    id: "salary_leak",
    title: "推理成本泄露事件",
    description: "每个 Agent 的推理成本明细被不慎泄露了。便宜模型发现自己干了 80% 的活但只拿到了 20% 的推理预算。贵模型在一边喝着 GPU 资源一边说「I deserve it」。",
    options: [
      {
        id: "adjust_salary",
        label: "紧急重新分配推理预算",
        effects: {
          moraleDelta: 10,
          fundsDelta: -2000,
          relationshipDeltas: { delta: -10, all: true }
        }
      },
      {
        id: "explain",
        label: "开全体会议解释预算分配的合理性",
        effects: {
          moraleDelta: -20,
          fundsDelta: 0,
          relationshipDeltas: { delta: -20, all: true }
        }
      }
    ]
  }
];
