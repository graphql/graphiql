import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { VirtualList } from '../virtual-list';

describe('VirtualList', () => {
  it('renders every item via the fallback path when the scroll element has no layout (JSDOM)', () => {
    const items = Array.from({ length: 5 }, (_, i) => `item-${i}`);
    const { container } = render(
      <VirtualList
        items={items}
        estimateSize={() => 36}
        renderItem={item => <span data-testid="item">{item}</span>}
      />,
    );

    const rendered = container.querySelectorAll('[data-testid="item"]');
    expect(rendered).toHaveLength(5);
    expect(Array.from(rendered, el => el.textContent)).toEqual([
      'item-0',
      'item-1',
      'item-2',
      'item-3',
      'item-4',
    ]);
  });

  it('renders nothing and does not crash with an empty items array', () => {
    const { container } = render(
      <VirtualList
        items={[]}
        estimateSize={() => 36}
        renderItem={item => <span data-testid="item">{String(item)}</span>}
      />,
    );

    expect(container.querySelectorAll('[data-testid="item"]')).toHaveLength(0);
  });
});
