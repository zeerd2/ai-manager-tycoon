import { memo } from 'react';
import type { Strategy } from '../domain/strategy';

interface Props {
  strategies: Strategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const StrategySelector = memo(function StrategySelector({ strategies, selectedId, onSelect }: Props) {
  return (
    <div className="strategy-selector">
      {strategies.map(s => (
        <div
          key={s.id}
          className={`strategy-card ${selectedId === s.id ? 'selected' : ''}`}
          onClick={() => onSelect(s.id)}
        >
          <h4>{s.name}</h4>
          <p>{s.description}</p>
          <div className="strategy-mods">
              <span className={s.modifiers.progressMul >= 1 ? 'positive' : 'negative'} title="此开发策略下，项目进度的修正系数。系数越高项目推进越快。">
                进度: x{s.modifiers.progressMul}
              </span>
              <span className={s.modifiers.bugMul <= 1 ? 'positive' : 'negative'} title="此开发策略下，产生 Bug 数量的修正系数。系数越低越不容易出现 Bug。">
                Bug: x{s.modifiers.bugMul}
              </span>
              <span className={s.modifiers.techDebtMul <= 1 ? 'positive' : 'negative'} title="此开发策略下，代码技术债的增加修正系数。">
                技术债: x{s.modifiers.techDebtMul}
              </span>
              <span className={s.modifiers.moraleDelta >= 0 ? 'positive' : 'negative'} title="每次执行 Sprint 后，参与工作的工程师士气变动值。">
                士气: {s.modifiers.moraleDelta > 0 ? '+' : ''}{s.modifiers.moraleDelta}
              </span>
          </div>
        </div>
      ))}
    </div>
  );
});
