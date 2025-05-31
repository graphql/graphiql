import {
  DocsFilledIcon,
  DocsIcon,
  GraphiQLPlugin,
  useGraphiQL,
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
    const visiblePlugin = useGraphiQL(state => state.visiblePlugin);
    return visiblePlugin === DOC_EXPLORER_PLUGIN ? (
      <DocsFilledIcon />
    ) : (
      <DocsIcon />
    );
  },
  content: DocExplorer,
};
