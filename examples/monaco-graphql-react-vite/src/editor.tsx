import { ReactElement, useEffect, useRef, useState } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { Uri, editor, KeyMod, KeyCode, languages } from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/dist/initializeMode';
import { createGraphiQLFetcher, SyncFetcherResult } from '@graphiql/toolkit';
import * as JSONC from 'jsonc-parser';
import { debounce } from './debounce';
import {
  DEFAULT_VALUE,
  DEFAULT_EDITOR_OPTIONS,
  GRAPHQL_URL,
  FILE_SYSTEM_PATH,
  STORAGE_KEY,
} from './constants';

const fetcher = createGraphiQLFetcher({ url: GRAPHQL_URL });

async function getSchema(): Promise<SyncFetcherResult> {
  return fetcher({
    query: getIntrospectionQuery(),
    operationName: 'IntrospectionQuery',
  });
}

export function getOrCreateModel(
  type: 'operations' | 'variables' | 'response',
): editor.ITextModel {
  const uri = Uri.file(FILE_SYSTEM_PATH[type]);
  const defaultValue = DEFAULT_VALUE[type];
  const language = uri.path.split('.').pop();
  return (
    editor.getModel(uri) ?? editor.createModel(defaultValue, language, uri)
  );
}

async function execOperation(): Promise<void> {
  const operationsModel = getOrCreateModel('operations');
  const variablesModel = getOrCreateModel('variables');
  const responseModel = getOrCreateModel('response');
  const result = await fetcher({
    query: operationsModel.getValue(),
    variables: JSONC.parse(variablesModel.getValue()),
  });
  // TODO: this demo only supports a single iteration for http GET/POST,
  // no multipart or subscriptions yet.
  // @ts-expect-error
  const data = await result.next();

  responseModel.setValue(JSON.stringify(data.value, null, 2));
}

const queryAction: editor.IActionDescriptor = {
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

type CodeEditor = editor.IStandaloneCodeEditor | null;

export function Editor(): ReactElement {
  const operationsRef = useRef<HTMLDivElement>(null);
  const variablesRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const [operationsEditor, setOperationsEditor] = useState<CodeEditor>(null);
  const [variablesEditor, setVariablesEditor] = useState<CodeEditor>(null);
  const [responseEditor, setResponseEditor] = useState<CodeEditor>(null);
  const [schema, setSchema] = useState<IntrospectionQuery | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Create the models & editors
   */
  useEffect(() => {
    const queryModel = getOrCreateModel('operations');
    const variablesModel = getOrCreateModel('variables');
    const resultsModel = getOrCreateModel('response');

    if (!operationsEditor) {
      setOperationsEditor(
        editor.create(operationsRef.current!, {
          model: queryModel,
          ...DEFAULT_EDITOR_OPTIONS,
        }),
      );
    }
    if (!variablesEditor) {
      setVariablesEditor(
        editor.create(variablesRef.current!, {
          model: variablesModel,
          ...DEFAULT_EDITOR_OPTIONS,
        }),
      );
    }
    if (!responseEditor) {
      setResponseEditor(
        editor.create(responseRef.current!, {
          model: resultsModel,
          ...DEFAULT_EDITOR_OPTIONS,
          readOnly: true,
          smoothScrolling: true,
        }),
      );
    }
    queryModel.onDidChangeContent(
      debounce(300, () => {
        localStorage.setItem(STORAGE_KEY.operations, queryModel.getValue());
      }),
    );
    variablesModel.onDidChangeContent(
      debounce(300, () => {
        localStorage.setItem(STORAGE_KEY.variables, variablesModel.getValue());
      }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only run once on mount
  }, []);

  useEffect(() => {
    operationsEditor?.addAction(queryAction);
    variablesEditor?.addAction(queryAction);
  }, [operationsEditor, variablesEditor]);
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
        schemas: [{ introspectionJSON, uri: 'myschema.graphql' }],
      });

      setSchema(introspectionJSON);
      setLoading(false);
    });
  }, [schema, loading]);

  return (
    <>
      <div className="pane">
        <div ref={operationsRef} className="left-editor" />
        <div ref={variablesRef} className="left-editor" />
      </div>
      <div ref={responseRef} className="pane" />
    </>
  );
}
