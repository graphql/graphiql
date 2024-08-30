import { enableMapSet, produce } from 'immer';

import { StateCreator, createStore } from 'zustand/vanilla';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { executionSlice, ExecutionState } from './execution';
export type { UserOptions } from './options';

import { OptionsSlice, optionsSlice, UserOptions } from './options';
import { EditorSlice, editorSlice } from './editor';
import { fileSlice, FilesState } from './files';
import { SchemaSlice, schemaSlice } from './schema';
import { createStorage } from './storage/idb-store';

export type GraphiQLState = {
  files: FilesState;
  execution: ExecutionState;
  editor: EditorSlice;
  options: OptionsSlice;
  schema: SchemaSlice;
};

enableMapSet();

const middlewares = (
  fn: ImmerStateCreator<GraphiQLState>,
  options?: UserOptions,
) => {
  const storage =
    options?.storage ?? createStorage(options?.storageKeyPrefix ?? 'graphiql');
  return createStore<GraphiQLState>()(
    immer(
      devtools(
        fn,
        // persist(fn, {
        //   storage: createJSONStorage(() => storage),
        //   name: 'graphiql',
        // }),
      ),
    ),
  );
};

export const createGraphiQLStore = (options?: UserOptions) => {
  return middlewares((...args) => ({
    options: optionsSlice(options)(...args),
    // TODO: files slices are not yet used by editor slice (or any slice) yet.
    // let's get everything working first
    files: fileSlice(...args),
    execution: executionSlice(...args),
    editor: editorSlice(...args),
    schema: schemaSlice(...args),
  }));
};

export const produceState = <T extends GraphiQLState>(
  callback: (state: T) => void,
): ReturnType<typeof produce> => {
  return produce(callback);
};

// Utilities

export type ImmerStateCreator<T> = StateCreator<
  GraphiQLState,
  [['zustand/immer', never], never],
  [],
  T
>;

// // TODO: adopt this pattern in the rest of the codebase?
// // also look into useShallow
// type WithSelectors<S> = S extends { getState: () => infer T }
//   ? S & { use: { [K in keyof T]: () => T[K] } }
//   : never;

//   export const createSelectors = <S extends StoreApi<object>>(_store: S) => {
//     const store = _store as WithSelectors<typeof _store>;
//     store.use = {};
//     for (const k of Object.keys(store.getState())) {
//       (store.use as any)[k] = () => useStore(_store, s => s[k as keyof typeof s]);
//     }

//     return store;
//   };
