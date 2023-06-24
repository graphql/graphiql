import { editor } from 'monaco-editor';

type ModelType = 'operations' | 'variables' | 'response';

export const GRAPHQL_URL = 'https://countries.trevorblades.com';

export const DEFAULT_EDITOR_OPTIONS: editor.IStandaloneEditorConstructionOptions =
  {
    theme: 'vs-dark',
    minimap: {
      enabled: false,
    },
  };

export const STORAGE_KEY = {
  operations: 'operations',
  variables: 'variables',
};

export const DEFAULT_VALUE: Record<ModelType, string> = {
  operations:
    localStorage.getItem(STORAGE_KEY.operations) ??
    `# cmd/ctrl + return/enter will execute the op,
# same in variables editor below
# also available via context menu & f1 command palette

query($code: ID!) {
  country(code: $code) {
    awsRegion
    native
    phone
  }
}`,
  variables: localStorage.getItem(STORAGE_KEY.variables) ?? `{
  "code": "UA"
}`,
  response: '',
};

export const FILE_SYSTEM_PATH: Record<
  ModelType,
  `${string}.${'graphql' | 'json'}`
> = {
  operations: 'operations.graphql',
  variables: 'variables.json',
  response: 'response.json',
};
