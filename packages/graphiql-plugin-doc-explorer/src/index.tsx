import React from 'react';

import { usePluginContext, type GraphiQLPlugin } from '@graphiql/react';

import { DocsFilledIcon, DocsIcon } from './icons';
import { DocExplorer, DocExplorerProps } from './components/doc-explorer';

import {
  ExplorerContext,
  ExplorerContextProvider,
  useExplorerContext,
} from './context';

const DOC_EXPLORER_PLUGIN_TITLE = 'Documentation Explorer';

function GraphiQLDocExplorer(options?: DocExplorerProps) {
  return (
    <ExplorerContextProvider>
      <DocExplorer {...options} />
    </ExplorerContextProvider>
  );
}

function docExplorerPlugin(options?: DocExplorerProps): GraphiQLPlugin {
  return {
    title: DOC_EXPLORER_PLUGIN_TITLE,
    icon: function Icon() {
      const pluginContext = usePluginContext();
      return pluginContext?.visiblePlugin?.title ===
        DOC_EXPLORER_PLUGIN_TITLE ? (
        <DocsFilledIcon />
      ) : (
        <DocsIcon />
      );
    },
    content: () => <GraphiQLDocExplorer {...options} />,
  };
}

export {
  DocExplorer,
  docExplorerPlugin,
  ExplorerContext,
  ExplorerContextProvider,
  useExplorerContext,
};

export { Argument } from './components/argument';
export { DefaultValue } from './components/default-value';
export { DeprecationReason } from './components/deprecation-reason';
export { Directive } from './components/directive';
export { FieldDocumentation } from './components/field-documentation';
export { FieldLink } from './components/field-link';
export { SchemaDocumentation } from './components/schema-documentation';
export { Search } from './components/search';
export { ExplorerSection } from './components/section';
export { TypeDocumentation } from './components/type-documentation';
export { TypeLink } from './components/type-link';

export type { DocExplorerProps };
export type {
  ExplorerContextType,
  ExplorerContextProviderProps,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
} from './context';
