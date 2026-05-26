import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';

const storage = new Map<string, string>();

beforeEach(() => {
  storage.clear();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
  });
});

describe('touch gesture features', () => {
  it('renders the swipe-to-confirm slider', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('swipe-to-confirm');
    expect(html).toContain('滑动开始 Sprint');
  });

  it('renders the hamburger menu button', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('mobile-hamburger-btn');
    expect(html).toContain('打开菜单');
  });

  it('renders the edge touch zone for drawer swipe-in', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('mobile-edge-touch-zone');
  });

  it('renders the mobile drawer component', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain('mobile-drawer');
    expect(html).toContain('drawer-title');
    expect(html).toContain('AI Manager Tycoon');
  });

  it('renders overlay dismiss hint styles', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');
    expect(css).toContain('.mobile-overlay-dismiss-hint');
    expect(css).toContain('.swipe-to-confirm');
    expect(css).toContain('.swipe-thumb');
    expect(css).toContain('.swipe-track-fill');
  });

  it('renders drawer CSS styles', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');
    expect(css).toContain('.mobile-drawer');
    expect(css).toContain('.mobile-hamburger-btn');
    expect(css).toContain('.hamburger-line');
    expect(css).toContain('.mobile-drawer-overlay');
    expect(css).toContain('.drawer-nav-item');
    expect(css).toContain('.mobile-edge-touch-zone');
  });

  it('renders active tab styling for bottom tabbar', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');
    expect(css).toContain('.mobile-bottom-tab.active');
  });

  it('renders project section auto-expand animation styles', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');
    expect(css).toContain('.project-panel.auto-expanded');
    expect(css).toContain('.project-panel .card-grid');
  });
});
