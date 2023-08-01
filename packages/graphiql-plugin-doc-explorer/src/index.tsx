import {
  usePluginContext,
  type GraphiQLPlugin,
  DocsFilledIcon,
  DocsIcon,
} from '@graphiql/react';

export { Argument } from './components/argument';
export { DefaultValue } from './components/default-value';
export { DeprecationReason } from './components/deprecation-reason';
export { Directive } from './components/directive';
import { DocExplorer } from './components/doc-explorer';
export { FieldDocumentation } from './components/field-documentation';
export { FieldLink } from './components/field-link';
export { SchemaDocumentation } from './components/schema-documentation';
export { Search } from './components/search';
export { ExplorerSection } from './components/section';
export { TypeDocumentation } from './components/type-documentation';
export { TypeLink } from './components/type-link';

export { DocExplorer };

const DOC_EXPLORER_PLUGIN_TITLE = 'Documentation Explorer';

export const docExplorerPlugin: GraphiQLPlugin = {
  title: DOC_EXPLORER_PLUGIN_TITLE,
  icon: function Icon() {
    const pluginContext = usePluginContext();
    return pluginContext?.visiblePlugin?.title === DOC_EXPLORER_PLUGIN_TITLE ? (
      <DocsFilledIcon />
    ) : (
      <DocsIcon />
    );
  },
  content: DocExplorer,
};
