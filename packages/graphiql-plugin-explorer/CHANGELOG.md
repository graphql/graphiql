# @graphiql/plugin-explorer

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

## 1.0.4

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.20.4

## 1.0.3

### Patch Changes

- [#3526](https://github.com/graphql/graphiql/pull/3526) [`2b6ea316`](https://github.com/graphql/graphiql/commit/2b6ea3166c8d8e152f16d87c878aa8a66f1b3775) Thanks [@benjie](https://github.com/benjie)! - Fix bug whereby typing quickly into explorer sidebar would result in characters being dropped.

- Updated dependencies [[`2b6ea316`](https://github.com/graphql/graphiql/commit/2b6ea3166c8d8e152f16d87c878aa8a66f1b3775)]:
  - @graphiql/react@0.20.3

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

### Patch Changes

- [#3319](https://github.com/graphql/graphiql/pull/3319) [`2f51b1a5`](https://github.com/graphql/graphiql/commit/2f51b1a5f25ac515af89b708c009796c57a611fb) Thanks [@LekoArts](https://github.com/LekoArts)! - Use named `Explorer` import from `graphiql-explorer` to fix an issue where the bundler didn't correctly choose either the `default` or `Explorer` import. This change should ensure that `@graphiql/plugin-explorer` works correctly without `graphiql-explorer` being bundled.

## 0.1.22

### Patch Changes

- [#3292](https://github.com/graphql/graphiql/pull/3292) [`f86e4172`](https://github.com/graphql/graphiql/commit/f86e41721d4d990535253b579c810bc5e291b40b) Thanks [@B2o5T](https://github.com/B2o5T)! - fix umd build names `graphiql-plugin-code-exporter.umd.js` and `graphiql-plugin-explorer.umd.js`

## 0.1.21

### Patch Changes

- [#3229](https://github.com/graphql/graphiql/pull/3229) [`0a65e720`](https://github.com/graphql/graphiql/commit/0a65e7207b6bc4174896f6acca8a40f45d2fb1b8) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

- [#3251](https://github.com/graphql/graphiql/pull/3251) [`f8d8509b`](https://github.com/graphql/graphiql/commit/f8d8509b432803eaeb2e53b6b6d4321535e11c1d) Thanks [@B2o5T](https://github.com/B2o5T)! - always bundle `package.json#dependencies` for UMD build for `@graphiql/plugin-code-exporter` and `@graphiql/plugin-explorer`

- [#3236](https://github.com/graphql/graphiql/pull/3236) [`64da8c30`](https://github.com/graphql/graphiql/commit/64da8c3074628bb411eb1c28aa4738843f60910c) Thanks [@B2o5T](https://github.com/B2o5T)! - update vite

- [#3252](https://github.com/graphql/graphiql/pull/3252) [`c915a4ee`](https://github.com/graphql/graphiql/commit/c915a4eead4ae39cb5c9fa615b5b55945da06c01) Thanks [@B2o5T](https://github.com/B2o5T)! - `@graphiql/react` should be in `peerDependencies` not in `dependencies`

- Updated dependencies [[`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`bc9d243d`](https://github.com/graphql/graphiql/commit/bc9d243d40b95f95fc9d00d25aa0dd1733952626), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`67bf93a3`](https://github.com/graphql/graphiql/commit/67bf93a33e98c60ae3a686063a1c47037f88ef49)]:
  - @graphiql/react@0.18.0

## 0.1.21-alpha.1

### Patch Changes

- [#3229](https://github.com/graphql/graphiql/pull/3229) [`0a65e720`](https://github.com/graphql/graphiql/commit/0a65e7207b6bc4174896f6acca8a40f45d2fb1b8) Thanks [@B2o5T](https://github.com/B2o5T)! - exclude peer dependencies and dependencies from bundle

- Updated dependencies [[`bc9d243d`](https://github.com/graphql/graphiql/commit/bc9d243d40b95f95fc9d00d25aa0dd1733952626), [`67bf93a3`](https://github.com/graphql/graphiql/commit/67bf93a33e98c60ae3a686063a1c47037f88ef49)]:
  - @graphiql/react@0.18.0-alpha.1

## 0.1.21-alpha.0

### Patch Changes

- Updated dependencies [[`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696), [`9ac84bfc`](https://github.com/graphql/graphiql/commit/9ac84bfc7b847105565852a01bdca122319e3696)]:
  - @graphiql/react@0.18.0-alpha.0

## 0.1.20

### Patch Changes

- [#3124](https://github.com/graphql/graphiql/pull/3124) [`c645932c`](https://github.com/graphql/graphiql/commit/c645932c7973e11ad917e1d1d897fd409f8c042f) Thanks [@B2o5T](https://github.com/B2o5T)! - avoid unecessary renders by using useMemo or useCallback

- Updated dependencies [[`911cf3e0`](https://github.com/graphql/graphiql/commit/911cf3e0b0fa13268245463c8db8299279e5c461), [`c645932c`](https://github.com/graphql/graphiql/commit/c645932c7973e11ad917e1d1d897fd409f8c042f), [`2ca4841b`](https://github.com/graphql/graphiql/commit/2ca4841baf74e87a3f067b3415f8da3347ee3898), [`7bf90929`](https://github.com/graphql/graphiql/commit/7bf90929f62ba812c0946e0424f9f843f7b6b0ff), [`431b7fe1`](https://github.com/graphql/graphiql/commit/431b7fe1efefa4867f0ea617adc436b1117052e8)]:
  - @graphiql/react@0.17.6

## 0.1.19

### Patch Changes

- Updated dependencies [[`2b212941`](https://github.com/graphql/graphiql/commit/2b212941628498957d95ee89a7a5a0623f391b7a), [`9b333a04`](https://github.com/graphql/graphiql/commit/9b333a047d6b75db7681f484156d8772e9f91810)]:
  - @graphiql/react@0.17.5

## 0.1.18

### Patch Changes

- Updated dependencies [[`707f3cbc`](https://github.com/graphql/graphiql/commit/707f3cbca3ac2ce186058e7d2b145cdf69bf7d9c)]:
  - @graphiql/react@0.17.4

## 0.1.17

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.17.3

## 0.1.16

### Patch Changes

- Updated dependencies [[`2e477eb2`](https://github.com/graphql/graphiql/commit/2e477eb24672a242ae4a4f2dfaeaf41152ed7ee9), [`4879984e`](https://github.com/graphql/graphiql/commit/4879984ea1803a6e9f97d81c97e8ba27aacddae9), [`51007002`](https://github.com/graphql/graphiql/commit/510070028b7d8e98f2ba25f396519976aea5fa4b)]:
  - @graphiql/react@0.17.2

## 0.1.15

### Patch Changes

- [#3017](https://github.com/graphql/graphiql/pull/3017) [`4a2284f5`](https://github.com/graphql/graphiql/commit/4a2284f54809f91d03ba51b9eb4e3ba7b8b7e773) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Avoid bundling code from `react/jsx-runtime` so that the package can be used with Preact

- [#3063](https://github.com/graphql/graphiql/pull/3063) [`5792aaa5`](https://github.com/graphql/graphiql/commit/5792aaa5b26b68dc396f7bfb5dc3defd9331b831) Thanks [@B2o5T](https://github.com/B2o5T)! - avoid `useMemo` with empty array `[]` since React can't guarantee stable reference, + lint restrict syntax for future mistakes

- Updated dependencies [[`2d5c60ec`](https://github.com/graphql/graphiql/commit/2d5c60ecf717abafde2bddd32b2772261d3eec8b), [`b9c13328`](https://github.com/graphql/graphiql/commit/b9c13328f3d28c0026ee0f0ecc7213065c9b016d), [`4a2284f5`](https://github.com/graphql/graphiql/commit/4a2284f54809f91d03ba51b9eb4e3ba7b8b7e773), [`881a2024`](https://github.com/graphql/graphiql/commit/881a202497d5a58eb5260a5aa54c0c88930d69a0), [`7cf4908a`](https://github.com/graphql/graphiql/commit/7cf4908a5d4bd58af315047f4dec5236e8c701fc)]:
  - @graphiql/react@0.17.1

## 0.1.14

### Patch Changes

- Updated dependencies [[`bdc966cb`](https://github.com/graphql/graphiql/commit/bdc966cba6134a72ff7fe40f76543c77ba15d4a4), [`65f5176a`](https://github.com/graphql/graphiql/commit/65f5176a408cfbbc514ca60e2e4bd2ea133a8b0b)]:
  - @graphiql/react@0.17.0

## 0.1.13

### Patch Changes

- Updated dependencies [[`f7addb20`](https://github.com/graphql/graphiql/commit/f7addb20c4a558fbfb4112c8ff095bbc8f9d9147), [`cec3fb2a`](https://github.com/graphql/graphiql/commit/cec3fb2a493c4a0c40df7dfad04e1a95ed35e786), [`11e6ad11`](https://github.com/graphql/graphiql/commit/11e6ad11e745c671eb320731697887bb8d7177b7), [`c70d9165`](https://github.com/graphql/graphiql/commit/c70d9165cc1ef8eb1cd0d6b506ced98c626597f9), [`d502a33b`](https://github.com/graphql/graphiql/commit/d502a33b4332f1025e947c02d7cfdc5799365c8d), [`0669767e`](https://github.com/graphql/graphiql/commit/0669767e1e2196a78cbefe3679a52bcbb341e913), [`f263f778`](https://github.com/graphql/graphiql/commit/f263f778cb95b9f413bd09ca56a43f5b9c2f6215), [`ccba2f33`](https://github.com/graphql/graphiql/commit/ccba2f33b67a03f492222f7afde1354cfd033b42), [`4ff2794c`](https://github.com/graphql/graphiql/commit/4ff2794c8b6032168e27252096cb276ce712878e)]:
  - @graphiql/react@0.16.0

## 0.1.12

### Patch Changes

- Updated dependencies [[`16174a05`](https://github.com/graphql/graphiql/commit/16174a053ed89fb9554d096395ab7bf69c8f6911), [`f6cae4ea`](https://github.com/graphql/graphiql/commit/f6cae4eaa0258ea7fcde97ba6368830955f0abf4), [`3340fd74`](https://github.com/graphql/graphiql/commit/3340fd745e181ba8f1f5a6ed002a04d253a78d4a), [`0851d5f9`](https://github.com/graphql/graphiql/commit/0851d5f9ecf709597d0a698609d88f99c4395665), [`83364b28`](https://github.com/graphql/graphiql/commit/83364b28020b5946ed58908d6d977f1de766e75d), [`3a7d0007`](https://github.com/graphql/graphiql/commit/3a7d00071922e2005777c92daf6ad0c1ce3e2816)]:
  - @graphiql/react@0.15.0

## 0.1.11

### Patch Changes

- Updated dependencies [[`29630c22`](https://github.com/graphql/graphiql/commit/29630c2219bca8b825ab0897840864364a9de2e8), [`8f926489`](https://github.com/graphql/graphiql/commit/8f9264896e9971951853463a283a90ba3d1310ef), [`2ba2f620`](https://github.com/graphql/graphiql/commit/2ba2f620b6e7de3ae6b5ea641f33e600f7f44e08)]:
  - @graphiql/react@0.14.0

## 0.1.10

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.13.7

## 0.1.9

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.13.6

## 0.1.8

### Patch Changes

- Updated dependencies [[`682ad06e`](https://github.com/graphql/graphiql/commit/682ad06e58ded2f82fa973e8e6613dd654417fe2)]:
  - @graphiql/react@0.13.5

## 0.1.7

### Patch Changes

- Updated dependencies [[`4e2f7ff9`](https://github.com/graphql/graphiql/commit/4e2f7ff99c578ceae54a1ae17c02088bd91b89c3)]:
  - @graphiql/react@0.13.4

## 0.1.6

### Patch Changes

- Updated dependencies [[`42700076`](https://github.com/graphql/graphiql/commit/4270007671ce52f6c2250739916083611748b657), [`36839800`](https://github.com/graphql/graphiql/commit/36839800de128b05d11c262036c8240390c72a14), [`905f2e5e`](https://github.com/graphql/graphiql/commit/905f2e5ea3f0b304d27ea583e250ed4baff5016e)]:
  - @graphiql/react@0.13.3

## 0.1.5

### Patch Changes

- Updated dependencies [[`39b4668d`](https://github.com/graphql/graphiql/commit/39b4668d43176526d37ecf07d8c86901d53e0d80)]:
  - @graphiql/react@0.13.2

## 0.1.4

### Patch Changes

- Updated dependencies []:
  - @graphiql/react@0.13.1

## 0.1.3

### Patch Changes

- [#2735](https://github.com/graphql/graphiql/pull/2735) [`ca067d88`](https://github.com/graphql/graphiql/commit/ca067d88148c5d221d196790a997ad599038fad1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Use the new CSS variables for color alpha values defined in `@graphiql/react` in style definitions

* [#2757](https://github.com/graphql/graphiql/pull/2757) [`32a70065`](https://github.com/graphql/graphiql/commit/32a70065434eaa7733e28cda0ea0e7d51952e62a) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Use different colors for field names and argument names

* Updated dependencies [[`ca067d88`](https://github.com/graphql/graphiql/commit/ca067d88148c5d221d196790a997ad599038fad1), [`32a70065`](https://github.com/graphql/graphiql/commit/32a70065434eaa7733e28cda0ea0e7d51952e62a)]:
  - @graphiql/react@0.13.0

## 0.1.2

### Patch Changes

- [#2750](https://github.com/graphql/graphiql/pull/2750) [`cdc44aab`](https://github.com/graphql/graphiql/commit/cdc44aabdc549f5a0359b8f69506cc0c31661d16) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Remove `type` field from `package.json` to support both ES Modules and CommonJS

- Updated dependencies []:
  - @graphiql/react@0.12.1

## 0.1.1

### Patch Changes

- [#2745](https://github.com/graphql/graphiql/pull/2745) [`92a17490`](https://github.com/graphql/graphiql/commit/92a17490c3842b4f83ed1065b73a803f73d02a17) Thanks [@acao](https://github.com/acao)! - Specify MIT license for `@graphiql/plugin-explorer` `package.json`

* [#2731](https://github.com/graphql/graphiql/pull/2731) [`3e8f0d1f`](https://github.com/graphql/graphiql/commit/3e8f0d1fe4da5cdea94240119bbad587720ca324) Thanks [@hasparus](https://github.com/hasparus)! - Expose typings for graphiql-explorer

- [#2738](https://github.com/graphql/graphiql/pull/2738) [`33bef178`](https://github.com/graphql/graphiql/commit/33bef17832edb29f5b26f4ed1cf33fd0d7fbbed1) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Fix peer dependency versions

* [#2747](https://github.com/graphql/graphiql/pull/2747) [`52d0003f`](https://github.com/graphql/graphiql/commit/52d0003fd0c405da65b7b23dcfed9f3aacbad067) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Make `@graphiql/react` a real dependency instead of a peer dependency

* Updated dependencies [[`98e14155`](https://github.com/graphql/graphiql/commit/98e14155c650ee7c5ac639e594eb47f0052b7fa9), [`7dfea94a`](https://github.com/graphql/graphiql/commit/7dfea94afc0cfe79b5080f10d840bfdce53f02d7), [`3aa1f39f`](https://github.com/graphql/graphiql/commit/3aa1f39f6df559b54f703937ed510c8ba1f21058), [`0219eef3`](https://github.com/graphql/graphiql/commit/0219eef39146495749aca2487112db52fa3bb8fd)]:
  - @graphiql/react@0.12.0

## 0.1.0

### Minor Changes

- [#2724](https://github.com/graphql/graphiql/pull/2724) [`dd5db3b2`](https://github.com/graphql/graphiql/commit/dd5db3b2ee08b240ba7b77a9b7ff621115bd25f3) Thanks [@thomasheyenbrock](https://github.com/thomasheyenbrock)! - Add a package that exports a plugin to use the GraphiQL Explorer from OneGraph
