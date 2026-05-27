/**
 * 成就系统 UI 文案
 * 包含所有成就相关的界面文字、提示和通知
 */

export const achievementUI = {
  // ═══════════════════════════════════════════
  // 面板标题和统计
  // ═══════════════════════════════════════════
  panel: {
    title: '成就系统',
    subtitle: '记录你的辉煌时刻',
    counterTemplate: '({unlocked} / {total})',
    emptyState: '还没有解锁任何成就，继续努力吧！',
    completionMessage: '恭喜！你已解锁所有成就！',
  },

  // ═══════════════════════════════════════════
  // 分类标签
  // ═══════════════════════════════════════════
  categories: {
    all: '全部',
    employee: '员工相关',
    project: '项目相关',
    economic: '经济相关',
    incident: '事故/日常',
  },

  // ═══════════════════════════════════════════
  // 稀有度标签
  // ═══════════════════════════════════════════
  rarity: {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
  },

  // ═══════════════════════════════════════════
  // 稀有度描述（用于 tooltip）
  // ═══════════════════════════════════════════
  rarityDescription: {
    common: '基础成就，正常游玩即可解锁',
    rare: '稀有成就，需要特定策略或技巧',
    epic: '史诗成就，高难度挑战',
    legendary: '传说成就，极限挑战',
  },

  // ═══════════════════════════════════════════
  // 进度条文案
  // ═══════════════════════════════════════════
  progress: {
    label: '解锁进度',
    unlocked: '已解锁',
    locked: '未解锁',
    hidden: '???',
    hiddenDescription: '完成特定条件后解锁',
  },

  // ═══════════════════════════════════════════
  // 成就卡片文案
  // ═══════════════════════════════════════════
  card: {
    lockedIcon: '🔒',
    unlockedIcon: '🏆',
    conditionLabel: '解锁条件',
    rewardLabel: '奖励',
    tipLabel: '攻略提示',
  },

  // ═══════════════════════════════════════════
  // 成就通知文案
  // ═══════════════════════════════════════════
  toast: {
    title: '成就解锁！',
    subtitle: '恭喜你获得了新成就',
    dismiss: '知道了',
    viewAll: '查看全部成就',
    share: '分享成就',
  },

  // ═══════════════════════════════════════════
  // 成就详情弹窗
  // ═══════════════════════════════════════════
  detail: {
    title: '成就详情',
    unlockCondition: '解锁条件',
    description: '成就描述',
    progress: '当前进度',
    tip: '攻略提示',
    close: '关闭',
    locked: '未解锁',
    unlocked: '已解锁',
  },

  // ═══════════════════════════════════════════
  // 筛选和排序
  // ═══════════════════════════════════════════
  filter: {
    label: '筛选',
    all: '显示全部',
    unlocked: '已解锁',
    locked: '未解锁',
    byCategory: '按分类',
    byRarity: '按稀有度',
  },

  sort: {
    label: '排序',
    default: '默认顺序',
    rarity: '按稀有度',
    progress: '按进度',
    recent: '最近解锁',
  },

  // ═══════════════════════════════════════════
  // 统计面板
  // ═══════════════════════════════════════════
  stats: {
    title: '成就统计',
    totalUnlocked: '已解锁成就',
    completionRate: '完成率',
    byCategory: '分类统计',
    byRarity: '稀有度统计',
    recentActivity: '最近活动',
  },

  // ═══════════════════════════════════════════
  // 引导文案
  // ═══════════════════════════════════════════
  guide: {
    firstTime: '欢迎来到成就系统！完成游戏中的各种挑战来解锁成就吧。',
    hint: '提示：某些成就需要特定的策略或条件才能解锁。',
    hiddenHint: '有 3 个隐藏成就等待你去发现...',
    completionHint: '解锁所有成就将证明你是真正的 AI 管理大师！',
  },

  // ═══════════════════════════════════════════
  // 错误和边界情况
  // ═══════════════════════════════════════════
  error: {
    loadFailed: '加载成就数据失败',
    noAchievements: '暂无成就数据',
    progressError: '无法计算进度',
  },

  // ═══════════════════════════════════════════
  // 快捷键提示
  // ═══════════════════════════════════════════
  shortcuts: {
    openPanel: '打开成就面板',
    closePanel: '关闭成就面板',
    nextCategory: '下一个分类',
    prevCategory: '上一个分类',
  },
} as const;

/**
 * 获取稀有度对应的 CSS 类名
 */
export function getRarityClass(rarity: string): string {
  return `rarity-${rarity}`;
}

/**
 * 获取稀有度对应的图标
 */
export function getRarityIcon(rarity: string): string {
  switch (rarity) {
    case 'common': return '⬜';
    case 'rare': return '🟦';
    case 'epic': return '🟪';
    case 'legendary': return '🟨';
    default: return '⬜';
  }
}

/**
 * 格式化成就计数
 */
export function formatAchievementCount(unlocked: number, total: number): string {
  return achievementUI.panel.counterTemplate
    .replace('{unlocked}', String(unlocked))
    .replace('{total}', String(total));
}

/**
 * 获取成就完成百分比
 */
export function getCompletionPercentage(unlocked: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((unlocked / total) * 100);
}

/**
 * 生成成就分享文本
 */
export function generateShareText(achievementName: string, emoji: string): string {
  return `我在 AI Manager Tycoon 中解锁了成就「${emoji} ${achievementName}」！`;
}
