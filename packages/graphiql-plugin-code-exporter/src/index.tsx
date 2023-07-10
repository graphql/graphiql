import { useEditorContext, type GraphiQLPlugin } from '@graphiql/react';
import React from 'react';
import GraphiQLCodeExporter, {
  GraphiQLCodeExporterProps,
} from 'graphiql-code-exporter';

import './graphiql-code-exporter.d.ts';
import './index.css';

type GraphiQLCodeExporterPluginProps = Omit<GraphiQLCodeExporterProps, 'query'>;

function GraphiQLCodeExporterPlugin(props: GraphiQLCodeExporterPluginProps) {
  const { queryEditor } = useEditorContext({ nonNull: true });

  return (
    <GraphiQLCodeExporter
      codeMirrorTheme="graphiql"
      {...props}
      query={queryEditor!.getValue()}
    />
  );
}

export function exporterPlugin(props: GraphiQLCodeExporterPluginProps) {
  return {
    title: 'GraphiQL Code Exporter',
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15"
        />
      </svg>
    ),
    content() {
      return <GraphiQLCodeExporterPlugin {...props} />;
    },
  } as GraphiQLPlugin;
}
