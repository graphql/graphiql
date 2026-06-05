import type { FC } from 'react';
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import { ToolbarButton, useGraphiQL } from '@graphiql/react';
import 'graphiql/setup-workers/esm.sh';

const transport = createTransport({
  url: 'https://graphql.earthdata.nasa.gov/api',
});

export const graphiql = (
  <GraphiQL
    dangerouslyAssumeSchemaIsValid
    defaultEditorToolsVisibility="variables"
    transport={transport}
    isHeadersEditorEnabled={false}
  >
    <GraphiQL.Logo>API Explorer</GraphiQL.Logo>
    <GraphiQL.Toolbar>
      {({ prettify, copy, merge }) => (
        <>
          {prettify}
          {copy}
          {merge}
          <Button />
        </>
      )}
    </GraphiQL.Toolbar>
  </GraphiQL>
);

const Button: FC = () => {
  const { queryEditor, variableEditor } = useGraphiQL(state => ({
    queryEditor: state.queryEditor,
    variableEditor: state.variableEditor,
  }));

  async function onShareExplorer(): Promise<void> {
    const shareableURL = new URL('/explorer', location.origin);
    const operations = queryEditor!.getValue();
    const variables = variableEditor!.getValue();
    if (operations) {
      shareableURL.searchParams.set('query', encodeURIComponent(operations));
    }
    if (variables) {
      shareableURL.searchParams.set('variables', encodeURIComponent(variables));
    }
    const url = shareableURL.toString();
    await navigator.clipboard.writeText(url);
  }

  return (
    <ToolbarButton
      label="Share your Explorer query"
      onClick={onShareExplorer}
      style={{ textAlign: 'center' }}
      title="Share your Explorer query"
    >
      S
    </ToolbarButton>
  );
};
