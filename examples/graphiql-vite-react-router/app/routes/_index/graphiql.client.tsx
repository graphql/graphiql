import type { FC } from 'react';
import { GraphiQL } from 'graphiql';
import { createTransport } from '@graphiql/toolkit';
import {
  CopyIcon,
  ToolbarButton,
  useGraphiQL,
  type GraphiQLPlugin,
} from '@graphiql/react';
import { HISTORY_PLUGIN } from '@graphiql/plugin-history';
import { QUERY_BUILDER_PLUGIN } from '@graphiql/plugin-query-builder';
import { collectionsPlugin } from '@graphiql/plugin-collections';
import 'graphiql/setup-workers/esm.sh';

const transport = createTransport({
  url: 'https://graphql.earthdata.nasa.gov/api',
});

const ShareButton: FC = () => {
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

const sharePlugin: GraphiQLPlugin = {
  title: 'Share Explorer Query',
  icon: CopyIcon,
  content: () => (
    <p>Copies a link to the current query and variables to your clipboard.</p>
  ),
  sessionActions: ShareButton,
};

export const graphiql = (
  <GraphiQL
    dangerouslyAssumeSchemaIsValid
    defaultEditorToolsVisibility="variables"
    transport={transport}
    isHeadersEditorEnabled={false}
    brand="API Explorer"
    plugins={[
      HISTORY_PLUGIN,
      QUERY_BUILDER_PLUGIN,
      collectionsPlugin(),
      sharePlugin,
    ]}
  />
);
