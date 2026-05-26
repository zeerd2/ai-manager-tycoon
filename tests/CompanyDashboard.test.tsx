import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CompanyDashboard } from '../src/components/CompanyDashboard';
import type { GameState } from '../src/domain/gameState';

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    funds: 5000,
    sprintCount: 4,
    agents: [],
    projects: [
      { id: 'proj-1', name: 'Todo App', deadline: 8, difficulty: 3, bugs: 2, techDebt: 5, progress: 60, status: 'active', reward: 2000 },
    ],
    completedProjectIds: ['proj-0'],
    unlockedAchievementIds: ['first_project'],
    history: [],
    relations: [],
    gameOver: false,
    reputation: 65,
    confidence: 70,
    ...overrides,
  };
}

describe('CompanyDashboard', () => {
  it('renders core dashboard metrics: funds, rating, reputation, confidence, achievements', () => {
    const state = createGameState();
    render(<CompanyDashboard gameState={state} selectedProjectId={null} />);

    expect(screen.getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText(/成就/)).toBeInTheDocument();
    expect(screen.getByText('回合 #')).toBeInTheDocument();
  });

  it('displays quarterly KPI targets and quarter info', () => {
    const state = createGameState({ sprintCount: 4 }); // sprintCount 4 → sprint 5 → quarter 2
    render(<CompanyDashboard gameState={state} selectedProjectId={null} />);

    expect(screen.getByText(/第 2 季度/)).toBeInTheDocument();
    expect(screen.getByText(/KPI/)).toBeInTheDocument();
    // KPI description text (not title, which isn't rendered directly)
    expect(screen.getByText('扩大业务，提升公司声望与团队凝聚信心。')).toBeInTheDocument();
  });

  it('shows selected project contract info with remaining sprints', () => {
    const state = createGameState({ sprintCount: 2 }); // deadline=8, so 6 remaining
    render(<CompanyDashboard gameState={state} selectedProjectId="proj-1" />);

    expect(screen.getByText('Todo App')).toBeInTheDocument();
    expect(screen.getByText(/剩余 6 回合/)).toBeInTheDocument();
  });

  it('displays overdue warning when project past deadline', () => {
    const state = createGameState({
      sprintCount: 10,
      projects: [{ id: 'proj-1', name: 'Todo App', deadline: 8, difficulty: 3, bugs: 2, techDebt: 5, progress: 60, status: 'active', reward: 2000 }],
    });
    render(<CompanyDashboard gameState={state} selectedProjectId="proj-1" />);

    expect(screen.getByText(/已逾期/)).toBeInTheDocument();
  });

  it('shows danger flash on funds bar when funds < 1000', () => {
    const state = createGameState({ funds: 500 });
    render(<CompanyDashboard gameState={state} selectedProjectId={null} />);

    const fundsBar = screen.getByText('$500').closest('.funds-bar');
    expect(fundsBar?.classList.contains('danger-flash')).toBe(true);
  });

  it('shows empty contract message when no project selected', () => {
    const state = createGameState();
    render(<CompanyDashboard gameState={state} selectedProjectId={null} />);

    expect(screen.getByText('未选定项目，请在项目列表中选择。')).toBeInTheDocument();
  });
});
