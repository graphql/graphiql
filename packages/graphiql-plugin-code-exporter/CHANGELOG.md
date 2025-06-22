# @graphiql/plugin-code-exporter

## 5.0.0-rc.2

### Minor Changes

- [#4025](https://github.com/graphql/graphiql/pull/4025) [`6a50740`](https://github.com/graphql/graphiql/commit/6a507407c7c63bfc779ad383054ab3a8c003ef5b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - set "importsNotUsedAsValues": "error" in tsconfig

## 5.0.0-rc.1

### Major Changes

- [#4002](https://github.com/graphql/graphiql/pull/4002) [`2d9faec`](https://github.com/graphql/graphiql/commit/2d9faec57830b38aa175929c47a55c959c327535) Thanks [@dimaMachina](https://github.com/dimaMachina)! - remove UMD builds

## 4.0.6-rc.0

### Patch Changes

- [#3234](https://github.com/graphql/graphiql/pull/3234) [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Migration from Codemirror to [Monaco Editor](https://github.com/microsoft/monaco-editor)

  Replacing `codemirror-graphql` with [`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)

  Support for comments in **Variables** and **Headers** editors

- Updated dependencies [[`0844dc1`](https://github.com/graphql/graphiql/commit/0844dc1ca89a5d8fce0dc23658cca6987ff8443e), [`86a96e5`](https://github.com/graphql/graphiql/commit/86a96e5f1779b5d0e84ad4179dbd6c5d4947fb91), [`2455907`](https://github.com/graphql/graphiql/commit/245590708cea52ff6f1bcce8664781f7e56029cb)]:
  - @graphiql/react@0.35.0-rc.0

## 4.0.5

### Patch Changes

- Updated dependencies [[`71755b7`](https://github.com/graphql/graphiql/commit/71755b7f412f8f3dd9f5194d3f1e0168b9ad07af), [`6d631e2`](https://github.com/graphql/graphiql/commit/6d631e2e558d038476fe235b1506bc52ecf68781)]:
  - @graphiql/react@0.34.0

## 4.0.4

### Patch Changes

- Updated dependencies [[`117627b`](https://github.com/graphql/graphiql/commit/117627b451607198dd7b9dc19e76da8a71d14b71), [`fa78481`](https://github.com/graphql/graphiql/commit/fa784819ce020346052901019079fb5b44af6ef0), [`7275472`](https://github.com/graphql/graphiql/commit/727547236bbd4fc721069ceae63eb8a6acffa57e), [`00c8605`](https://github.com/graphql/graphiql/commit/00c8605e1f3068e6547a5a9e969571a86a57f921)]:
  - @graphiql/react@0.33.0

## 4.0.3

### Patch Changes

- [#3939](https://github.com/graphql/graphiql/pull/3939) [`69ad489`](https://github.com/graphql/graphiql/commit/69ad489678d0096432d5c4b1749d87343f4ed1f7) Thanks [@dimaMachina](https://github.com/dimaMachina)! - prefer `React.FC` type when declaring React components

## 4.0.2

### Patch Changes

- Updated dependencies [[`98d13a3`](https://github.com/graphql/graphiql/commit/98d13a3e515eb70aaf5a5ba669c680d5959fef67)]:
  - @graphiql/react@0.32.0

## 4.0.1

### Patch Changes

- [#3915](https://github.com/graphql/graphiql/pull/3915) [`bc31cd9`](https://github.com/graphql/graphiql/commit/bc31cd99a92693238e7359456e3cc22ed0387df0) Thanks [@dimaMachina](https://github.com/dimaMachina)! - fix unpkg.com results to `Not found` when `main` field isn't specified in `package.json`

- Updated dependencies [[`e7c436b`](https://github.com/graphql/graphiql/commit/e7c436b329a68981bdbd2b662be94875a546a1d6)]:
  - @graphiql/react@0.31.0

## 4.0.0

### Major Changes

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - `style.css` import was changed

  ## Migration

  ```diff
  -import '@graphiql/plugin-code-exporter/dist/style.css';
  +import '@graphiql/plugin-code-exporter/style.css';
  ```

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - drop commonjs build files

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - - support react 19, drop support react 16 and react 17
  - replace deprecated `ReactDOM.unmountComponentAtNode()` and `ReactDOM.render()` with `root.unmount()` and `createRoot(container).render()`
  - update `@radix-ui` and `@headlessui/react` dependencies

### Minor Changes

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - Update GraphiQL CDN example using ESM-based CDN esm.sh

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - generate types with `vite-plugin-dts`

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - update `vite` and related dependencies

### Patch Changes

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - fix types incorrect types entry

- [#3904](https://github.com/graphql/graphiql/pull/3904) [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602) Thanks [@dimaMachina](https://github.com/dimaMachina)! - use `vite build --watch` instead of `vite` for `dev` script because we don't need development server for them

  do not use `vite-plugin-dts` when generating umd build

- Updated dependencies [[`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602), [`d1395f9`](https://github.com/graphql/graphiql/commit/d1395f987b3f9c70b69ec5ad7283c63594dd7602)]:
  - @graphiql/react@0.30.0

## 4.0.0-alpha.1

### Patch Changes

- [#3740](https://github.com/graphql/graphiql/pull/3740) [`3c12ce0`](https://github.com/graphql/graphiql/commit/3c12ce01eb3b2ec9a317a2fea2bb92602b748a8b) Thanks [@dimaMachina](https://github.com/dimaMachina)! - fix types incorrect types entry

## 4.0.0-alpha.0

### Major Changes

- [#3709](https://github.com/graphql/graphiql/pull/3709) [`9baf1f0`](https://github.com/graphql/graphiql/commit/9baf1f0fc9f32404fbb8bf57b3d1c2c2c8778ddb) Thanks [@dimaMachina](https://github.com/dimaMachina)! - `style.css` import was changed

  ## Migration

  ```diff
  -import '@graphiql/plugin-code-exporter/dist/style.css';
  +import '@graphiql/plugin-code-exporter/style.css';
  ```

### Minor Changes

- [#3702](https://github.com/graphql/graphiql/pull/3702) [`00415d2`](https://github.com/graphql/graphiql/commit/00415d2940c4d76a4a9e683e9fa0504ba97dd627) Thanks [@dimaMachina](https://github.com/dimaMachina)! - generate types with `vite-plugin-dts`

### Patch Changes

- [#3705](https://github.com/graphql/graphiql/pull/3705) [`8ff87d7`](https://github.com/graphql/graphiql/commit/8ff87d7b6b3d5d12b539612a39ca3abf7e631106) Thanks [@dimaMachina](https://github.com/dimaMachina)! - use `vite build --watch` instead of `vite` for `dev` script because we don't need development server for them

  do not use `vite-plugin-dts` when generating umd build

- Updated dependencies [[`00415d2`](https://github.com/graphql/graphiql/commit/00415d2940c4d76a4a9e683e9fa0504ba97dd627), [`9baf1f0`](https://github.com/graphql/graphiql/commit/9baf1f0fc9f32404fbb8bf57b3d1c2c2c8778ddb), [`8ff87d7`](https://github.com/graphql/graphiql/commit/8ff87d7b6b3d5d12b539612a39ca3abf7e631106), [`82bc961`](https://github.com/graphql/graphiql/commit/82bc961a33c4e9da29dffb4a603035a4909f49ad), [`3c1a345`](https://github.com/graphql/graphiql/commit/3c1a345acd9bf07b45bc230009cb57c51c425673)]:
  - @graphiql/react@1.0.0-alpha.0

## 3.1.5

### Patch Changes

- Updated dependencies [[`cb29e9f`](https://github.com/graphql/graphiql/commit/cb29e9fbe1362778bc327513fc884c4ec419775e), [`1adc40c`](https://github.com/graphql/graphiql/commit/1adc40cc56dbf79296bb857156e6adce1c44dcbe)]:
  - @graphiql/react@0.29.0

## 3.1.4

### Patch Changes

- Updated dependencies [[`3633d61`](https://github.com/graphql/graphiql/commit/3633d61c3c597adf60c0ec1bbf98cf6a1f49beed)]:
  - @graphiql/react@0.28.0

## 3.1.3

### Patch Changes

- Updated dependencies [[`f86e2bc`](https://github.com/graphql/graphiql/commit/f86e2bce40826b3d07755f91b37a72051de00f9c)]:
  - @graphiql/react@0.27.0

## 3.1.2

### Patch Changes

- Updated dependencies [[`959ed21`](https://github.com/graphql/graphiql/commit/959ed21815682fc439f64d78e23e603a8f313a6f), [`9aef83a`](https://github.com/graphql/graphiql/commit/9aef83a32aeb5f193a3ff0f191c95d09eb0d70b6)]:
  - @graphiql/react@0.26.0

## 3.1.1

### Patch Changes

- Updated dependencies [[`7404e8e`](https://github.com/graphql/graphiql/commit/7404e8e6c62b06107f452142493297ec70f1649c)]:
  - @graphiql/react@0.25.0

## 3.1.0

### Minor Changes

- [#3682](https://github.com/graphql/graphiql/pull/3682) [`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931) Thanks [@yaacovCR](https://github.com/yaacovCR)! - Support v17 of `graphql-js` from `17.0.0-alpha.2` forward.

  Includes support for the latest incremental delivery response format. For further details, see https://github.com/graphql/defer-stream-wg/discussions/69.

### Patch Changes

- Updated dependencies [[`6c9f0df`](https://github.com/graphql/graphiql/commit/6c9f0df83ea4afe7fa59f84d83d59fba73dc3931)]:
  - @graphiql/react@0.24.0

## 3.0.5

### Patch Changes

- [#3657](https://github.com/graphql/graphiql/pull/3657) [`5bc7b84`](https://github.com/graphql/graphiql/commit/5bc7b84531b6404553787615d61a5cbcc96c1d6f) Thanks [@dimaMachina](https://github.com/dimaMachina)! - update vite to v5

- [#3656](https://github.com/graphql/graphiql/pull/3656) [`93c7e9f`](https://github.com/graphql/graphiql/commit/93c7e9fd224cb4f1e9a86b3391efc1e0ef6e1e3f) Thanks [@dimaMachina](https://github.com/dimaMachina)! - set `build.minify: false` for cjs/esm builds since minified variable names change every build time

- Updated dependencies [[`5bc7b84`](https://github.com/graphql/graphiql/commit/5bc7b84531b6404553787615d61a5cbcc96c1d6f), [`fdec377`](https://github.com/graphql/graphiql/commit/fdec377f28ac0d918a219b78dfa2d8f0996ff84d), [`93c7e9f`](https://github.com/graphql/graphiql/commit/93c7e9fd224cb4f1e9a86b3391efc1e0ef6e1e3f)]:
  - @graphiql/react@0.23.0

## 3.0.4

### Patch Changes

- [#3634](https://github.com/graphql/graphiql/pull/3634) [`adf0ba01`](https://github.com/graphql/graphiql/commit/adf0ba019902dcac2e49ccee69b79a6665c4766d) Thanks [@dimaMachina](https://github.com/dimaMachina)! - when alpha is `1`, use `hsl` instead of `hsla`

- Updated dependencies [[`adf0ba01`](https://github.com/graphql/graphiql/commit/adf0ba019902dcac2e49ccee69b79a6665c4766d)]:
  - @graphiql/react@0.22.4

## 3.0.3

### Patch Changes

- Updated dependencies [[`335d830c`](https://github.com/graphql/graphiql/commit/335d830c2a4e551ef97fbeff8ed7c538ff5cd4af)]:
  - @graphiql/react@0.22.3

## 3.0.2

### Patch Changes

- Updated dependencies [[`03ab3a6b`](https://github.com/graphql/graphiql/commit/03ab3a6b76378591ef79a828d80cc69b0b8f2842)]:
  - @graphiql/react@0.22.2

## 3.0.1

### Patch Changes

- Updated dependencies [[`224b43f5`](https://github.com/graphql/graphiql/commit/224b43f5473456f264a82998d48a34a441537f54)]:
  - @graphiql/react@0.22.1

## 3.0.0

### Patch Changes

- Updated dependencies [[`d48f4ef5`](https://github.com/graphql/graphiql/commit/d48f4ef56578dad7ec90f33458353791e463ef7b)]:
  - @graphiql/react@0.22.0

## 2.0.0

### Patch Changes

- Updated dependencies [[`5d051054`](https://github.com/graphql/graphiql/commit/5d05105469c3f0cbeb5e294da1cf6ff2355e4eb5)]:
  - @graphiql/react@0.21.0

## 1.0.5

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.20.4

## 1.0.4

### Patch Changes

- Updated dependencies [[`2b6ea316`](https://github.com/graphql/graphiql/commit/2b6ea3166c8d8e152f16d87c878aa8a66f1b3775)]:
  - @graphiql/react@0.20.3

## 1.0.3

### Patch Changes

- [#3439](https://github.com/graphql/graphiql/pull/3439) [`d07d5fc0`](https://github.com/graphql/graphiql/commit/d07d5fc0cf764518bc1184ef168361cedf61540b) Thanks [@xonx4l](https://github.com/xonx4l)! - FIX: Unexpected duplicate CSS "display" property

## 1.0.2

### Patch Changes

- Updated dependencies [[`e89c432d`](https://github.com/graphql/graphiql/commit/e89c432d8d2b91f087b683360f23e0686462bc02)]:
  - @graphiql/react@0.20.2

## 1.0.1

### Patch Changes

- Updated dependencies [[`39bf31d1`](https://github.com/graphql/graphiql/commit/39bf31d15b1e7fb5f235ec9adc1ce8081536de4a)]:
  - @graphiql/react@0.20.1

## 1.0.0

### Patch Changes

- Updated dependencies [[`f6afd22d`](https://github.com/graphql/graphiql/commit/f6afd22d3f5a20089759042f16fd865646a32038)]:
  - @graphiql/react@0.20.0

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.19.4

## 0.3.4

### Patch Changes

- Updated dependencies [[`2348641c`](https://github.com/graphql/graphiql/commit/2348641c07748691c478ac5f67032b7e9081f9cb)]:
  - @graphiql/react@0.19.3

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
