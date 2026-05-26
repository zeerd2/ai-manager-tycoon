import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SwipeToConfirm } from '../src/components/SwipeToConfirm';

describe('SwipeToConfirm', () => {
  it('renders with label and swipe classes', () => {
    const html = renderToStaticMarkup(
      <SwipeToConfirm label="滑动确认" onConfirm={() => {}} />
    );
    expect(html).toContain('swipe-to-confirm');
    expect(html).toContain('swipe-thumb');
    expect(html).toContain('swipe-track-fill');
    expect(html).toContain('滑动确认');
  });

  it('renders disabled state', () => {
    const html = renderToStaticMarkup(
      <SwipeToConfirm label="滑动确认" onConfirm={() => {}} disabled />
    );
    expect(html).toContain('disabled');
  });

  it('renders without disabled class when enabled', () => {
    const html = renderToStaticMarkup(
      <SwipeToConfirm label="滑动确认" onConfirm={() => {}} />
    );
    expect(html).not.toContain('disabled');
  });

  it('applies custom className', () => {
    const html = renderToStaticMarkup(
      <SwipeToConfirm label="滑动确认" onConfirm={() => {}} className="my-class" />
    );
    expect(html).toContain('my-class');
  });
});
