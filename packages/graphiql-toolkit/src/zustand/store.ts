import { enableMapSet } from 'immer';
import { fileSlice, FilesState } from './files';

import { StateCreator, createStore } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { executionSlice, ExecutionState } from './execution';
import { EditorSlice, editorSlice } from './editor';
import { OptionsSlice, optionsSlice, OptionsState } from './options';
import { SchemaSlice, schemaSlice } from './schema';

export type CommonState = {
  files: FilesState;
  execution: ExecutionState;
  editor: EditorSlice;
  options: OptionsSlice;
  schema: SchemaSlice;
};

export { OptionsState };

enableMapSet();

export type GraphiQLStoreOptions = {
  /**
   * The initial state of the store.
   */
  initialState?: Partial<CommonState>;
};

export const createGraphiQLStore = (options: Partial<OptionsState>) => {
  return createStore<CommonState>()(
    immer(
      devtools((...args) => ({
        options: optionsSlice(options)(...args),
        files: fileSlice(...args),
        execution: executionSlice(...args),
        editor: editorSlice(...args),
        schema: schemaSlice(...args),
      })),
    ),
  );
};

// Utilities

export type ImmerStateCreator<T> = StateCreator<
  CommonState,
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
