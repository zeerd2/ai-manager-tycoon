import { useRef, useState, useCallback } from 'react';

interface DrawerItem {
  id: string;
  label: string;
  icon: string;
}

interface Props {
  items: DrawerItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onReset: () => void;
  isOnline: boolean;
}

export function MobileDrawer({ items, activeId, onSelect, onReset, isOnline }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragX, setDragX] = useState(0);
  const touchRef = useRef({ startX: 0, startY: 0, currentX: 0, startTime: 0 });

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => { setIsOpen(false); setDragX(0); }, []);

  // 触控手势: 从屏幕左边缘右滑打开抽屉
  const handleEdgeTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= 20) {
      touchRef.current = { startX: touch.clientX, startY: touch.clientY, currentX: touch.clientX, startTime: Date.now() };
    }
  }, []);

  const handleEdgeTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchRef.current.startX;
    const deltaY = touch.clientY - touchRef.current.startY;
    if (touchRef.current.startX <= 20 && deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();
      setDragX(Math.min(deltaX, 260));
    }
  }, []);

  const handleEdgeTouchEnd = useCallback(() => {
    const delta = dragX;
    const elapsed = Date.now() - touchRef.current.startTime;
    const velocity = elapsed > 0 ? delta / elapsed : 0;
    if (delta > 80 || velocity > 0.5) {
      open();
    }
    setDragX(0);
  }, [dragX, open]);

  // 抽屉内部滑动关闭
  const handleDrawerTouchStart = useCallback((e: React.TouchEvent) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
  }, []);

  const handleDrawerTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaX = e.changedTouches[0].clientX - touchRef.current.startX;
    const deltaY = e.changedTouches[0].clientY - touchRef.current.startY;
    if (deltaX < -60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      close();
    }
  }, [close]);

  return (
    <>
      {/* 左边缘触控区域 */}
      <div
        className="mobile-edge-touch-zone"
        onTouchStart={handleEdgeTouchStart}
        onTouchMove={handleEdgeTouchMove}
        onTouchEnd={handleEdgeTouchEnd}
      />

      {/* 汉堡菜单按钮 */}
      <button className="mobile-hamburger-btn" onClick={open} aria-label="打开菜单">
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* 遮罩层 */}
      {(isOpen || dragX > 0) && (
        <div
          className="mobile-drawer-overlay"
          onClick={close}
          style={{ opacity: isOpen ? 0.5 : dragX / 520 }}
        />
      )}

      {/* 侧边抽屉 */}
      <div
        className={`mobile-drawer ${isOpen ? 'open' : ''}`}
        style={!isOpen && dragX > 0 ? { transform: `translateX(${-260 + dragX}px)` } : undefined}
        onTouchStart={handleDrawerTouchStart}
        onTouchEnd={handleDrawerTouchEnd}
      >
        <div className="mobile-drawer-header">
          <span className="drawer-title">AI Manager Tycoon</span>
          <button className="drawer-close-btn" onClick={close}>✕</button>
        </div>

        {!isOnline && (
          <div className="drawer-offline-badge">📶 离线模式</div>
        )}

        <nav className="mobile-drawer-nav">
          {items.map(item => (
            <button
              key={item.id}
              className={`drawer-nav-item ${activeId === item.id ? 'active' : ''}`}
              onClick={() => { onSelect(item.id); close(); }}
            >
              <span className="drawer-nav-icon">{item.icon}</span>
              <span className="drawer-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mobile-drawer-footer">
          <button className="drawer-action-btn" onClick={() => { onReset(); close(); }}>
            🔄 重置游戏
          </button>
        </div>
      </div>
    </>
  );
}
