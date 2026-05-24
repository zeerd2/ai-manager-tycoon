import type { Strategy } from '../domain/strategy';

interface Props {
  strategies: Strategy[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function StrategySelector({ strategies, selectedId, onSelect }: Props) {
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
      ))}
    </div>
  );
}
