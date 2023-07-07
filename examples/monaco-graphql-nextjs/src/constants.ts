import { editor, Uri } from 'monaco-graphql/monaco-editor';
import { initializeMode } from 'monaco-graphql';

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
    `# CMD/CTRL + Return/Enter will execute the operation,
# same in the variables editor below
# also available via context menu & F1 command palette

query($code: ID!) {
  country(code: $code) {
    awsRegion
    native
    phone
  }
}`,
  variables:
    localStorage.getItem(STORAGE_KEY.variables) ??
    `{
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

export const MONACO_GRAPHQL_API = initializeMode({
  diagnosticSettings: {
    validateVariablesJSON: {
      [Uri.file(FILE_SYSTEM_PATH.operations).toString()]: [
        Uri.file(FILE_SYSTEM_PATH.variables).toString(),
      ],
    },
    jsonDiagnosticSettings: {
      validate: true,
      schemaValidation: 'error',
      // set these again, because we are entirely re-setting them here
      allowComments: true,
      trailingCommas: 'ignore',
    },
  },
});

export const MODEL: Record<ModelType, editor.ITextModel> = {
  operations: getOrCreateModel('operations'),
  variables: getOrCreateModel('variables'),
  response: getOrCreateModel('response'),
};

function getOrCreateModel(
  type: 'operations' | 'variables' | 'response',
): editor.ITextModel {
  const uri = Uri.file(FILE_SYSTEM_PATH[type]);
  const defaultValue = DEFAULT_VALUE[type];
  const language = uri.path.split('.').pop();
  return (
    editor.getModel(uri) ?? editor.createModel(defaultValue, language, uri)
  );
}
