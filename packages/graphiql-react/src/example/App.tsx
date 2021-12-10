import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { getIntrospectionQuery, IntrospectionQuery } from 'graphql';
import * as monaco from 'monaco-editor';
import { initializeMode } from 'monaco-graphql/esm/initializeMode';

import { createGraphiQLFetcher } from '@graphiql/toolkit';

const fetcher = createGraphiQLFetcher({
  url: 'https://api.spacex.land/graphql/',
});

const getSchema = async () =>
  fetcher({
    query: getIntrospectionQuery(),
    operationName: 'IntrospectionQuery',
  });

const getOrCreateModel = (uri: string, value: string) => {
  return (
    monaco.editor.getModel(monaco.Uri.file(uri)) ??
    monaco.editor.createModel(value, uri.split('.').pop(), monaco.Uri.file(uri))
  );
};
export default function App() {
  const [
    queryEditor,
    setQueryEditor,
  ] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [
    variablesEditor,
    setVariablesEditor,
  ] = React.useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [schema, setSchema] = React.useState<unknown | null>(null);
  const [loading, setLoading] = React.useState(false);

  useEffect(() => {
    const queryModel = getOrCreateModel(
      'operation.graphql',
      'query { payloads }',
    );
    const variablesModel = getOrCreateModel('variables.json', '{}');
    queryEditor ??
      setQueryEditor(
        monaco.editor.create(document.getElementById('operations')!, {
          model: queryModel,
          theme: 'vs-dark',
        }),
      );
    variablesEditor ??
      setVariablesEditor(
        monaco.editor.create(document.getElementById('variables')!, {
          model: variablesModel,
          theme: 'vs-dark',
        }),
      );

    if (!schema && !loading) {
      setLoading(true);
      getSchema()
        .then(data => {
            const api = initializeMode();
          setSchema(data.data);
          api.setSchemaConfig([
            {
              introspectionJSONString: JSON.stringify(data.data),
              fileMatch: [queryEditor?.getModel().uri],
              uri: 'myschema.graphql',
            },
          ])
          return
        })
        .then(() => setLoading(false));
    }
  }, [queryEditor, variablesEditor, schema, loading]);
  return (
    <div id="wrapper">
      <div id="left-pane" className="pane">
        <div id="operations" className="editor" />
        <div id="variables" className="editor" />
      </div>
    </div>
  );
}
