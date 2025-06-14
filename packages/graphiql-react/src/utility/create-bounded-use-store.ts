import { ExtractState, StoreApi, useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

// https://zustand.docs.pmnd.rs/guides/typescript#bounded-usestore-hook-for-vanilla-stores
export const createBoundedUseStore = (store => selector => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- selector can be `undefined`
  return useStore(store, selector && useShallow(selector));
}) as <S extends StoreApi<unknown>>(
  store: S,
) => {
  (): ExtractState<S>;
  <T>(selector: (state: ExtractState<S>) => T): T;
};
