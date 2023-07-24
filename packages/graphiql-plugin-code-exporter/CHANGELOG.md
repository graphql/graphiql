# @graphiql/plugin-code-exporter

## 0.3.3

### Patch Changes

- Updated dependencies [[`d67c13f6`](https://github.com/graphql/graphiql/commit/d67c13f6e1f478b171801afd0767b98312db04c9)]:
  - @graphiql/react@0.19.2

## 0.3.2

### Patch Changes

- [#3341](https://github.com/graphql/graphiql/pull/3341) [`e4a36207`](https://github.com/graphql/graphiql/commit/e4a362071edf1db53f87f271c523ab2f3a5c4717) Thanks [@acao](https://github.com/acao)! - Fix code exporter plugin on early init, add hooks

- Updated dependencies [[`17069e7a`](https://github.com/graphql/graphiql/commit/17069e7a0224dbce3f5523630a898e093f5c47c9), [`e4a36207`](https://github.com/graphql/graphiql/commit/e4a362071edf1db53f87f271c523ab2f3a5c4717)]:
  - @graphiql/react@0.19.1

## 0.3.1

### Patch Changes

- [#3350](https://github.com/graphql/graphiql/pull/3350) [`119775ed`](https://github.com/graphql/graphiql/commit/119775ed191ce075532a6e85cbfeac2364c0ba40) Thanks [@acao](https://github.com/acao)! - handle null editor in explorer plugin [(PR)](https://github.com/graphql/graphiql/pull/3340)

## 0.3.0

### Minor Changes

- [#3330](https://github.com/graphql/graphiql/pull/3330) [`bed5fc86`](https://github.com/graphql/graphiql/commit/bed5fc86173eb0e770f966fa529ee035b97a1349) Thanks [@acao](https://github.com/acao)! - **BREAKING CHANGE**: fix lifecycle issue in plugin-explorer, change implementation pattern

  `value` and `setValue` is no longer an implementation detail, and are handled internally by plugins. the plugin signature has changed slightly as well.

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
  import { createGraphiQLFetcher } from '@graphiql/toolkit';

  // only invoke these inside the component lifecycle
  // if there are dynamic values, and then use useMemo() (see below)
  const explorer = explorerPlugin();
  const exporter = codeExporterPlugin({ snippets });

  const fetcher = createGraphiQLFetcher({ url: '/graphql' });

  const App = () => {
    return <GraphiQL plugins={[explorer, exporter]} fetcher={fetcher} />;
  };
  ```

  or this, for more complex state-driven needs:

  ```jsx
  import { useMemo } from 'react';
  import { explorerPlugin } from '@graphiql/plugin-explorer';
  import { snippets } from './snippets';
  import { codeExporterPlugin } from '@graphiql/plugin-code-exporter';

  const explorer = explorerPlugin();
  const fetcher = createGraphiQLFetcher({ url: '/graphql' });

  const App = () => {
    const { snippets } = useMyUserSuppliedState();
    const exporter = useMemo(
      () => codeExporterPlugin({ snippets }),
      [snippets],
    );

    return <GraphiQL plugins={[explorer, exporter]} fetcher={fetcher} />;
  };
  ```

## 0.2.0

### Minor Changes

- [#3293](https://github.com/graphql/graphiql/pull/3293) [`1b8f3fe9`](https://github.com/graphql/graphiql/commit/1b8f3fe9c41697855378ec13a76f1a908fda778a) Thanks [@B2o5T](https://github.com/B2o5T)! - BREAKING CHANGE: umd build was renamed to `index.umd.js`

## 0.1.4

### Patch Changes

- [#3292](https://github.com/graphql/graphiql/pull/3292) [`f86e4172`](https://github.com/graphql/graphiql/commit/f86e41721d4d990535253b579c810bc5e291b40b) Thanks [@B2o5T](https://github.com/B2o5T)! - fix umd build names `graphiql-plugin-code-exporter.umd.js` and `graphiql-plugin-explorer.umd.js`

## 0.1.3

### Patch Changes

- [#3229](https://github.com/graphql/graphiql/pull/3229) [`0a65e720`](https://github.com/graphql/graphiql/commit/0a65e7207b6bc4174896f6acca8a40f45d2fb1b8) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

- [#3251](https://github.com/graphql/graphiql/pull/3251) [`f8d8509b`](https://github.com/graphql/graphiql/commit/f8d8509b432803eaeb2e53b6b6d4321535e11c1d) Thanks [@B2o5T](https://github.com/B2o5T)! - always bundle `package.json#dependencies` for UMD build for `@graphiql/plugin-code-exporter` and `@graphiql/plugin-explorer`

- [#3236](https://github.com/graphql/graphiql/pull/3236) [`64da8c30`](https://github.com/graphql/graphiql/commit/64da8c3074628bb411eb1c28aa4738843f60910c) Thanks [@B2o5T](https://github.com/B2o5T)! - update vite

## 0.1.3-alpha.0

### Patch Changes

- [#3229](https://github.com/graphql/graphiql/pull/3229) [`0a65e720`](https://github.com/graphql/graphiql/commit/0a65e7207b6bc4174896f6acca8a40f45d2fb1b8) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

## 0.1.2

### Patch Changes

- [#3017](https://github.com/graphql/graphiql/pull/3017) [`4a2284f5`](https://github.com/graphql/graphiql/commit/4a2284f54809f91d03ba51b9eb4e3ba7b8b7e773) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid bundling code from `react/jsx-runtime` so that the package can be used with Preact

- [#3063](https://github.com/graphql/graphiql/pull/3063) [`5792aaa5`](https://github.com/graphql/graphiql/commit/5792aaa5b26b68dc396f7bfb5dc3defd9331b831) Thanks [@B2o5T](https://github.com/B2o5T)! - avoid `useMemo` with empty array `[]` since React can't guarantee stable reference, + lint restrict syntax for future mistakes

## 0.1.1

### Patch Changes

- [#2864](https://github.com/graphql/graphiql/pull/2864) [`f61a5574`](https://github.com/graphql/graphiql/commit/f61a55747a6ff3a125c54e2bf3512f8f4b8f4c50) Thanks [@LekoArts](https://github.com/LekoArts)! - chore(@graphiql/plugin-code-exporter): Fix Typo

## 0.1.0

### Minor Changes

- [#2758](https://github.com/graphql/graphiql/pull/2758) [`d63801fa`](https://github.com/graphql/graphiql/commit/d63801fad08e840eff7ff26f55694c6d18769466) Thanks [@LekoArts](https://github.com/LekoArts)! - Add code exported plugin
