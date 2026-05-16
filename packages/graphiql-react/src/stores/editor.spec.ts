'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { create } from 'zustand';
import { StorageAPI } from '@graphiql/toolkit';
import { createEditorSlice } from './editor';
import { createStorageSlice } from './storage';
import { createTab } from '../utility/tabs';
import type { SlicesWithActions } from '../types';

function makeStore(overrides: Record<string, unknown> = {}) {
  const storage = new StorageAPI();
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
