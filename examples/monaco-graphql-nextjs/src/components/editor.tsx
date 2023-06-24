import React, { useEffect } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { Uri, editor, KeyMod, KeyCode, languages } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import * as JSONC from 'jsonc-parser';

/**
 * Copied from graphql/graphiql/examples/monaco-graphql-vite
 */

function debounce<F extends (...args: any[]) => any>(duration: number, fn: F) {
  let timeout: number | null;
  return function (this: any, ...args: Parameters<F>) {
    if (timeout) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      timeout = null;
      fn(args);
    }, duration);
  };
}

const fetcher = createGraphiQLFetcher({
  url: 'https://swapi-graphql.netlify.app/.netlify/functions/index/',
});
const defaultVariables =
  localStorage.getItem('variables') ??
  `
 {
     // limit will appear here as autocomplete,
     // and because the default value is 0, will
     // complete as such
 }
`;

const getSchema = async () =>
  fetcher({
    query: getIntrospectionQuery(),
    operationName: 'IntrospectionQuery',
  });

const getOrCreateModel = (uri: string, value: string) => {
  return (
    editor.getModel(Uri.file(uri)) ??
    editor.createModel(value, uri.split('.').pop(), Uri.file(uri))
  );
};

const execOperation = async function () {
  const variables = editor.getModel(Uri.file('variables.json'))!.getValue();
  const operations = editor.getModel(Uri.file('operation.graphql'))!.getValue();
  const resultsModel = editor.getModel(Uri.file('results.json'));
  const result = await fetcher({
    query: operations,
    variables: JSON.stringify(JSONC.parse(variables)),
  });
  // TODO: this demo only supports a single iteration for http GET/POST,
  // no multipart or subscriptions yet.
  // @ts-expect-error
  const data = await result.next();

  resultsModel?.setValue(JSON.stringify(data.value, null, 2));
};

const queryAction = {
  id: 'graphql-run',
  label: 'Run Operation',
  contextMenuOrder: 0,
  contextMenuGroupId: 'graphql',
  keybindings: [
    // eslint-disable-next-line no-bitwise
    KeyMod.CtrlCmd | KeyCode.Enter,
  ],
  run: execOperation,
};
// set these early on so that initial variables with comments don't flash an error
languages.json.jsonDefaults.setDiagnosticsOptions({
  allowComments: true,
  trailingCommas: 'ignore',
});

const createEditor = (
  ref: React.MutableRefObject<null>,
  options: editor.IStandaloneEditorConstructionOptions,
) => editor.create(ref.current as unknown as HTMLElement, options);

export default function Editor() {
  const opsRef = React.useRef(null);
  const varsRef = React.useRef(null);
  const resultsRef = React.useRef(null);
  const [queryEditor, setQueryEditor] =
    React.useState<editor.IStandaloneCodeEditor | null>(null);
  const [variablesEditor, setVariablesEditor] =
    React.useState<editor.IStandaloneCodeEditor | null>(null);
  const [resultsViewer, setResultsViewer] =
    React.useState<editor.IStandaloneCodeEditor | null>(null);
  const [schema, setSchema] = React.useState<unknown | null>(null);
  const [loading, setLoading] = React.useState(false);

  /**
   * Create the models & editors
   */
  useEffect(() => {
    const queryModel = getOrCreateModel('operation.graphql', '');
    const variablesModel = getOrCreateModel('variables.json', defaultVariables);
    const resultsModel = getOrCreateModel('results.json', '{}');

    if (!queryEditor) {
      setQueryEditor(
        createEditor(opsRef, {
          theme: 'vs-dark',
          model: queryModel,
          language: 'graphql',
        }),
      );
    }
    if (!variablesEditor) {
      setVariablesEditor(
        createEditor(varsRef, {
          theme: 'vs-dark',
          model: variablesModel,
        }),
      );
    }
    if (!resultsViewer) {
      setResultsViewer(
        createEditor(resultsRef, {
          theme: 'vs-dark',
          model: resultsModel,
          readOnly: true,
          smoothScrolling: true,
        }),
      );
    }
    queryModel.onDidChangeContent(
      debounce(300, () => {
        localStorage.setItem('operations', queryModel.getValue());
      }),
    );
    variablesModel.onDidChangeContent(
      debounce(300, () => {
        localStorage.setItem('variables', variablesModel.getValue());
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once on mount
  }, []);

  useEffect(() => {
    queryEditor?.addAction(queryAction);
    variablesEditor?.addAction(queryAction);
  }, [queryEditor, variablesEditor]);
  /**
   * Handle the initial schema load
   */
  useEffect(() => {
    if (schema || loading) {
      return;
    }

    setLoading(true);
    void getSchema()
      .then(data => {
        if (!('data' in data)) {
          throw new Error(
            'this demo does not support subscriptions or http multipart yet',
          );
        }
        initializeMode({
          diagnosticSettings: {
            validateVariablesJSON: {
              [Uri.file('operation.graphql').toString()]: [
                Uri.file('variables.json').toString(),
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
          schemas: [
            {
              introspectionJSON: data.data as unknown as IntrospectionQuery,
              uri: 'myschema.graphql',
            },
          ],
        });

        setSchema(data.data);
      })
      .then(() => setLoading(false));
  }, [schema, loading]);
  return (
    <div id="wrapper">
      <div id="left-pane" className="pane">
        <div ref={opsRef} className="editor" />
        <div ref={varsRef} className="editor" />
      </div>
      <div id="right-pane" className="pane">
        <div ref={resultsRef} className="editor" />
      </div>
    </div>
  );
}
