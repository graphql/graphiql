import * as monaco from 'monaco-editor';

// NOTE: using loader syntax because Yaml worker imports editor.worker directly and that
// import shouldn't go through loader syntax.
// @ts-expect-error
import GraphQLWorker from 'monaco-graphql/esm/graphql.worker'; // eslint-disable-line import/default

const GRAPHQL_LANGUAGE_ID = 'graphql';

// @ts-expect-error
window.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === GRAPHQL_LANGUAGE_ID) {
      return new GraphQLWorker();
    }
    if (label === 'json') {
      return new Worker('/json.worker.js');
    }
    return new Worker('/editor.worker.js');
  },
};

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

const resultsString = `{}`;

const schemaSdlString = localStorage.getItem('schema-sdl') ?? ``;

const THEME = 'vs-dark';

export function createEditors() {
  const variablesModel = monaco.editor.createModel(
    variablesString,
    'json',
    monaco.Uri.file('/1/variables.json'),
  );

  const variablesEditor = monaco.editor.create(
    document.getElementById('variables') as HTMLElement,
    {
      model: variablesModel,
      language: 'json',
      formatOnPaste: true,
      formatOnType: true,
      theme: THEME,
      comments: {
        insertSpace: true,
        ignoreEmptyLines: true,
      },
    },
  );

  const operationModel = monaco.editor.createModel(
    operationString,
    GRAPHQL_LANGUAGE_ID,
    monaco.Uri.file('/1/operation.graphql'),
  );

  const operationEditor = monaco.editor.create(
    document.getElementById('operation') as HTMLElement,
    {
      model: operationModel,
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      theme: THEME,
      language: GRAPHQL_LANGUAGE_ID,
    },
  );

  const schemaModel = monaco.editor.createModel(
    schemaSdlString,
    GRAPHQL_LANGUAGE_ID,
    monaco.Uri.file('/1/schema.graphqls'),
  );

  const schemaEditor = monaco.editor.create(
    document.getElementById('schema-sdl') as HTMLElement,
    {
      model: schemaModel,
      formatOnPaste: true,
      formatOnType: true,
      folding: true,
      theme: THEME,
      language: GRAPHQL_LANGUAGE_ID,
    },
  );

  const resultsModel = monaco.editor.createModel(
    resultsString,
    'json',
    monaco.Uri.file('/1/results.json'),
  );

  const resultsEditor = monaco.editor.create(
    document.getElementById('results') as HTMLElement,
    {
      model: resultsModel,
      language: 'json',
      theme: THEME,
      wordWrap: 'on',
      readOnly: true,
      showFoldingControls: 'always',
    },
  );

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
