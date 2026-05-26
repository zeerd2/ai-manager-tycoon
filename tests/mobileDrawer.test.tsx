import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MobileDrawer } from '../src/components/MobileDrawer';

const items = [
  { id: 'team', label: '团队', icon: '👥' },
  { id: 'project', label: '项目', icon: '📁' },
];

describe('MobileDrawer', () => {
  it('renders hamburger button and drawer structure', () => {
    const html = renderToStaticMarkup(
      <MobileDrawer items={items} activeId={null} onSelect={() => {}} onReset={() => {}} isOnline />
    );
    expect(html).toContain('mobile-hamburger-btn');
    expect(html).toContain('mobile-edge-touch-zone');
    expect(html).toContain('mobile-drawer');
    expect(html).toContain('打开菜单');
  });

  it('renders drawer items', () => {
    const html = renderToStaticMarkup(
      <MobileDrawer items={items} activeId={null} onSelect={() => {}} onReset={() => {}} isOnline />
    );
    expect(html).toContain('团队');
    expect(html).toContain('项目');
    expect(html).toContain('drawer-nav-item');
  });

  it('marks active item', () => {
    const html = renderToStaticMarkup(
      <MobileDrawer items={items} activeId="team" onSelect={() => {}} onReset={() => {}} isOnline />
    );
    expect(html).toContain('drawer-nav-item active');
  });

  it('shows offline badge when offline', () => {
    const html = renderToStaticMarkup(
      <MobileDrawer items={items} activeId={null} onSelect={() => {}} onReset={() => {}} isOnline={false} />
    );
    expect(html).toContain('drawer-offline-badge');
    expect(html).toContain('离线模式');
  });

  it('renders reset button in footer', () => {
    const html = renderToStaticMarkup(
      <MobileDrawer items={items} activeId={null} onSelect={() => {}} onReset={() => {}} isOnline />
    );
    expect(html).toContain('drawer-action-btn');
    expect(html).toContain('重置游戏');
  });
});
