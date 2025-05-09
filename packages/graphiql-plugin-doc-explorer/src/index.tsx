import {
  DocsFilledIcon,
  DocsIcon,
  GraphiQLPlugin,
  usePluginContext,
} from '@graphiql/react';
import { DocExplorer } from './components';

export * from './components';

export {
  DocExplorerContext,
  DocExplorerContextProvider,
  useDocExplorer,
  useDocExplorerActions,
} from './context';

export type {
  DocExplorerContextType,
  DocExplorerFieldDef,
  DocExplorerNavStack,
  DocExplorerNavStackItem,
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
