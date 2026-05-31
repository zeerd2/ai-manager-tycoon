import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MobileSectionNav, type MainSectionId } from '../src/components/MobileSectionNav';
import { MobileFullscreenPanel } from '../src/components/MobileFullscreenPanel';

const sections: Array<{ id: MainSectionId; label: string }> = [
  { id: 'team', label: '团队' },
  { id: 'project', label: '项目' },
  { id: 'strategy', label: '策略' },
  { id: 'result', label: '结果' },
  { id: 'history', label: '记录' },
];

describe('mobile responsive navigation', () => {
  it('renders touch-first section tabs with accessible selected state', () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav sections={sections} activeSection="project" onSelect={() => {}} />
    );

    expect(html).toContain('aria-label="移动端主界面导航"');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-controls="main-section-project"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('项目');
  });

  it('keeps mobile layouts inside narrow viewports through reusable CSS rules', () => {
    const appCss = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');
    const mobileCss = readFileSync(join(process.cwd(), 'src/components/mobile.css'), 'utf8');

    expect(appCss).toContain('@media (max-width: 768px)');
    expect(appCss).toContain('overflow-x: hidden');
    expect(mobileCss).toContain('.mobile-section-nav');
    expect(appCss).toContain('grid-template-columns: 1fr');
    expect(appCss).toContain('minmax(0, 1fr)');
  });

  it('renders MobileFullscreenPanel with correct title and accessibility role when open', () => {
    const html = renderToStaticMarkup(
      <MobileFullscreenPanel title="测试面板" isOpen={true} onClose={() => {}}>
        <div>内容</div>
      </MobileFullscreenPanel>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="测试面板"');
    expect(html).toContain('测试面板');
    expect(html).toContain('内容');
  });

  it('does not render MobileFullscreenPanel when closed', () => {
    const html = renderToStaticMarkup(
      <MobileFullscreenPanel title="测试面板" isOpen={false} onClose={() => {}}>
        <div>内容</div>
      </MobileFullscreenPanel>
    );

    expect(html).toBe('');
  });
});
