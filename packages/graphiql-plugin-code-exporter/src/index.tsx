import { GraphiQLPlugin } from '@graphiql/react';
import { useMemo, useRef } from 'react';
import GraphiQLCodeExporter, {
  GraphiQLCodeExporterProps,
} from 'graphiql-code-exporter';

import './graphiql-code-exporter.d.ts';
// TODO: Check if needed or if we should style everything ourselves
// import 'graphiql-code-exporter/CodeExporter.css'
import './index.css';

function ExporterPlugin(props: GraphiQLCodeExporterProps) {
  const {
    query = ``,
    codeMirrorTheme = `graphiql`,
    variables = ``,
    context = {},
    ...rest
  } = props;
  return (
    <GraphiQLCodeExporter
      query={query}
      codeMirrorTheme={codeMirrorTheme}
      variables={variables}
      context={context}
      {...rest}
    />
  );
}

export function useExporterPlugin(props: GraphiQLCodeExporterProps) {
  const propsRef = useRef(props);
  propsRef.current = props;
  return useMemo<GraphiQLPlugin>(
    () => ({
      title: 'GraphiQL Code Exporter',
      icon: () => (
        <svg height="1em" strokeWidth="1.5" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6H20M22 6H20M20 6V4M20 6V8"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21.4 20H2.6C2.26863 20 2 19.7314 2 19.4V11H21.4C21.7314 11 22 11.2686 22 11.6V19.4C22 19.7314 21.7314 20 21.4 20Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 11V4.6C2 4.26863 2.26863 4 2.6 4H8.77805C8.92127 4 9.05977 4.05124 9.16852 4.14445L12.3315 6.85555C12.4402 6.94876 12.5787 7 12.722 7H14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      content: () => <ExporterPlugin {...propsRef.current} />,
    }),
    [],
  );
}
