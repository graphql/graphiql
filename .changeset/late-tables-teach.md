---
'@graphiql/plugin-code-exporter': minor
'@graphiql/plugin-explorer': minor
---

*BREAKING CHANGE*: fix lifecycle issue in plugin-explorer, change implementation pattern

`value` and `setValue` is no longer an implementation detail, and are handled internally by plugins

now you can simplify implementations like these:

```js
import { useExplorerPlugin } from '@graphiql/plugin-explorer';
import { snippets } from './snippets';
import { useCodeExporterPlugin } from '@graphiql/plugin-code-exporter';

const App = () => {
  const [query, setQuery] = React.useState('');
  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });
  const exporterPlugin = useExporterPlugin({
    query,
    snippets,
  });

  const plugins = React.useMemo(
    () => [explorerPlugin, exporterPlugin],
    [explorerPlugin, exporterPlugin],
  );

  return (
    <GraphiQL
      query={query}
      onEditQuery={setQuery}
      plugins={plugins}
      fetcher={fetcher}
    />
  );
};
```

is now as simple as:

```js
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { snippets } from './snippets';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';

// only invoke these inside the component lifecycle
// if there are dynamic values, and then use useMemo()
const explorer = explorerPlugin();
const exporter = codeExporterPlugin({ snippets });

const App = () => {
  return (
    <GraphiQL
      plugins={[explorer, exporter]}
      fetcher={fetcher}
    />
  );
};
```
