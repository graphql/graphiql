import { enableMapSet, produce } from 'immer';
import { fileSlice, FilesState } from './files';

import { StateCreator, createStore } from 'zustand/vanilla';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { executionSlice, ExecutionState } from './execution';
import { EditorSlice, editorSlice } from './editor';
export type { UserOptions } from './options';
import { OptionsSlice, optionsSlice, UserOptions } from './options';
import { SchemaSlice, schemaSlice } from './schema';

export type { TabsState, TabState, TabDefinition } from './tabs';

export { synchronizeActiveTabValues } from './tabs';

export type GraphiQLState = {
  files: FilesState;
  execution: ExecutionState;
  editor: EditorSlice;
  options: OptionsSlice;
  schema: SchemaSlice;
};

enableMapSet();

export const createGraphiQLStore = (options?: UserOptions) => {
  return createStore<GraphiQLState>()(
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
