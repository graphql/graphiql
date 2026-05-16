'use no memo';

import { describe, it, expect, vi } from 'vitest';
import { create } from 'zustand';
import { StorageAPI } from '@graphiql/toolkit';
import { createExecutionSlice, isResponseView } from './execution';
import { createStorageSlice } from './storage';
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
