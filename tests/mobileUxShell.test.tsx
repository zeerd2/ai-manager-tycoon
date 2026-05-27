import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App';
import { GameStateProvider } from '../src/context/GameStateContext';

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

describe('mobile UX shell', () => {
  it('renders the mobile one-screen command center with compact selection state', () => {
    const html = renderToStaticMarkup(<GameStateProvider><App /></GameStateProvider>);

    expect(html).toContain('class="mobile-command-center"');
    expect(html).toContain('移动端主控台');
    expect(html).toContain('当前选择');
    expect(html).toContain('已选员工');
    expect(html).toContain('项目');
    expect(html).toContain('策略');
    expect(html).toContain('开始 Sprint');
  });

  it('renders fixed bottom tabs and the fullscreen overlay entry points', () => {
    const html = renderToStaticMarkup(<GameStateProvider><App /></GameStateProvider>);

    expect(html).toContain('class="mobile-bottom-tabbar"');
    expect(html).toContain('aria-label="移动端底部功能导航"');
    expect(html).toContain('aria-controls="mobile-overlay-team"');
    expect(html).toContain('团队');
    expect(html).toContain('项目');
    expect(html).toContain('策略');
    expect(html).toContain('成就');
    expect(html).toContain('历史');
  });

  it('keeps the mobile shell one-screen only below the 768px breakpoint', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');

    expect(css).toContain('@media (max-width: 768px)');
    expect(css).toContain('height: 100dvh');
    expect(css).toContain('max-height: 100dvh');
    expect(css).toContain('overflow: hidden');
    expect(css).toContain('.mobile-command-center');
    expect(css).toContain('min-height: 0');
    expect(css).toContain('.mobile-bottom-tabbar');
    expect(css).toContain('position: fixed');
    expect(css).toContain('bottom: 0');
    expect(css).toContain('.mobile-overlay');
    expect(css).toContain('position: fixed');
    expect(css).toContain('@media (min-width: 769px)');
  });

  it('compacts the mobile dashboard and sprint action for 375 to 430px screens', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');

    expect(css).toContain('@media (max-width: 430px)');
    expect(css).toContain('grid-template-columns: repeat(4, minmax(0, 1fr))');
    expect(css).toContain('.mobile-start-sprint');
    expect(css).toContain('max-width: none');
    expect(css).toContain('padding-bottom: calc(72px + env(safe-area-inset-bottom))');
  });
});
