'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { create } from 'zustand';
import { StorageAPI } from '@graphiql/toolkit';
import type { Transport, TransportResponse } from '@graphiql/toolkit';
import { createExecutionSlice, isResponseView } from './execution';
import { createStorageSlice } from './storage';
import { createEditorSlice } from './editor';
import { createTab } from '../utility/tabs';
import { TransportHookRegistry } from '../transport-hooks';
import { STORAGE_KEY } from '../constants';
import type { SlicesWithActions } from '../types';

function makeMemoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
    get length() {
      return data.size;
    },
    clear() {
      data.clear();
    },
  };
}

function makeStore() {
  const storage = new StorageAPI(makeMemoryStorage());
  const store = create<SlicesWithActions>((...args) => {
    const storageSlice = createStorageSlice({ storage })(...args);
    const executionSlice = createExecutionSlice({
      fetcher: vi.fn(),
      getDefaultFieldNames: undefined,
      overrideOperationName: null,
    })(...args);
    return {
      ...storageSlice,
      ...executionSlice,
      actions: {
        ...executionSlice.actions,
      } as any,
    } as SlicesWithActions;
  });
  return { store, storage };
}

/**
 * A fuller store, wiring `editor` alongside `execution`, so `run()`/`stop()`
 * can actually be driven end-to-end (they need `queryEditor`/`responseEditor`
 * plus the tab-related actions `run()` calls, like `updateActiveTabValues`).
 */
function makeRunnableStore(initial: { fetcher?: any; transport?: Transport }) {
  const storage = new StorageAPI(makeMemoryStorage());
  const tab = createTab({ query: 'query Foo { bar }' });

  const store = create<SlicesWithActions>((...args) => {
    const storageSlice = createStorageSlice({ storage })(...args);
    const editorSlice = createEditorSlice({
      activeTabIndex: 0,
      defaultHeaders: undefined,
      defaultQuery: '',
      externalFragments: new Map(),
      initialHeaders: '',
      initialQuery: '',
      initialVariables: '',
      onCopyQuery: undefined,
      onEditOperationName: undefined,
      onPrettifyQuery: async q => q,
      onTabChange: undefined,
      shouldPersistHeaders: false,
      tabs: [tab],
      uriInstanceId: 'test-',
    })(...args);
    const executionSlice = createExecutionSlice({
      fetcher: initial.fetcher,
      transport: initial.transport,
      getDefaultFieldNames: undefined,
      overrideOperationName: null,
    })(...args);

    return {
      ...storageSlice,
      ...editorSlice,
      ...executionSlice,
      actions: {
        ...editorSlice.actions,
        ...executionSlice.actions,
      } as any,
    } as SlicesWithActions;
  });

  const queryEditor = {
    getValue: vi.fn(() => 'query Foo { bar }'),
  } as any;
  const responseEditor = {
    getValue: vi.fn(() => ''),
    setValue: vi.fn(),
  } as any;
  store.getState().actions.setEditor({ queryEditor, responseEditor });

  return { store, queryEditor, responseEditor };
}

const tick = () => new Promise<void>(resolve => setTimeout(resolve, 0));

describe('isResponseView', () => {
  it('accepts the three known views', () => {
    expect(isResponseView('json')).toBe(true);
    expect(isResponseView('tree')).toBe(true);
    expect(isResponseView('table')).toBe(true);
  });

  it('rejects unknown values', () => {
    expect(isResponseView('graph')).toBe(false);
    expect(isResponseView('')).toBe(false);
    expect(isResponseView(null)).toBe(false);
    expect(isResponseView(42)).toBe(false);
  });
});

describe('setResponseView', () => {
  it('defaults to "json"', () => {
    const { store } = makeStore();
    expect(store.getState().responseView).toBe('json');
  });

  it('updates state on call', () => {
    const { store } = makeStore();
    store.getState().actions.setResponseView('tree');
    expect(store.getState().responseView).toBe('tree');
  });

  it('writes the new view to storage', () => {
    const { store, storage } = makeStore();
    store.getState().actions.setResponseView('table');
    expect(storage.get(STORAGE_KEY.responseView)).toBe('table');
  });

  it('persists across action calls', () => {
    const { store, storage } = makeStore();
    store.getState().actions.setResponseView('tree');
    store.getState().actions.setResponseView('json');
    expect(storage.get(STORAGE_KEY.responseView)).toBe('json');
  });
});

describe('dismissTransportUpgradeBanner', () => {
  it('defaults to not-dismissed', () => {
    const { store } = makeStore();
    expect(store.getState().transportUpgradeBannerDismissed).toBe(false);
  });

  it('flips state to true on call', () => {
    const { store } = makeStore();
    store.getState().actions.dismissTransportUpgradeBanner();
    expect(store.getState().transportUpgradeBannerDismissed).toBe(true);
  });

  it('persists the dismissal to storage', () => {
    const { store, storage } = makeStore();
    store.getState().actions.dismissTransportUpgradeBanner();
    expect(storage.get(STORAGE_KEY.transportUpgradeBannerDismissed)).toBe(
      'true',
    );
  });
});

describe('run/stop — subscription teardown', () => {
  /**
   * A `Transport` whose `send()` returns an object shaped exactly like
   * `transport-hooks.ts#wrap`'s output: `[Symbol.asyncIterator]()` mints a
   * brand-new, independently-disposable iterator on every call, instead of
   * returning the same one. `onReturn` is called with the id of whichever
   * iterator instance actually had `.return()` invoked on it.
   */
  function makeFreshIteratorTransport(onReturn: (id: number) => void) {
    let nextId = 0;
    let emittedCount = 0;
    const transport: Transport = {
      url: 'https://example.test/graphql',
      method: 'POST',
      supportedMethods: ['POST'],
      send: () => ({
        [Symbol.asyncIterator]() {
          const id = nextId++;
          let disposed = false;
          return {
            async next(): Promise<IteratorResult<TransportResponse>> {
              if (disposed) {
                return { value: undefined as never, done: true };
              }
              await tick();
              if (disposed) {
                return { value: undefined as never, done: true };
              }
              emittedCount += 1;
              return {
                value: {
                  ok: true,
                  body: { data: { tick: emittedCount } },
                  timing: { totalMs: 0 },
                  size: {},
                },
                done: false,
              };
            },
            async return(value?: unknown) {
              disposed = true;
              onReturn(id);
              return { value: value as TransportResponse, done: true as const };
            },
          };
        },
      }),
    };
    return { transport, getEmittedCount: () => emittedCount };
  }

  it('stop() disposes the iterator actually driving the subscription and stops delivery', async () => {
    const disposedIds: number[] = [];
    const { transport, getEmittedCount } = makeFreshIteratorTransport(id =>
      disposedIds.push(id),
    );
    const { store } = makeRunnableStore({ transport });

    const runPromise = store.getState().actions.run();
    // Everything before the first `await it.next()` runs synchronously, so
    // `subscription` is already populated by the time `run()` returns its
    // promise.
    expect(store.getState().subscription).not.toBeNull();

    await tick();
    await tick();
    const emittedBeforeStop = getEmittedCount();
    expect(emittedBeforeStop).toBeGreaterThan(0);

    store.getState().actions.stop();
    await runPromise;

    const emittedRightAfterStop = getEmittedCount();
    await tick();
    await tick();
    await tick();

    // The defining assertion: no more events after `stop()`. Under the old
    // `iter[Symbol.asyncIterator]().return?.()` bug, `unsubscribe` disposes a
    // throwaway iterator while the real one keeps running forever, so this
    // would keep growing and `runPromise` would never resolve.
    expect(getEmittedCount()).toBe(emittedRightAfterStop);
    expect(store.getState().subscription).toBeNull();
    expect(store.getState().isFetching).toBe(false);
  });

  it('the wrapped-transport path (registry.wrap) still stops delivery on stop()', async () => {
    // Exercises the real `TransportHookRegistry.wrap()` shape (the thing bug
    // 2 was actually reported against), composed the same way
    // `<GraphiQLProvider transport={...}>` wires it up in production.
    const disposedIds: number[] = [];
    const { transport: rawTransport, getEmittedCount } =
      makeFreshIteratorTransport(id => disposedIds.push(id));
    const registry = new TransportHookRegistry();
    const transport = registry.wrap(rawTransport);

    const { store } = makeRunnableStore({ transport });

    const runPromise = store.getState().actions.run();
    expect(store.getState().subscription).not.toBeNull();

    await tick();
    await tick();
    expect(getEmittedCount()).toBeGreaterThan(0);

    store.getState().actions.stop();
    await runPromise;

    const emittedRightAfterStop = getEmittedCount();
    await tick();
    await tick();
    await tick();

    expect(getEmittedCount()).toBe(emittedRightAfterStop);
    expect(store.getState().subscription).toBeNull();
  });
});

describe('run/stop — abort in-flight query/mutation', () => {
  it('stop() aborts the request and no response is ever dispatched', async () => {
    let capturedSignal: AbortSignal | undefined;
    const transport: Transport = {
      url: 'https://example.test/graphql',
      method: 'POST',
      supportedMethods: ['POST'],
      send: req =>
        new Promise((_resolve, reject) => {
          capturedSignal = req.signal;
          req.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
          // Deliberately never resolves on its own — only `stop()` ends it.
        }),
    };
    const { store, responseEditor } = makeRunnableStore({ transport });

    const runPromise = store.getState().actions.run();
    expect(store.getState().isFetching).toBe(true);
    expect(store.getState().abortController).not.toBeNull();
    expect(capturedSignal?.aborted).toBe(false);

    store.getState().actions.stop();
    await runPromise;

    expect(capturedSignal?.aborted).toBe(true);
    expect(store.getState().isFetching).toBe(false);
    expect(store.getState().abortController).toBeNull();
    // No response was ever dispatched: `lastResponse` stays at its initial
    // `null`, and the response pane is never told to render an abort error.
    expect(store.getState().lastResponse).toBeNull();
    expect(responseEditor.setValue).not.toHaveBeenCalledWith(
      expect.stringContaining('abort'),
    );
  });

  it('a genuine request failure (not caused by stop()) still surfaces an error', async () => {
    const transport: Transport = {
      url: 'https://example.test/graphql',
      method: 'POST',
      supportedMethods: ['POST'],
      send: () => Promise.reject(new Error('network down')),
    };
    const { store } = makeRunnableStore({ transport });

    await store.getState().actions.run();

    expect(store.getState().lastResponse).not.toBeNull();
    expect(store.getState().lastResponse?.ok).toBe(false);
    expect(store.getState().isFetching).toBe(false);
  });
});
