import { ImmerStateCreator } from './store';

type fileNames =
  | 'operations.graphql'
  | 'variables.json'
  | 'headers.json'
  | 'results.json';

type tabFileScheme = `/tabs/${number}/${fileNames}`;

type historyFileScheme = `/history/${string}/${fileNames}`;

type File = {
  value: string;
  createdAt: number;
  updatedAt: number;
};

type GraphiQLFileScheme = tabFileScheme | historyFileScheme;

export type FilesState = {
  files: Map<GraphiQLFileScheme, File>;
};

export const fileSlice: ImmerStateCreator<FilesState> = set => ({
  files: new Map(),
  addFile: (path: GraphiQLFileScheme, value: string) => {
    set(state => {
      state.files.files.set(path, {
        value,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    });
  },
  updateFile: (key: GraphiQLFileScheme, value: string) => {
    set(state => {
      const file = state.files.files.get(key);
      if (file) {
        file.value = value;
        file.updatedAt = Date.now();
        state.files.files.set(key, file);
      }
    });
  },
});
