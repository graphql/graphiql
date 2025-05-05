import {
  DocsFilledIcon,
  DocsIcon,
  GraphiQLPlugin,
  usePluginContext,
} from '@graphiql/react';
import { DocExplorer } from './components';

export * from './components';

export {
  ExplorerContext,
  ExplorerContextProvider,
  useExplorerContext,
} from './context';

export type {
  ExplorerContextType,
  ExplorerFieldDef,
  ExplorerNavStack,
  ExplorerNavStackItem,
} from './context';

export const DOC_EXPLORER_PLUGIN: GraphiQLPlugin = {
  title: 'Documentation Explorer',
  icon: function Icon() {
    const pluginContext = usePluginContext();
    return pluginContext?.visiblePlugin === DOC_EXPLORER_PLUGIN ? (
      <DocsFilledIcon />
    ) : (
      <DocsIcon />
    );
  },
  content: DocExplorer,
};
