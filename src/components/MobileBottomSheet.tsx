import { useId, type ReactNode } from 'react';

interface Props {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileBottomSheet({ title, isOpen, onClose, children }: Props) {
  const titleId = useId();

  if (!isOpen) return null;

  return (
    <div className="mobile-sheet-backdrop" onClick={onClose}>
      <section
        id="mobile-secondary-panel"
        className="mobile-sheet-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mobile-sheet-header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="mobile-sheet-close" onClick={onClose} aria-label="关闭">
            关闭
          </button>
        </header>
        <div className="mobile-sheet-body">
          {children}
        </div>
      </section>
    </div>
  );
}
