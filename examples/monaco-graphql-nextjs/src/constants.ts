import { editor, Uri } from 'monaco-graphql/esm/monaco-editor';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';
import { parse, print } from 'graphql';

type ModelType = 'operations' | 'variables' | 'response' | 'typescript';

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

// allow a typo to test validation on schema load
/* cSpell:disable */
const operations =
  localStorage.getItem(STORAGE_KEY.operations) ??
  `# CMD/CTRL + Return/Enter will execute the operation,
# same in the variables editor below
# also available via context menu & F1 command palette

query Example($code: ID!, $filter: LanguageFilterInput!) {
  country(code: $code) {
    awsRegion
    native
    phone
    emoj
  }
  languages(filter: $filter) {
    name
  }
}`;
/* cSpell:enable */

let prettyOp = '';
const makeOpTemplate = (op: string) => {
  try {
    prettyOp = print(parse(op));
    return `
    const graphql = (arg: TemplateStringsArray): string => arg[0]
    
    const op = graphql\`\n${prettyOp}\n\``;
  } catch {
    return prettyOp;
  }
};

export const DEFAULT_VALUE: Record<ModelType, string> = {
  operations,
  variables:
    localStorage.getItem(STORAGE_KEY.variables) ??
    `{
  "code": "UA"
}`,
  response: '',
  typescript: makeOpTemplate(operations),
};

export const FILE_SYSTEM_PATH: Record<
  ModelType,
  `${string}.${'graphql' | 'json' | 'ts'}`
> = {
  operations: 'operations.graphql',
  variables: 'variables.json',
  response: 'response.json',
  typescript: 'typescript.ts',
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
  typescript: getOrCreateModel('typescript'),
};

MODEL.operations.onDidChangeContent(() => {
  const value = MODEL.operations.getValue();
  MODEL.typescript.setValue(makeOpTemplate(value));
});

function getOrCreateModel(type: ModelType): editor.ITextModel {
  const uri = Uri.file(FILE_SYSTEM_PATH[type]);
  const defaultValue = DEFAULT_VALUE[type];
  let language = uri.path.split('.').pop();
  console.log({ language });
  if (language === 'ts') {
    language = 'typescript';
  }
  return (
    editor.getModel(uri) ?? editor.createModel(defaultValue, language, uri)
  );
}
