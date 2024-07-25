import React, { CSSProperties, useCallback } from 'react';
import {
  GraphiQLPlugin,
  useEditorContext,
  useExecutionContext,
  useSchemaContext,
  useOperationsEditorState,
  useOptimisticState,
} from '@graphiql/react';
import {
  Explorer as GraphiQLExplorer,
  GraphiQLExplorerProps,
} from 'graphiql-explorer';

import ArrowIcon from './icons/arrow.svg?react';
import FolderPlusIcon from './icons/folder-plus.svg?react';
import CheckboxUncheckedIcon from './icons/checkbox-unchecked.svg?react';
import CheckboxCheckedIcon from './icons/checkbox-checked.svg?react';

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
  <ArrowIcon style={{ width: 'var(--px-16)', transform: 'rotate(90deg)' }} />
);
const arrowClosed = <ArrowIcon style={{ width: 'var(--px-16)' }} />;
const checkboxUnchecked = (
  <CheckboxUncheckedIcon style={{ marginRight: 'var(--px-4)' }} />
);
const checkboxChecked = (
  <CheckboxCheckedIcon
    style={{ fill: 'hsl(var(--color-info))', marginRight: 'var(--px-4)' }}
  />
);

const styles: Record<string, CSSProperties> = {
  buttonStyle: {
    cursor: 'pointer',
    fontSize: '2em',
    lineHeight: 0,
  },
  explorerActionsStyle: {
    paddingTop: 'var(--px-16)',
  },
  actionButtonStyle: {},
};

export type GraphiQLExplorerPluginProps = Omit<
  GraphiQLExplorerProps,
  'onEdit' | 'query'
>;

function ExplorerPlugin(props: GraphiQLExplorerPluginProps) {
  const { setOperationName } = useEditorContext({ nonNull: true });
  const { schema } = useSchemaContext({ nonNull: true });
  const { run } = useExecutionContext({ nonNull: true });

  // handle running the current operation from the plugin
  const handleRunOperation = useCallback(
    (operationName: string | null) => {
      if (operationName) {
        // set the plugin-defined operation name before executing
        setOperationName(operationName);
      }
      run();
    },
    [run, setOperationName],
  );

  // load the current editor tab state into the explorer
  const [operationsString, handleEditOperations] = useOptimisticState(
    useOperationsEditorState(),
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
      query={operationsString}
      onEdit={handleEditOperations}
      {...props}
    />
  );
}

export function explorerPlugin(
  props?: GraphiQLExplorerPluginProps,
): GraphiQLPlugin {
  return {
    title: 'GraphiQL Explorer',
    icon: FolderPlusIcon,
    content: () => <ExplorerPlugin {...props} />,
  };
}
