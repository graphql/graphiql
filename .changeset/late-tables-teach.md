---
'@graphiql/plugin-code-exporter': minor
'@graphiql/plugin-explorer': minor
---

**BREAKING CHANGE**: fix lifecycle issue in plugin-explorer, change implementation pattern

`value` and `setValue` is no longer an implementation detail, and are handled internally by plugins.
the plugin signature has changed slightly as well.

now, instead of something like this:

```jsx
import { useExplorerPlugin } from '@graphiql/plugin-explorer';
import { snippets } from './snippets';
import { useExporterPlugin } from '@graphiql/plugin-code-exporter';

const App = () => {
  const [query, setQuery] = React.useState('');
  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });
  const codeExporterPlugin = useExporterPlugin({
    query,
    snippets,
  });

  const plugins = React.useMemo(
    () => [explorerPlugin, codeExporterPlugin],
    [explorerPlugin, codeExporterPlugin],
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

you can just do this:

```jsx
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { snippets } from './snippets';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';
import { createGraphiQLFetcher } from '@graphiql/toolkit'

// only invoke these inside the component lifecycle
// if there are dynamic values, and then use useMemo() (see below)
const explorer = explorerPlugin();
const exporter = codeExporterPlugin({ snippets });

const fetcher = createGraphiQLFetcher({ url: '/graphql' })

const App = () => {
  return (
    <GraphiQL
      plugins={[explorer, exporter]}
      fetcher={fetcher}
    />
  );
};
```

or this, for more complex state-driven needs:

```jsx
import { useMemo } from 'react'
import { explorerPlugin } from '@graphiql/plugin-explorer';
import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';

const explorer = explorerPlugin();
const fetcher = createGraphiQLFetcher({ url: '/graphql' })

const App = () => {
 const {snippets} = useMyUserSuppliedState()
 const exporter = useMemo(() => codeExporterPlugin({ snippets }), [snippets])

  return (
    <GraphiQL
      plugins={[explorer, exporter]}
      fetcher={fetcher}
    />
  );
};
```
