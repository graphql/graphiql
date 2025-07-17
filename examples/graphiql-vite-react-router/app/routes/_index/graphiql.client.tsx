import { FC } from 'react';
import { copyToClipboard } from './helpers/copyToClipboard';
import { createFetcher } from './helpers/createFetcher';
import {
  ToolbarButton,
  useOperationsEditorState,
  useVariablesEditorState,
} from '@graphiql/react';
import { GraphiQL } from 'graphiql';
import 'graphiql/setup-workers/esm.sh';

export const App: FC = () => {
  return (
    <GraphiQL
      dangerouslyAssumeSchemaIsValid
      defaultEditorToolsVisibility="variables"
      fetcher={createFetcher('https://graphql.earthdata.nasa.gov/api')}
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
};

const Button: FC = () => {
  const [operations] = useOperationsEditorState();
  const [variables] = useVariablesEditorState();

  async function onShareExplorer(): Promise<void> {
    const shareableURL = new URL('/explorer', location.origin);
    if (operations) {
      shareableURL.searchParams.set('query', encodeURIComponent(operations));
    }
    if (variables) {
      shareableURL.searchParams.set('variables', encodeURIComponent(variables));
    }
    await copyToClipboard(shareableURL.toString());
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
