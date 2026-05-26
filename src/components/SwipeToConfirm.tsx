import { useRef, useState, useCallback } from 'react';

interface Props {
  label: string;
  disabled?: boolean;
  onConfirm: () => void;
  className?: string;
}

export function SwipeToConfirm({ label, disabled, onConfirm, className }: Props) {
  const [progress, setProgress] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef({ startX: 0, currentX: 0 });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || confirmed) return;
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.currentX = e.touches[0].clientX;
  }, [disabled, confirmed]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || confirmed || !trackRef.current) return;
    const touch = e.touches[0];
    touchRef.current.currentX = touch.clientX;
    const trackWidth = trackRef.current.offsetWidth;
    const thumbWidth = 52;
    const maxTravel = trackWidth - thumbWidth - 8;
    const delta = touch.clientX - touchRef.current.startX;
    const pct = Math.max(0, Math.min(100, (delta / maxTravel) * 100));
    setProgress(pct);
  }, [disabled, confirmed]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || confirmed) return;
    if (progress >= 85) {
      setConfirmed(true);
      setProgress(100);
      onConfirm();
    } else {
      setProgress(0);
    }
  }, [disabled, confirmed, progress, onConfirm]);

  const handleTouchCancel = useCallback(() => {
    if (!confirmed) setProgress(0);
  }, [confirmed]);

  return (
    <div
      ref={trackRef}
      className={`swipe-to-confirm ${disabled ? 'disabled' : ''} ${confirmed ? 'confirmed' : ''} ${className || ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <div className="swipe-track-fill" style={{ width: `${progress}%` }} />
      <div
        className="swipe-thumb"
        style={{ transform: `translateX(${progress * 0.01 * (trackRef.current ? trackRef.current.offsetWidth - 60 : 200)}px)` }}
      >
        {confirmed ? '✓' : '→'}
      </div>
      <span className="swipe-label">{confirmed ? '已确认!' : label}</span>
    </div>
  );
}
