import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MobileSectionNav, type MainSectionId } from '../src/components/MobileSectionNav';

const sections: Array<{ id: MainSectionId; label: string }> = [
  { id: 'team', label: '团队' },
  { id: 'project', label: '项目' },
  { id: 'strategy', label: '策略' },
  { id: 'achievement', label: '成就' },
  { id: 'history', label: '历史' },
];

describe('mobile responsive navigation', () => {
  it('renders touch-first section tabs with accessible selected state', () => {
    const html = renderToStaticMarkup(
      <MobileSectionNav sections={sections} activeSection="project" onSelect={() => {}} />
    );

    expect(html).toContain('aria-label="移动端底部功能导航"');
    expect(html).toContain('mobile-bottom-nav');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-controls="mobile-secondary-panel"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('项目');
  });

  it('keeps mobile layouts inside narrow viewports through reusable CSS rules', () => {
    const css = readFileSync(join(process.cwd(), 'src/App.css'), 'utf8');

    expect(css).toContain('@media (max-width: 767px)');
    expect(css).toContain('overflow-x: hidden');
    expect(css).toContain('.mobile-section-nav');
    expect(css).toContain('position: fixed');
    expect(css).toContain('.mobile-sheet-panel');
    expect(css).toContain('minmax(0, 1fr)');
  });
});
