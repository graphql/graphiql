import { ReactElement, useEffect, useRef, useState } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import { editor, KeyMod, KeyCode } from 'monaco-graphql/esm/monaco-editor';

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
  OPERATIONS_URI,
  VARIABLES_URI,
  RESPONSE_URI,
  TS_URI,
  DEFAULT_VALUE,
  makeOpTemplate,
  getOrCreateModel,
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
      clearTimeout(timeout);
    }
    timeout = window.setTimeout(() => {
      timeout = 0;
      fn(args);
    }, duration);
  };
}

export default function Editor(): ReactElement {
  const operationsRef = useRef<HTMLDivElement>(null!);
  const variablesRef = useRef<HTMLDivElement>(null!);
  const responseRef = useRef<HTMLDivElement>(null!);
  const tsRef = useRef<HTMLDivElement>(null!);

  const [schema, setSchema] = useState<IntrospectionQuery>();
  const [loading, setLoading] = useState(false);
  /**
   * Create the models & editors
   */
  useEffect(() => {
    const MODEL = {
      operations: getOrCreateModel({
        uri: OPERATIONS_URI,
        value: DEFAULT_VALUE.operations,
      }),
      variables: getOrCreateModel({
        uri: VARIABLES_URI,
        value: DEFAULT_VALUE.variables,
      }),
      response: getOrCreateModel({
        uri: RESPONSE_URI,
        value: DEFAULT_VALUE.response,
      }),
      ts: getOrCreateModel({
        uri: TS_URI,
        value: DEFAULT_VALUE.ts,
      }),
    };
    const EDITOR = {
      operations: editor.create(operationsRef.current, {
        model: MODEL.operations,
        ...DEFAULT_EDITOR_OPTIONS,
      }),
      variables: editor.create(variablesRef.current, {
        model: MODEL.variables,
        ...DEFAULT_EDITOR_OPTIONS,
      }),
      response: editor.create(responseRef.current, {
        model: MODEL.response,
        ...DEFAULT_EDITOR_OPTIONS,
        readOnly: true,
        smoothScrolling: true,
      }),
      ts: editor.create(tsRef.current, {
        model: MODEL.ts,
        ...DEFAULT_EDITOR_OPTIONS,
        smoothScrolling: true,
        readOnly: false,
        'semanticHighlighting.enabled': true,
        language: 'typescript',
      }),
    };
    const queryAction: editor.IActionDescriptor = {
      id: 'graphql-run',
      label: 'Run Operation',
      contextMenuOrder: 0,
      contextMenuGroupId: 'graphql',
      // eslint-disable-next-line no-bitwise
      keybindings: [KeyMod.CtrlCmd | KeyCode.Enter],
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

    const disposables = [
      EDITOR.operations.addAction(queryAction),
      MODEL.operations.onDidChangeContent(
        debounce(300, () => {
          localStorage.setItem(
            STORAGE_KEY.operations,
            MODEL.operations.getValue(),
          );
        }),
      ),
      MODEL.operations.onDidChangeContent(() => {
        const value = MODEL.operations.getValue();
        MODEL.ts.setValue(makeOpTemplate(value));
      }),
      EDITOR.variables.addAction(queryAction),
      MODEL.variables.onDidChangeContent(
        debounce(300, () => {
          localStorage.setItem(
            STORAGE_KEY.variables,
            MODEL.variables.getValue(),
          );
        }),
      ),
      ...Object.values(EDITOR),
      ...Object.values(MODEL),
    ];
    // Clean‑up on unmount
    return () => {
      for (const disposable of disposables) {
        disposable.dispose(); // remove the listener
      }
    };
  }, []);
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
        <div ref={tsRef} className="left-editor" />
      </div>
    </>
  );
}
