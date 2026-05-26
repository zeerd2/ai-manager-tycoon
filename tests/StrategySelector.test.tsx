import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StrategySelector } from '../src/components/StrategySelector';
import type { Strategy } from '../src/domain/strategy';

const strategies: Strategy[] = [
  {
    id: 'agile',
    name: '敏捷开发',
    description: '快速迭代，适应变化',
    modifiers: { progressMul: 1.2, bugMul: 0.8, techDebtMul: 0.9, moraleDelta: 5, incidentChanceMul: 1 },
  },
  {
    id: 'waterfall',
    name: '瀑布模型',
    description: '严格按阶段推进',
    modifiers: { progressMul: 0.9, bugMul: 1.1, techDebtMul: 1.2, moraleDelta: -5, incidentChanceMul: 0.8 },
  },
];

describe('StrategySelector', () => {
  it('renders all strategies with name and description', () => {
    render(<StrategySelector strategies={strategies} selectedId={null} onSelect={vi.fn()} />);

    expect(screen.getByText('敏捷开发')).toBeInTheDocument();
    expect(screen.getByText('快速迭代，适应变化')).toBeInTheDocument();
    expect(screen.getByText('瀑布模型')).toBeInTheDocument();
    expect(screen.getByText('严格按阶段推进')).toBeInTheDocument();
  });

  it('applies selected class to the selected strategy card', () => {
    render(<StrategySelector strategies={strategies} selectedId="agile" onSelect={vi.fn()} />);

    const cards = screen.getByText('敏捷开发').closest('.strategy-card');
    expect(cards?.classList.contains('selected')).toBe(true);

    const waterfallCard = screen.getByText('瀑布模型').closest('.strategy-card');
    expect(waterfallCard?.classList.contains('selected')).toBe(false);
  });

  it('calls onSelect with strategy id when a card is clicked', () => {
    const onSelect = vi.fn();
    render(<StrategySelector strategies={strategies} selectedId={null} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('瀑布模型'));
    expect(onSelect).toHaveBeenCalledWith('waterfall');
  });

  it('renders modifier values with correct positive/negative class', () => {
    render(<StrategySelector strategies={strategies} selectedId={null} onSelect={vi.fn()} />);

    // Agile: progressMul 1.2 (positive), bugMul 0.8 (positive), techDebtMul 0.9 (positive), moraleDelta +5 (positive)
    const agileCard = screen.getByText('敏捷开发').closest('.strategy-card')!;
    expect(agileCard.innerHTML).toContain('进度: x1.2');
    expect(agileCard.innerHTML).toContain('Bug: x0.8');

    const positiveEls = agileCard.querySelectorAll('.positive');
    expect(positiveEls.length).toBeGreaterThan(0);
  });
});
