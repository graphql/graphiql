import { editor, Uri } from 'monaco-graphql/dist/monaco-editor';

const GRAPHQL_LANGUAGE_ID = 'graphql';

const operationString =
  localStorage.getItem('operations') ??
  `
# right click to view context menu
# F1 for command palette
# enjoy prettier formatting, autocompletion,
# validation, hinting and more for GraphQL SDL and operations!
query Example(
  $owner: String!
  $name: String!
  $reviewEvent: PullRequestReviewEvent!
  $user: FollowUserInput!
) {
  repository(owner: $owner, name: $name) {
    stargazerCount
  }
}
`;

const variablesString =
  localStorage.getItem('variables') ??
  `{
  "reviewEvent": "graphql",
  "name": true
}`;

const resultsString = '{}';

const schemaSdlString = localStorage.getItem('schema-sdl') ?? '';

const THEME = 'vs-dark';

export function createEditors() {
  const variablesModel = editor.createModel(
    variablesString,
    'json',
    Uri.file('/1/variables.json'),
  );

  const variablesEditor = editor.create(document.getElementById('variables'), {
    model: variablesModel,
    language: 'json',
    formatOnPaste: true,
    formatOnType: true,
    theme: THEME,
    comments: {
      insertSpace: true,
      ignoreEmptyLines: true,
    },
  });

  const operationModel = editor.createModel(
    operationString,
    GRAPHQL_LANGUAGE_ID,
    Uri.file('/1/operation.graphql'),
  );

  const operationEditor = editor.create(document.getElementById('operation'), {
    model: operationModel,
    formatOnPaste: true,
    formatOnType: true,
    folding: true,
    theme: THEME,
    language: GRAPHQL_LANGUAGE_ID,
  });

  const schemaModel = editor.createModel(
    schemaSdlString,
    GRAPHQL_LANGUAGE_ID,
    Uri.file('/1/schema.graphqls'),
  );

  const schemaEditor = editor.create(document.getElementById('schema-sdl'), {
    model: schemaModel,
    formatOnPaste: true,
    formatOnType: true,
    folding: true,
    theme: THEME,
    language: GRAPHQL_LANGUAGE_ID,
  });

  const resultsModel = editor.createModel(
    resultsString,
    'json',
    Uri.file('/1/results.json'),
  );

  const resultsEditor = editor.create(document.getElementById('results'), {
    model: resultsModel,
    language: 'json',
    theme: THEME,
    wordWrap: 'on',
    readOnly: true,
    showFoldingControls: 'always',
  });

  return {
    operationEditor,
    variablesEditor,
    resultsEditor,
    schemaEditor,
    operationModel,
    variablesModel,
    schemaModel,
  };
}
