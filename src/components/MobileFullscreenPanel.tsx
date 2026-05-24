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
    <div className="mobile-fullscreen-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mobile-fullscreen-header">
        <h2>{title}</h2>
        <button className="mobile-fullscreen-close" onClick={onClose}>✕</button>
      </div>
      <div className="mobile-fullscreen-body">
        {children}
      </div>
    </div>
  );
}
