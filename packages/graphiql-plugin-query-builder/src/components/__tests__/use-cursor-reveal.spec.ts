import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fieldSegment } from '../../lib/ast-path';
import { useCursorReveal } from '../use-cursor-reveal';

const cursorPath = [fieldSegment('parent'), fieldSegment('child')];

afterEach(() => vi.useRealTimers());

describe('cursor reveal state', () => {
  it('reopens newly matching ancestors even when the cursor event is unchanged', () => {
    const { result, rerender } = renderHook(
      ({ path }) => useCursorReveal(path, cursorPath),
      { initialProps: { path: [fieldSegment('other')] } },
    );
    expect(result.current.expanded).toBe(false);

    rerender({ path: [fieldSegment('parent')] });
    expect(result.current.expanded).toBe(true);

    act(() => result.current.setExpanded(false));
    rerender({ path: [fieldSegment('parent')] });
    expect(result.current.expanded).toBe(false);

    rerender({ path: [fieldSegment('other')] });
    rerender({ path: [fieldSegment('parent')] });
    expect(result.current.expanded).toBe(true);
  });

  it('starts a fresh highlight when a node becomes the target again', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ path }) => useCursorReveal(path, cursorPath),
      { initialProps: { path: cursorPath } },
    );
    expect(result.current.flash).toBe(true);
    act(() => vi.advanceTimersByTime(700));
    expect(result.current.flash).toBe(false);

    rerender({ path: [fieldSegment('other')] });
    expect(result.current.flash).toBe(false);
    rerender({ path: cursorPath });
    expect(result.current.flash).toBe(true);
  });
});
