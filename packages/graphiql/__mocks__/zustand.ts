/* eslint-disable no-console */

/**
 * Mocking Zustand for Vitest with resetting store between each test.
 * @see https://zustand.docs.pmnd.rs/guides/testing#vitest
 */

import { act } from '@testing-library/react';
// eslint-disable-next-line import-x/no-extraneous-dependencies
import {
  create as originalCreate,
  createStore as originalCreateStore,
  useStore,
  StateCreator,
} from 'zustand';

// Originally zustand docs suggest to use `export * from 'zustand'`, but I had issues with it.
// It conflicts with locale export of `create` and `createStore` functions
export { useStore };

// a variable to hold reset functions for all stores declared in the app
export const storeResetFns = new Set<() => void>();

const createUncurried = <T>(stateCreator: StateCreator<T>) => {
  const store = originalCreate(stateCreator);
  const initialState = store.getInitialState();
  storeResetFns.add(() => {
    store.setState(initialState, true);
  });
  return store;
};

// when creating a store, we get its initial state, create a reset function and add it in the set
export const create = (<T>(stateCreator: StateCreator<T>) => {
  console.log('zustand create mock');

  // to support curried version of create
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
export const createStore = (<T>(stateCreator: StateCreator<T>) => {
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
