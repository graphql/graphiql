import {
  GraphiQLPlugin,
  useEditorContext,
  useExecutionContext,
  useSchemaContext,
} from '@graphiql/react';
import {
  Explorer as GraphiQLExplorer,
  GraphiQLExplorerProps,
} from 'graphiql-explorer';
import React, { useCallback } from 'react';

import './graphiql-explorer.d.ts';
import './index.css';

const colors = {
  keyword: 'hsl(var(--color-primary))',
  def: 'hsl(var(--color-tertiary))',
  property: 'hsl(var(--color-info))',
  qualifier: 'hsl(var(--color-secondary))',
  attribute: 'hsl(var(--color-tertiary))',
  number: 'hsl(var(--color-success))',
  string: 'hsl(var(--color-warning))',
  builtin: 'hsl(var(--color-success))',
  string2: 'hsl(var(--color-secondary))',
  variable: 'hsl(var(--color-secondary))',
  atom: 'hsl(var(--color-tertiary))',
};

const arrowOpen = (
  <svg
    viewBox="0 -4 13 15"
    style={{
      color: 'hsla(var(--color-neutral), var(--alpha-tertiary, 0.4))',
      marginRight: 'var(--px-4)',
      height: 'var(--px-16)',
      width: 'var(--px-16)',
    }}
  >
    <path
      d="M3.35355 6.85355L6.14645 9.64645C6.34171 9.84171 6.65829 9.84171 6.85355 9.64645L9.64645 6.85355C9.96143 6.53857 9.73835 6 9.29289 6L3.70711 6C3.26165 6 3.03857 6.53857 3.35355 6.85355Z"
      fill="currentColor"
    />
  </svg>
);

const arrowClosed = (
  <svg
    viewBox="0 -2 13 15"
    style={{
      color: 'hsla(var(--color-neutral), var(--alpha-tertiary, 0.4))',
      marginRight: 'var(--px-4)',
      height: 'var(--px-16)',
      width: 'var(--px-16)',
    }}
  >
    <path
      d="M6.35355 11.1464L9.14645 8.35355C9.34171 8.15829 9.34171 7.84171 9.14645 7.64645L6.35355 4.85355C6.03857 4.53857 5.5 4.76165 5.5 5.20711V10.7929C5.5 11.2383 6.03857 11.4614 6.35355 11.1464Z"
      fill="currentColor"
    />
  </svg>
);

const checkboxUnchecked = (
  <svg
    viewBox="0 0 15 15"
    style={{
      color: 'hsla(var(--color-neutral), var(--alpha-tertiary, 0.4))',
      marginRight: 'var(--px-4)',
      height: 'var(--px-16)',
      width: 'var(--px-16)',
    }}
  >
    <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" fill="none" />
  </svg>
);

const checkboxChecked = (
  <svg
    viewBox="0 0 15 15"
    style={{
      color: 'hsl(var(--color-info))',
      marginRight: 'var(--px-4)',
      height: 'var(--px-16)',
      width: 'var(--px-16)',
    }}
  >
    <circle cx="7.5" cy="7.5" r="7.5" fill="currentColor" />
    <path
      d="M4.64641 7.00106L6.8801 9.23256L10.5017 5.61325"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
    />
  </svg>
);

const styles = {
  buttonStyle: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsla(var(--color-neutral), var(--alpha-secondary, 0.6))',
    cursor: 'pointer',
    fontSize: '1em',
  },
  explorerActionsStyle: {
    padding: 'var(--px-8) var(--px-4)',
  },
  actionButtonStyle: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsla(var(--color-neutral), var(--alpha-secondary, 0.6))',
    cursor: 'pointer',
    fontSize: '1em',
  },
};

export type GraphiQLExplorerPluginProps = Omit<GraphiQLExplorerProps, 'query'>;

function ExplorerPlugin(props: GraphiQLExplorerPluginProps) {
  const { setOperationName, queryEditor } = useEditorContext({ nonNull: true });
  const { schema } = useSchemaContext({ nonNull: true });
  const { run } = useExecutionContext({ nonNull: true });
  const handleRunOperation = useCallback(
    (operationName: string | null) => {
      if (operationName) {
        setOperationName(operationName);
      }
      run();
    },
    [run, setOperationName],
  );
  const handleEditOperation = useCallback(
    (value: string) => queryEditor!.setValue(value),
    [queryEditor],
  );

  return (
    <GraphiQLExplorer
      schema={schema}
      onRunOperation={handleRunOperation}
      explorerIsOpen
      colors={colors}
      arrowOpen={arrowOpen}
      arrowClosed={arrowClosed}
      checkboxUnchecked={checkboxUnchecked}
      checkboxChecked={checkboxChecked}
      styles={styles}
      {...props}
      // this might not work, we need this to re-render on query value changes
      query={queryEditor!.getValue()}
      // we should be setting query editor state to the editor, not sure how else to do this
      onEdit={handleEditOperation}
    />
  );
}

export function GraphiQLExplorerPlugin(props: GraphiQLExplorerPluginProps) {
  return {
    title: 'GraphiQL Explorer',
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
    content: () => <ExplorerPlugin {...props} />,
  } as GraphiQLPlugin;
}
