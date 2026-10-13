'use no memo';

import { describe, it, expect, vi, afterEach } from 'vitest';
import { create } from 'zustand';
import { StorageAPI } from '@graphiql/toolkit';
import { OperationTypeNode } from 'graphql';
import { createEditorSlice } from './editor';
import { createStorageSlice } from './storage';
import { createTab, getDefaultTabState } from '../utility/tabs';
import {
  getRunBlockReason,
  resolveActiveOperation,
} from '../utility/run-block';
import { STORAGE_KEY } from '../constants';
import type { SlicesWithActions } from '../types';

function makeStore(
  overrides: Record<string, unknown> = {},
  storage = new StorageAPI(),
) {
  const tab = createTab({ query: 'query Foo {}' });

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
      ...overrides,
    })(...args);

    return {
      ...storageSlice,
      ...editorSlice,
      // Stub out the slices/actions that aren't under test.
      actions: {
        ...editorSlice.actions,
        stop: vi.fn(),
        run: vi.fn(),
        setPlugins: vi.fn(),
        setVisiblePlugin: vi.fn(),
        setSchemaReference: vi.fn(),
        refetchSchema: vi.fn(),
        setTheme: vi.fn(),
        toggleTheme: vi.fn(),
      } as any,
    } as SlicesWithActions;
  });

  return store;
}

describe('tab management', () => {
  it('leaves live edits alone when selecting the already active tab', () => {
    const store = makeStore();
    const editor = {
      getValue: () => 'query Unsaved { hello }',
      setValue: vi.fn(),
    };
    store.getState().actions.setEditor({ queryEditor: editor as any });

    store.getState().actions.changeTab(0);

    expect(editor.setValue).not.toHaveBeenCalled();
    expect(store.getState().actions.stop).not.toHaveBeenCalled();
  });

  it('captures live edits before switching tabs without waiting for the edit timer', () => {
    const firstTab = createTab({ query: 'query First { hello }' });
    const secondTab = createTab({ query: 'query Second { counter }' });
    const store = makeStore({ tabs: [firstTab, secondTab] });
    const query = 'query Unsaved { hello counter }';
    store.getState().actions.setEditor({
      queryEditor: { getValue: () => query, setValue: vi.fn() } as any,
    });

    store.getState().actions.changeTab(1);

    expect(store.getState().tabs[0]?.query).toBe(query);
    expect(store.getState().tabs[0]?.lastSavedQuery).toBeNull();
  });

  it('updates operation facts immediately when tabs share an operation name', () => {
    const firstTab = createTab({ query: 'query Shared { hello }' });
    const secondTab = createTab({ query: 'mutation Shared { update }' });
    const store = makeStore({ tabs: [firstTab, secondTab] });
    let editorValue = firstTab.query;
    store.getState().actions.setEditor({
      queryEditor: {
        getValue: () => editorValue,
        setValue(value: string) {
          editorValue = value;
        },
      } as any,
    });

    store.getState().actions.changeTab(1);
    const mutationState = store.getState();
    expect(mutationState.operationName).toBe('Shared');
    expect(mutationState.operations?.[0]?.operation).toBe(
      OperationTypeNode.MUTATION,
    );
    expect(
      getRunBlockReason(
        'GET',
        resolveActiveOperation(
          mutationState.operations,
          mutationState.operationName,
        ),
      ),
    ).not.toBeNull();

    store.getState().actions.changeTab(0);
    const queryState = store.getState();
    expect(queryState.operationName).toBe('Shared');
    expect(queryState.operations?.[0]?.operation).toBe(OperationTypeNode.QUERY);
    expect(
      getRunBlockReason(
        'GET',
        resolveActiveOperation(queryState.operations, queryState.operationName),
      ),
    ).toBeNull();
  });

  it('addTab adds a new tab', () => {
    const store = makeStore();
    expect(store.getState().tabs).toHaveLength(1);
    store.getState().actions.addTab();
    expect(store.getState().tabs).toHaveLength(2);
  });

  it('addTab activates the new tab', () => {
    const store = makeStore();
    store.getState().actions.addTab();
    expect(store.getState().activeTabIndex).toBe(1);
  });

  it('changeTab stores live editor values before switching', () => {
    const store = makeStore();
    store.getState().actions.addTab();
    const editors = {
      queryEditor: {
        getValue: () => 'query Live {}',
        setValue: vi.fn(),
      },
      variableEditor: {
        getValue: () => '{"live":true}',
        setValue: vi.fn(),
      },
      headerEditor: {
        getValue: () => '{"x-live":"true"}',
        setValue: vi.fn(),
      },
      responseEditor: {
        getValue: () => '{"data":null}',
        setValue: vi.fn(),
      },
    };
    store.getState().actions.setEditor(editors as any);

    store.getState().actions.changeTab(0);

    expect(store.getState().tabs[1]).toMatchObject({
      query: 'query Live {}',
      variables: '{"live":true}',
      headers: '{"x-live":"true"}',
      response: '{"data":null}',
    });
  });

  it('closeTab removes the tab at the given index', () => {
    const store = makeStore();
    store.getState().actions.addTab();
    expect(store.getState().tabs).toHaveLength(2);
    store.getState().actions.closeTab(1);
    expect(store.getState().tabs).toHaveLength(1);
  });

  it('closing the active tab activates the previous tab', () => {
    const store = makeStore();
    store.getState().actions.addTab();
    expect(store.getState().activeTabIndex).toBe(1);
    store.getState().actions.closeTab(1);
    expect(store.getState().activeTabIndex).toBe(0);
  });
});

describe('dirty state', () => {
  it('a new tab has lastSavedQuery null', () => {
    const store = makeStore();
    const tab = store.getState().tabs[0]!;
    expect(tab.lastSavedQuery).toBeNull();
  });

  it('tab is dirty when query differs from lastSavedQuery', () => {
    const store = makeStore();
    const tab = store.getState().tabs[0]!;
    expect(tab.query).not.toBe(tab.lastSavedQuery);
  });

  it('saveQuery sets lastSavedQuery on the active tab', () => {
    const store = makeStore();
    // With no Monaco editor in tests, queryEditor is undefined, so
    // saveQuery sets lastSavedQuery to null.
    store.getState().actions.saveQuery();
    const tab = store.getState().tabs[0]!;
    expect(tab.lastSavedQuery).toBeNull();
  });

  it('updateActiveTabValues does not touch lastSavedQuery', () => {
    const store = makeStore();
    store.getState().actions.updateActiveTabValues({ query: 'query Bar {}' });
    const tab = store.getState().tabs[0]!;
    expect(tab.lastSavedQuery).toBeNull();
    expect(tab.query).toBe('query Bar {}');
  });

  it('saveQuery is independent of run/execute', () => {
    const store = makeStore();
    // Editing the query (simulated via updateActiveTabValues) does NOT clear dirty.
    store
      .getState()
      .actions.updateActiveTabValues({ query: 'query Updated {}' });
    const tabAfterEdit = store.getState().tabs[0]!;
    expect(tabAfterEdit.lastSavedQuery).toBeNull();
    expect(tabAfterEdit.query).toBe('query Updated {}');

    // saveQuery clears dirty.
    store.getState().actions.saveQuery();
    const tabAfterSave = store.getState().tabs[0]!;
    // lastSavedQuery is set to what the Monaco editor returns (null without Monaco).
    expect(tabAfterSave.lastSavedQuery).toBeNull();
  });
});

describe('save-handler registry', () => {
  it('registerSaveHandler adds a handler; saveQuery invokes it with the active tab and current query', () => {
    const store = makeStore();
    const handler = vi.fn().mockResolvedValue(true);
    store.getState().actions.registerSaveHandler(handler);

    store.getState().actions.saveQuery();

    expect(handler).toHaveBeenCalledOnce();
    const tabArg = handler.mock.calls[0]![0];
    expect(tabArg.id).toBe(store.getState().tabs[0]!.id);
    // Without a Monaco editor, queryEditor is undefined; the tab arg carries null.
    expect(tabArg).toHaveProperty('query');
  });

  it('unregister function removes the handler so it is not called on subsequent saveQuery', () => {
    const store = makeStore();
    const handler = vi.fn().mockResolvedValue(true);
    const unregister = store.getState().actions.registerSaveHandler(handler);

    unregister();
    store.getState().actions.saveQuery();

    expect(handler).not.toHaveBeenCalled();
  });

  it('rejects a second plugin save owner and keeps the first owner active', () => {
    const store = makeStore();
    const handlerA = vi.fn().mockResolvedValue(false);
    const handlerB = vi.fn().mockResolvedValue(false);
    store.getState().actions.registerSaveHandler(handlerA);
    expect(() =>
      store.getState().actions.registerSaveHandler(handlerB),
    ).toThrow('Only one plugin save handler');

    store.getState().actions.saveQuery();

    expect(handlerA).toHaveBeenCalledOnce();
    expect(handlerB).not.toHaveBeenCalled();
  });

  it('uses stored contents when marking a tab saved before its editor mounts', async () => {
    const store = makeStore();
    store.getState().actions.updateActiveTabValues({ query: 'query Saved {}' });
    store.getState().actions.registerSaveHandler(async () => true);

    store.getState().actions.saveQuery();

    await vi.waitFor(() =>
      expect(store.getState().tabs[0]!.lastSavedQuery).toBe('query Saved {}'),
    );
  });

  it('does not mark a later edit saved when its handler resolves false', async () => {
    const store = makeStore();
    const trueHandler = vi.fn().mockResolvedValue(true);
    const unregister = store
      .getState()
      .actions.registerSaveHandler(trueHandler);

    // Provide a mock queryEditor so markTabSaved records a real string value.
    const mockQueryEditor = {
      getValue: vi.fn().mockReturnValue('query First {}'),
    } as any;
    store.getState().actions.setEditor({ queryEditor: mockQueryEditor });

    store.getState().actions.saveQuery();
    await vi.waitFor(() =>
      expect(store.getState().tabs[0]!.lastSavedQuery).toBe('query First {}'),
    );

    mockQueryEditor.getValue.mockReturnValue('query Second {}');
    unregister();
    store.getState().actions.registerSaveHandler(async () => false);

    store.getState().actions.saveQuery();
    await vi.waitFor(() => expect(store.getState().savingTabIds.size).toBe(0));
    expect(store.getState().tabs[0]!.lastSavedQuery).toBe('query First {}');
  });

  it('saveQuery is a no-op when no handler is registered', () => {
    const store = makeStore();
    // Provide a mock editor so we can distinguish "saved" from "never saved".
    const mockQueryEditor = {
      getValue: vi.fn().mockReturnValue('query NoHandler {}'),
    } as any;
    store.getState().actions.setEditor({ queryEditor: mockQueryEditor });

    const tabBefore = store.getState().tabs[0]!;
    expect(tabBefore.lastSavedQuery).toBeNull();

    store.getState().actions.saveQuery();

    const tabAfter = store.getState().tabs[0]!;
    // lastSavedQuery must remain null — saveQuery must have been a no-op.
    expect(tabAfter.lastSavedQuery).toBeNull();
    expect(mockQueryEditor.getValue).not.toHaveBeenCalled();
  });

  it('cleans up a registered handler so a new owner can mount', () => {
    const store = makeStore();
    expect(store.getState().saveHandlers.size).toBe(0);

    const handlerA = vi.fn().mockResolvedValue(true);
    const handlerB = vi.fn().mockResolvedValue(true);
    const unregisterA = store.getState().actions.registerSaveHandler(handlerA);
    expect(store.getState().saveHandlers.size).toBe(1);

    unregisterA();
    expect(store.getState().saveHandlers.size).toBe(0);
    store.getState().actions.registerSaveHandler(handlerB);
    expect(store.getState().saveHandlers.size).toBe(1);
  });
});

describe('saved tab persistence', () => {
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  function memoryStorage() {
    const values = new Map<string, string>();
    return new StorageAPI({
      getItem: key => values.get(key) ?? null,
      setItem(key, value) {
        values.set(key, value);
      },
      removeItem(key) {
        values.delete(key);
      },
      clear() {
        values.clear();
      },
      get length() {
        return values.size;
      },
    });
  }

  it('restores the live saved query on an immediate reload', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const store = makeStore({}, storage);
    const query = 'query Saved { hello counter }';
    const tabId = store.getState().tabs[0]!.id;
    store.getState().actions.storeTabs(store.getState());
    store.getState().actions.setEditor({
      queryEditor: { getValue: () => query } as any,
    });

    store.getState().actions.markTabSaved(tabId);

    const restored = getDefaultTabState({
      defaultQuery: '',
      query,
      variables: null,
      headers: null,
      storage,
    });
    expect(restored.tabs).toHaveLength(1);
    expect(restored.tabs[0]).toMatchObject({
      id: tabId,
      query,
      lastSavedQuery: query,
    });
  });

  it('does not overwrite a completed save with a pending older tab write', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const store = makeStore({}, storage);
    const tabId = store.getState().tabs[0]!.id;
    store.getState().actions.updateActiveTabValues({ query: 'query Older {}' });
    const query = 'query Latest {}';
    store.getState().actions.setEditor({
      queryEditor: { getValue: () => query } as any,
    });

    store.getState().actions.markTabSaved(tabId);
    vi.advanceTimersByTime(500);

    const saved = JSON.parse(storage.get(STORAGE_KEY.tabs)!);
    expect(saved.tabs[0]).toMatchObject({ query, lastSavedQuery: query });
  });

  it('persists a saved inactive tab without reading the other tab editor', () => {
    vi.useFakeTimers();
    const storage = memoryStorage();
    const store = makeStore({}, storage);
    const query = 'query Saved {}';
    const tabId = store.getState().tabs[0]!.id;
    store.getState().actions.setEditor({
      queryEditor: { getValue: () => query, setValue: vi.fn() } as any,
    });
    store.getState().actions.addTab();
    store.getState().actions.setEditor({
      queryEditor: { getValue: () => 'query Other {}' } as any,
    });

    store.getState().actions.markTabSaved(tabId);

    const saved = JSON.parse(storage.get(STORAGE_KEY.tabs)!);
    expect(saved.activeTabIndex).toBe(1);
    expect(saved.tabs[0]).toMatchObject({
      id: tabId,
      query,
      lastSavedQuery: query,
    });
  });
});

describe('save completion', () => {
  it('marks only the submitted snapshot saved after an asynchronous save', async () => {
    let complete!: (saved: boolean) => void;
    const save = vi
      .fn()
      .mockImplementation(
        () => new Promise<boolean>(resolve => (complete = resolve)),
      );
    const store = makeStore();
    store.getState().actions.registerSaveHandler(save);
    const editor = { getValue: vi.fn().mockReturnValue('query A {}') };
    store.getState().actions.setEditor({ queryEditor: editor as any });

    store.getState().actions.saveQuery();
    editor.getValue.mockReturnValue('query B {}');
    store.getState().actions.updateActiveTabValues({ query: 'query B {}' });
    complete(true);
    await vi.waitFor(() =>
      expect(store.getState().tabs[0]).toMatchObject({
        query: 'query B {}',
        lastSavedQuery: 'query A {}',
      }),
    );
  });

  it('leaves the tab dirty after cancellation or a rejected save', async () => {
    const save = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockRejectedValueOnce(new Error('offline'));
    const store = makeStore();
    store.getState().actions.registerSaveHandler(save);
    store
      .getState()
      .actions.updateActiveTabValues({ query: 'query Unsaved {}' });

    store.getState().actions.saveQuery();
    await vi.waitFor(() => expect(store.getState().savingTabIds.size).toBe(0));
    expect(store.getState().tabs[0]!.lastSavedQuery).toBeNull();
    expect(store.getState().saveError).toBeNull();

    store.getState().actions.saveQuery();
    await vi.waitFor(() => expect(store.getState().saveError).toBe('offline'));
    expect(store.getState().tabs[0]!.lastSavedQuery).toBeNull();
  });

  it('serializes repeated saves of one tab and keeps the latest snapshot', async () => {
    const resolvers: Array<(saved: boolean) => void> = [];
    const save = vi
      .fn()
      .mockImplementation(
        () => new Promise<boolean>(resolve => resolvers.push(resolve)),
      );
    const store = makeStore();
    store.getState().actions.registerSaveHandler(save);
    const editor = { getValue: vi.fn().mockReturnValue('query A {}') };
    store.getState().actions.setEditor({ queryEditor: editor as any });

    store.getState().actions.saveQuery();
    editor.getValue.mockReturnValue('query B {}');
    store.getState().actions.saveQuery();
    expect(save).toHaveBeenCalledOnce();
    resolvers[0]!(true);
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    expect(save.mock.calls[1]![0].query).toBe('query B {}');
    resolvers[1]!(true);
    await vi.waitFor(() =>
      expect(store.getState().tabs[0]!.lastSavedQuery).toBe('query B {}'),
    );
  });

  it('applies completion to the originating tab after a switch and ignores a closed tab', async () => {
    let resolve!: (saved: boolean) => void;
    const first = createTab({ query: 'query First {}' });
    const second = createTab({ query: 'query Second {}' });
    const store = makeStore({ tabs: [first, second] });
    store
      .getState()
      .actions.registerSaveHandler(
        () => new Promise<boolean>(r => (resolve = r)),
      );
    store.getState().actions.saveQuery();
    store.getState().actions.changeTab(1);
    resolve(true);
    await vi.waitFor(() =>
      expect(store.getState().tabs[0]!.lastSavedQuery).toBe(first.query),
    );
    expect(store.getState().tabs[1]!.lastSavedQuery).toBeNull();

    store.getState().actions.changeTab(0);
    store.getState().actions.saveQuery();
    store.getState().actions.closeTab(0);
    resolve(true);
    await vi.waitFor(() => expect(store.getState().savingTabIds.size).toBe(0));
    expect(store.getState().tabs[0]!.id).toBe(second.id);
    expect(store.getState().tabs[0]!.lastSavedQuery).toBeNull();
  });
});
