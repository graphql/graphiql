import { ReactElement, useEffect, useRef, useState } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { editor, KeyMod, KeyCode, languages } from 'monaco-editor';
import { createGraphiQLFetcher } from '@graphiql/toolkit';
import * as JSONC from 'jsonc-parser';
import { debounce } from './debounce';
import {
  DEFAULT_EDITOR_OPTIONS,
  MONACO_GRAPHQL_API,
  STORAGE_KEY,
  GRAPHQL_URL,
  MODEL,
} from './constants';

const fetcher = createGraphiQLFetcher({ url: GRAPHQL_URL });

async function getSchema(): Promise<IntrospectionQuery> {
  const data = await fetcher({
    query: getIntrospectionQuery(),
    operationName: 'IntrospectionQuery',
  });
  const introspectionJSON =
    'data' in data && (data.data as unknown as IntrospectionQuery);

  if (!introspectionJSON) {
    throw new Error(
      'this demo does not support subscriptions or http multipart yet',
    );
  }
  return introspectionJSON;
}

async function execOperation(): Promise<void> {
  const result = await fetcher({
    query: MODEL.operations.getValue(),
    variables: JSONC.parse(MODEL.variables.getValue()),
  });
  // TODO: this demo only supports a single iteration for http GET/POST,
  // no multipart or subscriptions yet.
  // @ts-expect-error
  const data = await result.next();
  MODEL.response.setValue(JSON.stringify(data.value, null, 2));
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

export default function Editor(): ReactElement {
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
    if (!operationsEditor) {
      setOperationsEditor(
        editor.create(operationsRef.current!, {
          model: MODEL.operations,
          ...DEFAULT_EDITOR_OPTIONS,
        }),
      );
    }
    if (!variablesEditor) {
      setVariablesEditor(
        editor.create(variablesRef.current!, {
          model: MODEL.variables,
          ...DEFAULT_EDITOR_OPTIONS,
        }),
      );
    }
    if (!responseEditor) {
      setResponseEditor(
        editor.create(responseRef.current!, {
          model: MODEL.response,
          ...DEFAULT_EDITOR_OPTIONS,
          readOnly: true,
          smoothScrolling: true,
        }),
      );
    }
    MODEL.operations.onDidChangeContent(
      debounce(300, () => {
        localStorage.setItem(
          STORAGE_KEY.operations,
          MODEL.operations.getValue(),
        );
      }),
    );
    MODEL.variables.onDidChangeContent(
      debounce(300, () => {
        localStorage.setItem(STORAGE_KEY.variables, MODEL.variables.getValue());
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
    void getSchema().then(async introspectionJSON => {
      MONACO_GRAPHQL_API.setSchemaConfig([
        { introspectionJSON, uri: 'myschema.graphql' },
      ]);
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
