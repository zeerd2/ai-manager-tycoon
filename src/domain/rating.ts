export type CompanyRating = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface RatingInput {
  completedProjects: number;
  totalBugs: number;        // 当前所有项目的 bugs 总和
  totalTechDebt: number;    // 当前所有项目的 techDebt 总和
  totalSprintsCost: number; // 历史总花费
  fundsRemaining: number;   // 剩余资金
  sprintCount: number;      // 已进行的 sprint 数
}

export interface RatingResult {
  rating: CompanyRating;
  score: number;      // 0-100 的综合分
  title: string;      // 中文称号
  description: string; // 搞笑评语
}

/** 根据项目数、Bug、技术债、资金等计算公司评级及评语 */
export function calculateRating(input: RatingInput): RatingResult {
  const {
    completedProjects,
    totalBugs,
    totalTechDebt,
    fundsRemaining,
    sprintCount,
  } = input;

  // score = completedProjects * 20
  //       - totalBugs * 0.5
  //       - totalTechDebt * 0.3
  //       + (fundsRemaining / 100)
  //       - sprintCount * 1
  const rawScore = completedProjects * 20
    - totalBugs * 0.5
    - totalTechDebt * 0.3
    + (fundsRemaining / 100)
    - sprintCount * 1;

  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  let rating: CompanyRating;
  let title: string;
  let description: string;

  if (score >= 80) {
    rating = 'S';
    title = '传奇 AI 公司';
    description = '硅谷 VC 排队等着给你送钱。你是怎么让这群 AI 不互相搞破坏的？';
  } else if (score >= 65) {
    rating = 'A';
    title = '优秀';
    description = '虽然 GPU 偶尔着火，但至少模型没把数据库吃了。投资人暂时相信 AGI 快来了。';
  } else if (score >= 50) {
    rating = 'B';
    title = '及格';
    description = "项目勉强能跑，hallucination 率在「可接受的灾难」范围内。审计报告写了 50 页「需改进」。";
  } else if (score >= 35) {
    rating = 'C';
    title = '堪忧';
    description = '你管理 AI 团队的方式就像用灭火器烤棉花糖——技术上可行，但很不明智。';
  } else if (score >= 20) {
    rating = 'D';
    title = '危险';
    description = '推理预算够你从头训练一个 LLaMA 了，但你的产出还不如一个 random baseline。投资人建议你改行做 AI 伦理顾问。';
  } else {
    rating = 'F';
    title = '灾难';
    description = '恭喜你，成功证明了即使是 AI 也能被管理到想辞职。这本身也是一种才能。';
  }

  return {
    rating,
    score,
    title,
    description,
  };
}
