import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverScreen } from '../src/components/GameOverScreen';
import type { GameState } from '../src/domain/gameState';

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    funds: 2000,
    sprintCount: 8,
    agents: [],
    projects: [{ id: 'p1', name: 'Proj', deadline: 6, difficulty: 3, bugs: 5, techDebt: 10, progress: 100, status: 'completed', reward: 1000 }],
    completedProjectIds: ['p1'],
    unlockedAchievementIds: ['first-blood'],
    history: [{ sprint: 1, cost: 500, income: 1000, bugsFixed: 2, satisfaction: 80 }],
    relations: [],
    gameOver: true,
    gameOverReason: '资金耗尽，公司破产',
    reputation: 40,
    confidence: 35,
    ...overrides,
  };
}

describe('GameOverScreen', () => {
  it('renders game over title and reason', () => {
    const state = createGameState();
    render(<GameOverScreen gameState={state} onReset={vi.fn()} />);

    expect(screen.getByText('游戏结束')).toBeInTheDocument();
    expect(screen.getByText('资金耗尽，公司破产')).toBeInTheDocument();
  });

  it('displays final rating and stats', () => {
    const state = createGameState();
    render(<GameOverScreen gameState={state} onReset={vi.fn()} />);

    expect(screen.getByText('最终评级')).toBeInTheDocument();
    expect(screen.getByText(/完成项目数/)).toBeInTheDocument();
    expect(screen.getByText(/进行 Sprint 数/)).toBeInTheDocument();
    expect(screen.getByText(/最终资金/)).toBeInTheDocument();
  });

  it('shows unlocked achievements list', () => {
    const state = createGameState();
    render(<GameOverScreen gameState={state} onReset={vi.fn()} />);

    expect(screen.getByText(/已获成就/)).toBeInTheDocument();
  });

  it('shows empty achievements message when no achievements unlocked', () => {
    const state = createGameState({ unlockedAchievementIds: [] });
    render(<GameOverScreen gameState={state} onReset={vi.fn()} />);

    expect(screen.getByText('无已解锁成就')).toBeInTheDocument();
  });

  it('calls onReset when restart button is clicked', () => {
    const onReset = vi.fn();
    const state = createGameState();
    render(<GameOverScreen gameState={state} onReset={onReset} />);

    fireEvent.click(screen.getByText('再来一局'));
    expect(onReset).toHaveBeenCalledOnce();
  });
});
