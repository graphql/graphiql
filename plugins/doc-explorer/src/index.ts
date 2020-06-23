export { default as DocExplorer } from './DocExplorer';
export { default as SchemaDoc } from './SchemaDoc';
export { default as FieldDoc } from './FieldDoc';
export { default as TypeDoc } from './TypeDoc';

import type { PluginDefinition } from '@graphiql/sdk';
import { DocExplorerProvider } from './DocExplorerProvider';
import DocExplorerIcon from './doc-explorer-icon.svg';

export const plugin: PluginDefinition = {
  name: 'doc-explorer',
  description:
    'This is the official documentation explorer for graphiql. you can search and explore your schema using this tool',
  additionalProviders: [DocExplorerProvider],
  sidebarTabs: [
    {
      id: 'doc-explorer',
      component: import('./DocExplorer'),
      icon: DocExplorerIcon,
      weight: 4,
    },
  ],
  configurationOptions: {
    'explorer.openByDefault': { default: false, type: 'boolean' },
  },
};
