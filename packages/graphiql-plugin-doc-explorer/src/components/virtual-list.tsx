import { useVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode } from 'react';
import { useState } from 'react';

type VirtualListProps<T> = {
  items: readonly T[];
  estimateSize: (index: number) => number;
  renderItem: (item: T, index: number) => ReactNode;
};

export function VirtualList<T>({
  items,
  estimateSize,
  renderItem,
}: VirtualListProps<T>) {
  // React Compiler memoizes this component's output. Because `virtualizer` is a
  // stable instance, the compiler treats the render as cacheable and skips the
  // re-renders that TanStack Virtual's internal useReducer dispatch triggers
  // on scroll/resize. Disabling memoization here keeps scroll-driven updates working.
  'use no memo';

  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollEl,
    estimateSize,
    overscan: 5,
    initialRect: { width: 0, height: 800 },
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={setScrollEl} style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      {virtualItems.length > 0 ? (
        <div
          style={{ height: virtualizer.getTotalSize(), position: 'relative' }}
        >
          {virtualItems.map(virtualRow => (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderItem(items[virtualRow.index]!, virtualRow.index)}
            </div>
          ))}
        </div>
      ) : (
        items.map((item, index) => (
          <div key={index} style={{ paddingBottom: 'var(--px-16)' }}>
            {renderItem(item, index)}
          </div>
        ))
      )}
    </div>
  );
}
