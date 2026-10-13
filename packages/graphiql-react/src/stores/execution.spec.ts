'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { create } from 'zustand';
import { Kind, parse } from 'graphql';
import { StorageAPI } from '@graphiql/toolkit';
import type { Fetcher, Transport, TransportResponse } from '@graphiql/toolkit';
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

describe('run uses the current document', () => {
  function prepare(query: string, selected = 'Changed') {
    const fetcher = vi.fn<Fetcher>(async () => ({ data: {} }));
    const { store, queryEditor } = makeRunnableStore({ fetcher });
    const documentAST = parse(query);
    store.getState().actions.setOperationFacts({
      documentAST,
      operations: documentAST.definitions.filter(
        definition => definition.kind === Kind.OPERATION_DEFINITION,
      ),
      operationName: selected,
    });
    return { store, queryEditor, fetcher };
  }

  it.each([
    ['query Saved { bar }', 'Saved'],
    ['{ bar }', undefined],
  ])(
    'runs a replacement document immediately: %s',
    async (query, operationName) => {
      const { store, queryEditor, fetcher } = prepare('query Changed { bar }');
      queryEditor.getValue.mockReturnValue(query);
      await store.getState().actions.run();
      expect(fetcher.mock.calls[0]?.[0]).toMatchObject({
        query,
        operationName,
      });
      expect(fetcher.mock.calls[0]?.[1]?.documentAST?.loc?.source.body).toBe(
        query,
      );
      expect(store.getState().operationName).toBe(operationName);
    },
  );

  it('runs a tab immediately after switching to its document', async () => {
    const { store, queryEditor, fetcher } = prepare('query Changed { bar }');
    const query = 'query Saved { bar }';
    queryEditor.setValue = vi.fn(value =>
      queryEditor.getValue.mockReturnValue(value),
    );
    store.setState({
      tabs: [
        createTab({ query: 'query Changed { bar }' }),
        createTab({ query }),
      ],
    });
    store.getState().actions.changeTab(1);
    await store.getState().actions.run();
    expect(fetcher.mock.calls[0]?.[0]).toMatchObject({
      query,
      operationName: 'Saved',
    });
  });

  it('restores the selected operation when switching to a multi-operation tab', async () => {
    const { store, queryEditor, fetcher } = prepare('query Changed { bar }');
    const query = 'query Alpha { bar } query Beta { bar }';
    queryEditor.setValue = vi.fn(value =>
      queryEditor.getValue.mockReturnValue(value),
    );
    store.setState({
      tabs: [
        createTab({ query: 'query Changed { bar }' }),
        { ...createTab({ query }), operationName: 'Beta' },
      ],
    });
    store.getState().actions.changeTab(1);
    await store.getState().actions.run();
    expect(fetcher.mock.calls[0]?.[0]).toMatchObject({
      query,
      operationName: 'Beta',
    });
  });

  it('runs each tab selection even when operation names overlap across tabs', async () => {
    const firstQuery = 'query Shared { first } query Other { second }';
    const secondQuery = 'query Shared { second } query Other { first }';
    const { store, queryEditor, fetcher } = prepare(firstQuery, 'Shared');
    queryEditor.setValue = vi.fn(value =>
      queryEditor.getValue.mockReturnValue(value),
    );
    queryEditor.getValue.mockReturnValue(firstQuery);
    store.setState({
      tabs: [
        { ...createTab({ query: firstQuery }), operationName: 'Shared' },
        { ...createTab({ query: secondQuery }), operationName: 'Other' },
      ],
    });

    await store.getState().actions.run();
    store.getState().actions.changeTab(1);
    await store.getState().actions.run();

    expect(fetcher.mock.calls.map(([request]) => request)).toMatchObject([
      { query: firstQuery, operationName: 'Shared' },
      { query: secondQuery, operationName: 'Other' },
    ]);
  });

  it('appends external fragments required by the current document', async () => {
    const { store, queryEditor, fetcher } = prepare('query Changed { ...Old }');
    const fragments = parse(
      'fragment Old on Query { bar } fragment New on Query { bar }',
    ).definitions.filter(
      definition => definition.kind === Kind.FRAGMENT_DEFINITION,
    );
    store.setState({
      externalFragments: new Map(
        fragments.map(fragment => [fragment.name.value, fragment]),
      ),
    });
    queryEditor.getValue.mockReturnValue('query Saved { ...New }');
    await store.getState().actions.run();
    expect(fetcher.mock.calls[0]?.[0]?.query).toContain('fragment New');
    expect(fetcher.mock.calls[0]?.[0]?.query).not.toContain('fragment Old');
  });

  it('keeps an explicit selection when multiple operations still contain it', async () => {
    const query = 'query Alpha { bar } query Beta { bar }';
    const { store, queryEditor, fetcher } = prepare(query, 'Beta');
    queryEditor.getValue.mockReturnValue(query + ' query Gamma { bar }');
    await store.getState().actions.run();
    expect(fetcher.mock.calls[0]?.[0]?.operationName).toBe('Beta');
  });

  it('keeps the selected position when an operation is renamed', async () => {
    const { store, queryEditor, fetcher } = prepare(
      'query Alpha { bar } query Beta { bar }',
      'Beta',
    );
    queryEditor.getValue.mockReturnValue(
      'query Alpha { bar } query Saved { bar }',
    );
    await store.getState().actions.run();
    expect(fetcher.mock.calls[0]?.[0]?.operationName).toBe('Saved');
  });

  it('blocks a newly displayed mutation until POST is selected', async () => {
    const { store, queryEditor, fetcher } = prepare('query Changed { bar }');
    store.setState({ transportMethod: 'GET' });
    queryEditor.getValue.mockReturnValue('mutation Saved { bar }');
    await store.getState().actions.run();
    expect(fetcher).not.toHaveBeenCalled();
    expect(store.getState().transportMethod).toBe('GET');
  });

  it('allows a newly displayed query with GET even after a mutation', async () => {
    const { store, queryEditor, fetcher } = prepare('mutation Changed { bar }');
    store.setState({ transportMethod: 'GET' });
    queryEditor.getValue.mockReturnValue('query Saved { bar }');
    await store.getState().actions.run();
    expect(fetcher.mock.calls[0]?.[0]?.operationName).toBe('Saved');
    expect(store.getState().transportMethod).toBe('GET');
  });
});

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
    await vi.waitFor(() => {
      expect(store.getState().subscription).not.toBeNull();
    });

    await vi.waitFor(() => {
      expect(getEmittedCount()).toBeGreaterThan(0);
    });

    store.getState().actions.stop();
    await runPromise;

    const emittedRightAfterStop = getEmittedCount();
    await tick();
    await tick();
    await tick();

    // The defining assertion: no more events after `stop()`. Under a
    // `iter[Symbol.asyncIterator]().return?.()` unsubscribe, `stop()` disposes
    // a throwaway iterator while the real one keeps running forever, so this
    // would keep growing and `runPromise` would never resolve.
    expect(getEmittedCount()).toBe(emittedRightAfterStop);
    // Exactly one iterator was ever disposed, and it's the one that was
    // driving the loop (the first minted, id 0) — not a fresh throwaway.
    expect(disposedIds).toEqual([0]);
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
    await vi.waitFor(() => {
      expect(store.getState().subscription).not.toBeNull();
    });

    await vi.waitFor(() => {
      expect(getEmittedCount()).toBeGreaterThan(0);
    });

    store.getState().actions.stop();
    await runPromise;

    const emittedRightAfterStop = getEmittedCount();
    await tick();
    await tick();
    await tick();

    expect(getEmittedCount()).toBe(emittedRightAfterStop);
    expect(disposedIds).toEqual([0]);
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
    await vi.waitFor(() => {
      expect(store.getState().abortController).not.toBeNull();
    });
    expect(store.getState().isFetching).toBe(true);
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

  it('stop() aborts an in-flight query through the wrapped transport (the production shape)', async () => {
    // In production the store always receives `registry.wrap(transport)`,
    // whose `send()` returns an AsyncIterable even for plain queries — so
    // Stop-abort must work through the iterable code path, not just the
    // promise one the raw transport above exercises.
    let capturedSignal: AbortSignal | undefined;
    const rawTransport: Transport = {
      url: 'https://example.test/graphql',
      method: 'POST',
      supportedMethods: ['POST'],
      send: req =>
        new Promise((_resolve, reject) => {
          capturedSignal = req.signal;
          req.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted', 'AbortError'));
          });
        }),
    };
    const registry = new TransportHookRegistry();
    const { store, responseEditor } = makeRunnableStore({
      transport: registry.wrap(rawTransport),
    });

    const runPromise = store.getState().actions.run();
    await vi.waitFor(() => {
      expect(capturedSignal).toBeDefined();
    });
    expect(capturedSignal?.aborted).toBe(false);

    store.getState().actions.stop();
    await runPromise;

    expect(capturedSignal?.aborted).toBe(true);
    expect(store.getState().isFetching).toBe(false);
    expect(store.getState().abortController).toBeNull();
    expect(store.getState().lastResponse).toBeNull();
    expect(responseEditor.setValue).not.toHaveBeenCalledWith(
      expect.stringContaining('abort'),
    );
  });

  it('a transport that ignores the signal still cannot paint a response after stop()', async () => {
    let resolveSend!: (tr: TransportResponse) => void;
    const transport: Transport = {
      url: 'https://example.test/graphql',
      method: 'POST',
      supportedMethods: ['POST'],
      send: () =>
        new Promise<TransportResponse>(resolve => {
          resolveSend = resolve;
        }),
    };
    const { store, responseEditor } = makeRunnableStore({ transport });

    const runPromise = store.getState().actions.run();
    await vi.waitFor(() => {
      expect(store.getState().abortController).not.toBeNull();
    });

    store.getState().actions.stop();
    resolveSend({
      ok: true,
      body: { data: { late: true } },
      timing: { totalMs: 0 },
      size: {},
    });
    await runPromise;

    expect(store.getState().lastResponse).toBeNull();
    expect(responseEditor.setValue).not.toHaveBeenCalledWith(
      expect.stringContaining('late'),
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
