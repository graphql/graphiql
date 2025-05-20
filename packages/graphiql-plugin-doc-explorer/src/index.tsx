import {
  DocsFilledIcon,
  DocsIcon,
  GraphiQLPlugin,
  usePluginStore,
} from '@graphiql/react';
import { DocExplorer } from './components';

export * from './components';

export {
  DocExplorerStore,
  useDocExplorer,
  useDocExplorerActions,
} from './context';

export type {
  DocExplorerFieldDef,
  DocExplorerNavStack,
  DocExplorerNavStackItem,
} from './context';

export const DOC_EXPLORER_PLUGIN: GraphiQLPlugin = {
  title: 'Documentation Explorer',
  icon: function Icon() {
    const visiblePlugin = usePluginStore(store => store.visiblePlugin);
    return visiblePlugin === DOC_EXPLORER_PLUGIN ? (
      <DocsFilledIcon />
    ) : (
      <DocsIcon />
    );
  },
  content: DocExplorer,
};
