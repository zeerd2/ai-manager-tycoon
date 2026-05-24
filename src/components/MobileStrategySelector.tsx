import { memo } from 'react';
import type { Strategy } from '../domain/strategy';

interface Props {
  strategies: Strategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export const MobileStrategySelector = memo(function MobileStrategySelector({ strategies, selectedId, onSelect }: Props) {
  return (
    <div className="mobile-strategy-selector">
      {strategies.map(s => {
        const isSelected = selectedId === s.id;
        return (
          <div
            key={s.id}
            className={`mobile-strategy-card ${isSelected ? 'selected' : ''}`}
            onClick={() => onSelect(s.id)}
          >
            <div className="mobile-strategy-header">
              <h4>{s.name}</h4>
              <input
                type="radio"
                checked={isSelected}
                onChange={() => {}} // Controlled by div onClick
                className="mobile-strategy-radio"
              />
            </div>
            <p className="strategy-desc">{s.description}</p>
            <div className="mobile-strategy-mods">
              <span className={s.modifiers.progressMul >= 1 ? 'positive' : 'negative'}>
                进度: x{s.modifiers.progressMul}
              </span>
              <span className={s.modifiers.bugMul <= 1 ? 'positive' : 'negative'}>
                Bug: x{s.modifiers.bugMul}
              </span>
              <span className={s.modifiers.techDebtMul <= 1 ? 'positive' : 'negative'}>
                技术债: x{s.modifiers.techDebtMul}
              </span>
              <span className={s.modifiers.moraleDelta >= 0 ? 'positive' : 'negative'}>
                士气: {s.modifiers.moraleDelta > 0 ? '+' : ''}{s.modifiers.moraleDelta}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
});
