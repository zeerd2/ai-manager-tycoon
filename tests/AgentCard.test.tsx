import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AgentCard } from '../src/components/AgentCard';
import type { Agent } from '../src/domain/agent';

function createAgent(overrides: Partial<Agent> = {}): Agent {
  return {
    id: 'agent-1',
    name: 'CodeBot X',
    model: 'gpt-4',
    role: '全栈工程师',
    avatar: '🤖',
    skills: { coding: 80, debugging: 70, architecture: 60, creativity: 50, speed: 75 },
    salary: 500,
    morale: 75,
    quirk: '喜欢深夜写代码',
    fatigue: 20,
    consecutiveSprints: 1,
    totalSprintsWorked: 5,
    locked: false,
    ...overrides,
  };
}

describe('AgentCard', () => {
  it('renders unlocked agent name, role, stats and efficiency', () => {
    const agent = createAgent();
    render(<AgentCard agent={agent} selected={false} onToggle={vi.fn()} />);

    expect(screen.getByText('CodeBot X')).toBeInTheDocument();
    expect(screen.getByText('全栈工程师')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText(/喜欢深夜写代码/)).toBeInTheDocument();
    expect(screen.getByText(/效率:/)).toBeInTheDocument();
    expect(screen.getByText(/士气: 75/)).toBeInTheDocument();
  });

  it('renders locked agent with lock overlay and grayscale avatar', () => {
    const agent = createAgent({ locked: true, unlockAfterSprints: 3 });
    render(<AgentCard agent={agent} selected={false} onToggle={vi.fn()} />);

    expect(screen.getByText('Sprint 3 后解锁')).toBeInTheDocument();
    expect(screen.getByText('CodeBot X')).toBeInTheDocument();
    // locked card should have dimmed styles
    const agentCard = screen.getByText('CodeBot X').closest('.agent-card');
    expect(agentCard?.classList.contains('locked')).toBe(true);
  });

  it('shows overwork warning when consecutiveSprints >= 3', () => {
    const agent = createAgent({ consecutiveSprints: 3 });
    render(<AgentCard agent={agent} selected={false} onToggle={vi.fn()} />);

    expect(screen.getByText('⚠️ 过劳警告')).toBeInTheDocument();
  });

  it('calls onToggle with agent id when clicked', () => {
    const onToggle = vi.fn();
    const agent = createAgent();
    render(<AgentCard agent={agent} selected={false} onToggle={onToggle} />);

    fireEvent.click(screen.getByText('CodeBot X').closest('.agent-card')!);
    expect(onToggle).toHaveBeenCalledWith('agent-1');
  });

  it('shows skill tree button and calls onOpenSkillTree when clicked', () => {
    const onOpenSkillTree = vi.fn();
    const agent = createAgent({ unlockedSkills: ['skill-1'] });
    render(
      <AgentCard
        agent={agent}
        selected={false}
        onToggle={vi.fn()}
        onOpenSkillTree={onOpenSkillTree}
      />
    );

    const skillTreeBtn = screen.getByText('技能树 (1)');
    expect(skillTreeBtn).toBeInTheDocument();

    fireEvent.click(skillTreeBtn);
    expect(onOpenSkillTree).toHaveBeenCalledWith('agent-1');
  });
});
