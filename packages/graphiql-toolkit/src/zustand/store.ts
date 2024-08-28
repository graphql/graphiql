import { enableMapSet } from 'immer';
import { fileSlice, FilesState } from './files';

import { StateCreator, create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { executionSlice, ExecutionState } from './execution';
import { editorSlice, EditorState } from './editor';
import { optionsSlice, OptionsState } from './options';
import { schemaSlice, SchemaState } from './schema';

export type CommonState = {
  files: FilesState;
  execution: ExecutionState;
  editor: EditorState;
  options: OptionsState
  schema: SchemaState
};

export type ImmerStateCreator<T> = StateCreator<
  CommonState,
  [['zustand/immer', never], never],
  [],
  T
>;

enableMapSet();

export type GraphiQLStoreOptions = {
  /**
   * The initial state of the store.
   */
  initialState?: Partial<CommonState>;
};

export const createGraphiQLStore = (options: GraphiQLStoreOptions) => {
  return create<CommonState>()(immer(
    devtools((...args) => ({
      files: fileSlice(...args),
      execution: executionSlice(...args),
      editor: editorSlice(...args),
      options: optionsSlice(...args),
      schema: schemaSlice(...args),
    })),
  )),
}
// move this to @graphiql/react ofc
export const useGraphiQLStore = (options: GraphiQLStoreOptions) => {
  return createGraphiQLStore(options);
};
