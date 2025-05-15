import { ExtractState, StoreApi, useStore } from 'zustand';

// https://zustand.docs.pmnd.rs/guides/typescript#bounded-usestore-hook-for-vanilla-stores
export const createBoundedUseStore = (store => selector =>
  useStore(store, selector)) as <S extends StoreApi<unknown>>(
  store: S,
) => {
  (): ExtractState<S>;
  <T>(selector: (state: ExtractState<S>) => T): T;
};
