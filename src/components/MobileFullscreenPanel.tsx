import { useEffect, type ReactNode } from 'react';

interface Props {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileFullscreenPanel({ title, isOpen, onClose, children }: Props) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="mobile-fullscreen-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="mobile-fullscreen-header">
        <h2>{title}</h2>
        <button
          type="button"
          className="mobile-fullscreen-close"
          onClick={onClose}
          aria-label="关闭面板"
        >
          ✕
        </button>
      </div>
      <div className="mobile-fullscreen-body">
        {children}
      </div>
    </div>
  );
}
