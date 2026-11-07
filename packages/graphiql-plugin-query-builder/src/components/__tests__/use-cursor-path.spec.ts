import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installGraphiQLReactMock } from './graphiql-react-mock';
import { useCursorContext } from '../use-cursor-path';

vi.mock('@graphiql/react', async () => {
  const actual =
    await vi.importActual<typeof import('@graphiql/react')>('@graphiql/react');
  return {
    ...actual,
    useGraphiQL: vi.fn(),
    useGraphiQLActions: vi.fn(),
    useMonaco: vi.fn(),
  };
});

describe('useCursorContext', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('follows the cursor into an operation completed by typing', () => {
    let text = 'query Q { __typename }';
    let offset = text.indexOf('__typename');
    let contentChanged: ((event: { isFlush: boolean }) => void) | undefined;
    let cursorChanged: ((event: { reason: number }) => void) | undefined;
    installGraphiQLReactMock({
      queryEditor: {
        getModel: () => ({
          getValue: () => text,
          getOffsetAt: () => offset,
        }),
        getPosition: () => ({ lineNumber: 1, column: 1 }),
        onDidChangeCursorPosition(
          callback: (event: { reason: number }) => void,
        ) {
          cursorChanged = callback;
          return { dispose() {} };
        },
        onDidChangeModelContent(
          callback: (event: { isFlush: boolean }) => void,
        ) {
          contentChanged = callback;
          return { dispose() {} };
        },
      },
    });
    const { result } = renderHook(() => useCursorContext());
    expect(result.current.target).toEqual({ kind: 'operation', name: 'Q' });

    text += '\nmutation M { __typename }';
    offset = text.indexOf('__typename', text.indexOf('mutation'));
    act(() => {
      contentChanged?.({ isFlush: false });
      vi.advanceTimersByTime(100);
    });
    expect(result.current.target).toEqual({ kind: 'operation', name: 'M' });

    offset = text.indexOf('__typename');
    act(() => {
      contentChanged?.({ isFlush: true });
      vi.advanceTimersByTime(100);
    });
    expect(result.current.target).toEqual({ kind: 'operation', name: 'M' });

    act(() => {
      cursorChanged?.({ reason: 3 });
      vi.advanceTimersByTime(100);
    });
    expect(result.current.target).toEqual({ kind: 'operation', name: 'Q' });
  });
});
