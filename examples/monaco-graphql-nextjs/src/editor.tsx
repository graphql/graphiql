import { ReactElement, useEffect, useRef, useState } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import {
  editor,
  KeyMod,
  KeyCode,
  languages,
} from 'monaco-graphql/esm/monaco-editor';

// to get typescript mode working
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import 'monaco-editor/esm/vs/editor/contrib/peekView/browser/peekView';
import 'monaco-editor/esm/vs/editor/contrib/parameterHints/browser/parameterHints';
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';

import { createGraphiQLFetcher } from '@graphiql/toolkit';
import * as JSONC from 'jsonc-parser';
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

function debounce<F extends (...args: any[]) => any>(duration: number, fn: F) {
  let timeout = 0;
  return (...args: Parameters<F>) => {
    if (timeout) {
      window.clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      timeout = 0;
      fn(args);
    }, duration);
  };
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
  async run() {
    const result = await fetcher({
      query: MODEL.operations.getValue(),
      variables: JSONC.parse(MODEL.variables.getValue()),
    });
    // TODO: this demo only supports a single iteration for http GET/POST,
    // no multipart or subscriptions yet.
    // @ts-expect-error
    const data = await result.next();
    MODEL.response.setValue(JSON.stringify(data.value, null, 2));
  },
};
// set these early on so that initial variables with comments don't flash an error
languages.json.jsonDefaults.setDiagnosticsOptions({
  allowComments: true,
  trailingCommas: 'ignore',
});

export default function Editor(): ReactElement {
  const operationsRef = useRef<HTMLDivElement>(null);
  const variablesRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);
  const typescriptRef = useRef<HTMLDivElement>(null);
  const [operationsEditor, setOperationsEditor] =
    useState<editor.IStandaloneCodeEditor>();
  const [variablesEditor, setVariablesEditor] =
    useState<editor.IStandaloneCodeEditor>();
  const [responseEditor, setResponseEditor] =
    useState<editor.IStandaloneCodeEditor>();
  const [typescriptEditor, setTypescriptEditor] =
    useState<editor.IStandaloneCodeEditor>();
  const [schema, setSchema] = useState<IntrospectionQuery>();
  const [loading, setLoading] = useState(false);
  /**
   * Create the models & editors
   */
  useEffect(() => {
    if (!operationsEditor) {
      const codeEditor = editor.create(operationsRef.current!, {
        model: MODEL.operations,
        ...DEFAULT_EDITOR_OPTIONS,
      });
      codeEditor.addAction(queryAction);
      MODEL.operations.onDidChangeContent(
        debounce(300, () => {
          localStorage.setItem(
            STORAGE_KEY.operations,
            MODEL.operations.getValue(),
          );
        }),
      );
      setOperationsEditor(codeEditor);
    }
    if (!variablesEditor) {
      const codeEditor = editor.create(variablesRef.current!, {
        model: MODEL.variables,
        ...DEFAULT_EDITOR_OPTIONS,
      });
      codeEditor.addAction(queryAction);
      MODEL.variables.onDidChangeContent(
        debounce(300, () => {
          localStorage.setItem(
            STORAGE_KEY.variables,
            MODEL.variables.getValue(),
          );
        }),
      );
      setVariablesEditor(codeEditor);
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
    if (!typescriptEditor) {
      setTypescriptEditor(
        editor.create(typescriptRef.current!, {
          model: MODEL.typescript,
          ...DEFAULT_EDITOR_OPTIONS,
          smoothScrolling: true,
          readOnly: false,
          'semanticHighlighting.enabled': true,
          language: 'typescript',
        }),
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- only run once on mount
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
        { introspectionJSON, uri: 'my-schema.graphql' },
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
      <div className="pane">
        <div ref={responseRef} className="left-editor" />
        <div ref={typescriptRef} className="left-editor" />
      </div>
    </>
  );
}
