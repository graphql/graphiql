import { ReactElement, useEffect, useRef, useState } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { Uri, editor, KeyMod, KeyCode, languages } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/dist/initializeMode';
import { createGraphiQLFetcher, SyncFetcherResult } from '@graphiql/toolkit';
import * as JSONC from 'jsonc-parser';
import { debounce } from './debounce';

const fetcher = createGraphiQLFetcher({
  url: 'https://countries.trevorblades.com',
});

const defaultOperations =
  localStorage.getItem('operations') ??
  `# cmd/ctrl + return/enter will execute the op,
# same in variables editor below
# also available via context menu & f1 command palette

query($code: ID!) {
  country(code: $code) {
    awsRegion
    native
    phone
  }
}`;

const defaultVariables = localStorage.getItem('variables') ?? '{}';

async function getSchema(): Promise<SyncFetcherResult> {
  return fetcher({
    query: getIntrospectionQuery(),
    operationName: 'IntrospectionQuery',
  });
}

export function getOrCreateModel({
  uri,
  value,
}: {
  uri: string;
  value: string;
}): editor.ITextModel {
  const language = uri.split('.').pop();
  return (
    editor.getModel(Uri.file(uri)) ??
    editor.createModel(value, language, Uri.file(uri))
  );
}

async function execOperation(): Promise<void> {
  const variables = editor.getModel(Uri.file('variables.json'))!.getValue();
  const operations = editor.getModel(Uri.file('operation.graphql'))!.getValue();
  const resultsModel = editor.getModel(Uri.file('results.json'));
  const result = await fetcher({
    query: operations,
    variables: JSONC.parse(variables),
  });
  // TODO: this demo only supports a single iteration for http GET/POST,
  // no multipart or subscriptions yet.
  // @ts-expect-error
  const data = await result.next();

  resultsModel?.setValue(JSON.stringify(data.value, null, 2));
}

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

type Editor = editor.IStandaloneCodeEditor | null;

export default function App(): ReactElement {
  const operationsRef = useRef<HTMLDivElement>(null);
  const variablesRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [queryEditor, setQueryEditor] = useState<Editor>(null);
  const [variablesEditor, setVariablesEditor] = useState<Editor>(null);
  const [resultsViewer, setResultsViewer] = useState<Editor>(null);
  const [schema, setSchema] = useState<IntrospectionQuery | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Create the models & editors
   */
  useEffect(() => {
    const queryModel = getOrCreateModel({
      uri: 'operation.graphql',
      value: defaultOperations,
    });
    const variablesModel = getOrCreateModel({
      uri: 'variables.json',
      value: defaultVariables,
    });
    const resultsModel = getOrCreateModel({ uri: 'results.json', value: '{}' });

    if (!queryEditor) {
      setQueryEditor(
        editor.create(operationsRef.current!, {
          theme: 'vs-dark',
          model: queryModel,
        }),
      );
    }
    if (!variablesEditor) {
      setVariablesEditor(
        editor.create(variablesRef.current!, {
          theme: 'vs-dark',
          model: variablesModel,
        }),
      );
    }
    if (!resultsViewer) {
      setResultsViewer(
        editor.create(resultsRef.current!, {
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

    void getSchema().then(data => {
      const introspectionJSON =
        'data' in data && (data.data as unknown as IntrospectionQuery);

      if (!introspectionJSON) {
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
        schemas: [{ introspectionJSON, uri: 'myschema.graphql' }],
      });

      setSchema(introspectionJSON);
      setLoading(false);
    });
  }, [schema, loading]);

  return (
    <>
      <div id="left-pane" className="pane">
        <div ref={operationsRef} className="editor" />
        <div ref={variablesRef} className="editor" />
      </div>
      <div ref={resultsRef} id="right-pane" className="pane editor" />
    </>
  );
}
