import type { TeamEventTemplate } from '../domain/relations/types';

export const teamEvents: TeamEventTemplate[] = [
  {
    id: "office_gossip",
    title: "办公室八卦",
    description: "几名员工在茶水间讨论公司的八卦，这可能会影响他们之间的关系。",
    options: [
      {
        id: "ignore",
        label: "随他们去吧",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: -10, all: false } // Two random agents lose relationship
        }
      },
      {
        id: "intervene",
        label: "干预并制止",
        effects: {
          moraleDelta: -10,
          fundsDelta: 0,
        }
      }
    ]
  },
  {
    id: "tech_sharing",
    title: "技术分享会",
    description: "一名资深工程师提出要在周末举办技术分享会。",
    options: [
      {
        id: "sponsor",
        label: "赞助餐饮费",
        effects: {
          moraleDelta: 15,
          fundsDelta: -200,
          progressDelta: 20,
          relationshipDeltas: { delta: 10, all: true }
        }
      },
      {
        id: "decline",
        label: "目前太忙了，以后再说",
        effects: {
          moraleDelta: -5,
          fundsDelta: 0
        }
      }
    ]
  },
  {
    id: "hackathon",
    title: "黑客马拉松",
    description: "团队提议举办一次为期两天的内部黑客马拉松来解决一些长期存在的问题。",
    options: [
      {
        id: "approve_with_prizes",
        label: "批准并提供丰厚奖品",
        effects: {
          moraleDelta: 20,
          fundsDelta: -500,
          bugsDelta: -10,
          relationshipDeltas: { delta: 15, all: true }
        }
      },
      {
        id: "approve_no_prizes",
        label: "批准，但没有预算",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          bugsDelta: -5
        }
      },
      {
        id: "reject",
        label: "现在需要专注于项目进度",
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
    title: "团建聚餐",
    description: "团队最近工作很辛苦，有人提议去吃一顿大餐放松一下。",
    options: [
      {
        id: "pay_all",
        label: "公司全包了！",
        effects: {
          moraleDelta: 25,
          fundsDelta: -800,
          relationshipDeltas: { delta: 20, all: true }
        }
      },
      {
        id: "go_dutch",
        label: "AA制",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: 5, all: true }
        }
      },
      {
        id: "no_dinner",
        label: "取消团建",
        effects: {
          moraleDelta: -10,
          fundsDelta: 0
        }
      }
    ]
  },
  {
    id: "code_review_war",
    title: "代码审查之争",
    description: "两名开发人员因为代码风格问题在 PR 里吵起来了。",
    options: [
      {
        id: "mediate",
        label: "出面调解，制定统一标准",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: 10, all: false },
          progressDelta: -5
        }
      },
      {
        id: "ignore",
        label: "让他们自己解决",
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
    title: "导师带新人",
    description: "一位新加入的成员遇到了一些技术困难，需要指导。",
    options: [
      {
        id: "assign_mentor",
        label: "安排资深员工一对一指导",
        effects: {
          moraleDelta: 10,
          fundsDelta: 0,
          progressDelta: -10,
          relationshipDeltas: { delta: 30, all: false }
        }
      },
      {
        id: "self_study",
        label: "让他们多看文档",
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
    title: "加班风波",
    description: "连续的加班让团队士气低落，有员工公开表达了不满。",
    options: [
      {
        id: "give_bonus",
        label: "发加班费和奖金安抚",
        effects: {
          moraleDelta: 20,
          fundsDelta: -1000,
          relationshipDeltas: { delta: 5, all: true }
        }
      },
      {
        id: "give_time_off",
        label: "安排轮休",
        effects: {
          moraleDelta: 10,
          fundsDelta: 0,
          progressDelta: -20
        }
      },
      {
        id: "push_harder",
        label: "为了项目，大家再坚持一下",
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
    title: "薪资泄露事件",
    description: "公司的薪资表格不慎泄露，发现薪资倒挂的员工非常愤怒。",
    options: [
      {
        id: "adjust_salary",
        label: "紧急调薪，消除倒挂",
        effects: {
          moraleDelta: 10,
          fundsDelta: -2000,
          relationshipDeltas: { delta: -10, all: true } // Some still jealous
        }
      },
      {
        id: "explain",
        label: "开会解释薪资结构的合理性",
        effects: {
          moraleDelta: -20,
          fundsDelta: 0,
          relationshipDeltas: { delta: -20, all: true }
        }
      }
    ]
  },
  // V8 季度目标相关团队事件
  {
    id: "quarter_celebration",
    title: "季度目标达成庆功宴",
    description: "这个季度的目标超额完成了！团队提议举办一场庆功宴来犒劳大家。",
    options: [
      {
        id: "grand_party",
        label: "包下整个餐厅庆祝！",
        effects: {
          moraleDelta: 30,
          fundsDelta: -1500,
          relationshipDeltas: { delta: 25, all: true },
          progressDelta: 10
        }
      },
      {
        id: "modest_celebration",
        label: "办公室订个蛋糕意思一下",
        effects: {
          moraleDelta: 10,
          fundsDelta: -200,
          relationshipDeltas: { delta: 5, all: true }
        }
      },
      {
        id: "no_celebration",
        label: "别松懈，下季度目标更难",
        effects: {
          moraleDelta: -15,
          fundsDelta: 0,
          relationshipDeltas: { delta: -5, all: true },
          progressDelta: 5
        }
      }
    ]
  },
  {
    id: "quarter_failure_recovery",
    title: "季度目标失败复盘会",
    description: "这个季度的目标没能完成，团队士气低迷。需要决定如何面对这次失败。",
    options: [
      {
        id: "blame_session",
        label: "逐个复盘，找到责任人",
        effects: {
          moraleDelta: -25,
          fundsDelta: 0,
          relationshipDeltas: { delta: -20, all: true },
          progressDelta: 5
        }
      },
      {
        id: "forward_looking",
        label: "不追究过去，专注下季度改进计划",
        effects: {
          moraleDelta: 10,
          fundsDelta: 0,
          relationshipDeltas: { delta: 10, all: true },
          progressDelta: -5
        }
      },
      {
        id: "team_building",
        label: "组织一次团建，重振士气",
        effects: {
          moraleDelta: 20,
          fundsDelta: -800,
          relationshipDeltas: { delta: 15, all: true }
        }
      }
    ]
  },
  {
    id: "investor_visit",
    title: "投资人突然到访",
    description: "投资人临时通知要来公司看看，团队需要决定如何展示。",
    options: [
      {
        id: "full_polish",
        label: "紧急美化办公室和 demo",
        effects: {
          moraleDelta: -10,
          fundsDelta: -500,
          progressDelta: -10
        }
      },
      {
        id: "authentic_show",
        label: "展示真实的工作状态",
        effects: {
          moraleDelta: 5,
          fundsDelta: 0,
          relationshipDeltas: { delta: 5, all: true }
        }
      },
      {
        id: "reschedule",
        label: "以『团队在冲刺』为由改期",
        effects: {
          moraleDelta: 10,
          fundsDelta: 0,
          progressDelta: 10
        }
      }
    ]
  }
];
