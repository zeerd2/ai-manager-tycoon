import type { ReactNode } from 'react';

interface Props {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileFullscreenPanel({ title, isOpen, onClose, children }: Props) {
  if (!isOpen) return null;

  return (
    <div className="mobile-fullscreen-panel-overlay">
      <div className="mobile-fullscreen-panel">
        <div className="mobile-panel-header">
          <h2>{title}</h2>
          <button className="mobile-panel-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="mobile-panel-body">
          {children}
        </div>
      </div>
    </div>
  );
}
