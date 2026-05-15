/* eslint-disable no-console */

/**
 * Mocking Zustand for Vitest with resetting store between each test.
 * @see https://zustand.docs.pmnd.rs/guides/testing#vitest
 */

import { afterEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import type { StateCreator } from 'zustand';
import type * as ZustandExports from 'zustand';

// A static `import ... from 'zustand'` resolves back to this mock and recurses.
const {
  create: originalCreate,
  createStore: originalCreateStore,
  useStore: originalUseStore,
} = await vi.importActual<typeof ZustandExports>('zustand');

export const useStore = originalUseStore;

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>();

const createUncurried = <T,>(stateCreator: StateCreator<T>) => {
  const store = originalCreate(stateCreator);
  const initialState = store.getInitialState();
  storeResetFns.add(() => {
    store.setState(initialState, true);
  });
  return store;
};

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T,>(stateCreator: StateCreator<T>) => {
  console.log('zustand create mock');

  // to support a curried version of create
  return typeof stateCreator === 'function'
    ? createUncurried(stateCreator)
    : createUncurried;
}) as typeof originalCreate;

function createStoreUncurried<T>(stateCreator: StateCreator<T>) {
  const store = originalCreateStore(stateCreator);
  const initialState = store.getInitialState();

  storeResetFns.add(() => {
    store.setState(initialState, true);
  });
  return store;
}

// When creating a store, we get its initial state, create a reset function and add it in the set
export const createStore = (<T,>(stateCreator: StateCreator<T>) => {
  console.log('zustand createStore mock');

  // to support a curried version of createStore
  return typeof stateCreator === 'function'
    ? createStoreUncurried(stateCreator)
    : createStoreUncurried;
}) as typeof originalCreateStore;

// Reset all stores after each test run
afterEach(() => {
  act(() => {
    for (const resetFn of storeResetFns) {
      resetFn();
    }
  });
});
