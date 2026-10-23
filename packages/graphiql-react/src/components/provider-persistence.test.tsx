import { Suspense } from 'react';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StorageAPI } from '@graphiql/toolkit';
import { GraphiQLProvider, useGraphiQL } from './provider';
import { STORAGE_KEY } from '../constants';
import type { SlicesWithActions } from '../types';

vi.mock('../stores/monaco', () => {
  const state = { actions: { async initialize() {} } };
  return {
    monacoStore: { getState: () => state, subscribe: () => () => {} },
    useMonaco: (selector?: (value: typeof state) => unknown) =>
      selector ? selector(state) : state,
  };
});

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('does not overwrite a completed save from an abandoned render', () => {
  const storage = new StorageAPI(localStorage);
  let suspend = true;
  const pending = new Promise(() => {});
  function PendingChild() {
    if (suspend) {
      throw pending;
    }
    return null;
  }
  const { result, rerender } = renderHook(() => useGraphiQL(state => state), {
    wrapper: ({ children }) => (
      <Suspense fallback={null}>
        <GraphiQLProvider
          fetcher={async () => ({ data: {} })}
          schema={null}
          initialQuery="query Older { hello }"
          storage={localStorage}
        >
          <PendingChild />
          {children}
        </GraphiQLProvider>
      </Suspense>
    ),
  });
  suspend = false;
  rerender();
  const query = 'query Saved { hello counter }';
  const tabId = result.current.tabs[0]!.id;
  act(() => {
    result.current.actions.setEditor({
      queryEditor: {
        getValue: () => query,
      } as SlicesWithActions['queryEditor'],
    });
    result.current.actions.markTabSaved(tabId);
    vi.advanceTimersByTime(500);
  });

  const saved = JSON.parse(storage.get(STORAGE_KEY.tabs)!);
  expect(saved.tabs[saved.activeTabIndex]).toMatchObject({
    id: tabId,
    query,
    lastSavedQuery: query,
  });
});
