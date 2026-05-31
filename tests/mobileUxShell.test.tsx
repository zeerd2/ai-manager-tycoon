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

describe('mobile UX shell', () => {
  it('renders the mobile one-screen command center with compact selection state', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('class="mobile-command-center"');
    expect(html).toContain('移动端主控台');
    expect(html).toContain('当前选择');
    expect(html).toContain('已选员工');
    expect(html).toContain('项目');
    expect(html).toContain('策略');
    expect(html).toContain('开始 Sprint');
  });

  it('renders fixed bottom tabs and the fullscreen overlay entry points', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('class="mobile-bottom-tabbar"');
    expect(html).toContain('aria-label="移动端底部功能导航"');
    expect(html).toContain('aria-controls="mobile-overlay-team"');
    expect(html).toContain('mobile-bottom-run');
    expect(html).toContain('执行');
    expect(html).toContain('团队');
    expect(html).toContain('项目');
    expect(html).toContain('策略');
    expect(html).toContain('成就');
    expect(html).toContain('历史');
  });

  it('keeps the mobile shell one-screen only below the 768px breakpoint', () => {
    const mobileCss = readFileSync(join(process.cwd(), 'src/components/mobile.css'), 'utf8');

    expect(mobileCss).toContain('@media (max-width: 768px)');
    expect(mobileCss).toContain('.mobile-command-center');
    expect(mobileCss).toContain('min-height: 0');
    expect(mobileCss).toContain('.mobile-bottom-tabbar');
    expect(mobileCss).toContain('position: fixed');
    expect(mobileCss).toContain('bottom: 0');
    expect(mobileCss).toContain('.mobile-bottom-run');
    expect(mobileCss).toContain('.mobile-overlay');
    expect(mobileCss).toContain('position: fixed');
    expect(mobileCss).toContain('@media (min-width: 769px)');
  });

  it('compacts the mobile dashboard and sprint action for 375 to 430px screens', () => {
    const mobileCss = readFileSync(join(process.cwd(), 'src/components/mobile.css'), 'utf8');
    const appCss = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');

    expect(mobileCss).toContain('@media (max-width: 430px)');
    expect(mobileCss).toContain('.mobile-start-sprint');
    expect(mobileCss).toContain('max-width: none');
    expect(appCss).toContain('padding-bottom: calc(72px + env(safe-area-inset-bottom))');
  });
});
