import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AchievementDetailModal } from '../src/components/AchievementDetailModal';
import type { Achievement } from '../src/domain/achievement';
import type { GameState } from '../src/domain/gameState';

const mockAchievement: Achievement = {
  id: 'first-blood',
  name: '一血',
  emoji: '🎯',
  description: '完成第一个项目',
  conditionType: 'first_project_completed',
  category: 'project',
  rarity: 'common',
};

const makeGameState = (overrides: Partial<GameState> = {}): GameState => ({
  funds: 5000,
  sprintCount: 3,
  agents: [],
  projects: [],
  completedProjectIds: ['chatbot'],
  unlockedAchievementIds: ['first-blood'],
  gameOver: false,
  history: [],
  relations: [],
  reputation: 50,
  confidence: 50,
  ...overrides,
});

describe('AchievementDetailModal', () => {
  it('renders achievement name and emoji when unlocked', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={mockAchievement}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('一血');
    expect(html).toContain('🎯');
    expect(html).toContain('完成第一个项目');
    expect(html).toContain('已解锁');
  });

  it('renders locked state when not unlocked', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={mockAchievement}
        isUnlocked={false}
        gameState={makeGameState({ unlockedAchievementIds: [], completedProjectIds: [] })}
        onClose={onClose}
      />
    );
    expect(html).toContain('一血');
    expect(html).toContain('🔒');
    expect(html).toContain('??? 未解锁');
    expect(html).toContain('未解锁');
  });

  it('renders rarity and category badges', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={mockAchievement}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('rarity-common');
    expect(html).toContain('项目相关');
  });

  it('renders progress bar', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={mockAchievement}
        isUnlocked={false}
        gameState={makeGameState({ completedProjectIds: [] })}
        onClose={onClose}
      />
    );
    expect(html).toContain('achievement-detail-progress');
    expect(html).toContain('0 / 1');
  });

  it('renders epic rarity correctly', () => {
    const epicAch: Achievement = {
      ...mockAchievement,
      rarity: 'epic',
      name: '10x 神级公司',
    };
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={epicAch}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('史诗');
    expect(html).toContain('rarity-epic');
    expect(html).toContain('10x 神级公司');
  });

  it('renders legendary rarity correctly', () => {
    const legendaryAch: Achievement = {
      ...mockAchievement,
      rarity: 'legendary',
      name: '全员自闭',
    };
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={legendaryAch}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('传说');
    expect(html).toContain('rarity-legendary');
  });

  it('renders close button', () => {
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={mockAchievement}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('achievement-detail-close');
  });

  it('renders employee category badge', () => {
    const employeeAch: Achievement = {
      ...mockAchievement,
      category: 'employee',
    };
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={employeeAch}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('员工相关');
  });

  it('renders economic category badge', () => {
    const economicAch: Achievement = {
      ...mockAchievement,
      category: 'economic',
    };
    const onClose = vi.fn();
    const html = renderToStaticMarkup(
      <AchievementDetailModal
        achievement={economicAch}
        isUnlocked={true}
        gameState={makeGameState()}
        onClose={onClose}
      />
    );
    expect(html).toContain('经济相关');
  });
});
