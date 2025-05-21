import { editor, Uri, languages } from 'monaco-graphql/esm/monaco-editor';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';
import { parse, print } from 'graphql';

type ModelType = 'operations' | 'variables' | 'response' | 'ts';

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
export const makeOpTemplate = (op: string) => {
  try {
    prettyOp = print(parse(op));
    return `const graphql = (arg: TemplateStringsArray): string => arg[0]
    
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
  ts: makeOpTemplate(operations),
};

export const OPERATIONS_URI = Uri.file('operations.graphql');
export const VARIABLES_URI = Uri.file('variables.json');
export const RESPONSE_URI = Uri.file('response.json');
export const TS_URI = Uri.file('typescript.ts');

// set these early on so that initial variables with comments don't flash an error
languages.json.jsonDefaults.setDiagnosticsOptions({
  allowComments: true,
  trailingCommas: 'ignore',
});

export const MONACO_GRAPHQL_API = initializeMode({
  diagnosticSettings: {
    validateVariablesJSON: {
      [OPERATIONS_URI.toString()]: [VARIABLES_URI.toString()],
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

export function getOrCreateModel({ uri, value }: { uri: Uri; value: string }) {
  const { path } = uri;
  let language = path.split('.').at(-1)!;
  if (language === 'ts') {
    language = 'typescript';
  }
  return editor.getModel(uri) ?? editor.createModel(value, language, uri);
}
