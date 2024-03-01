# vscode-graphql-syntax

## 1.3.3

### Patch Changes

- [#3518](https://github.com/graphql/graphiql/pull/3518) [`e502c41e`](https://github.com/graphql/graphiql/commit/e502c41e68440e7331cfc74d8c78fd092f3354a8) Thanks [@kitten](https://github.com/kitten)! - Fix TextMate grammar to support string literals that don’t immediately follow a function call's left-parenthesis (`(`).

## 1.3.2

### Patch Changes

- [#3529](https://github.com/graphql/graphiql/pull/3529) [`a38152ef`](https://github.com/graphql/graphiql/commit/a38152ef1248a480d5cad384780f82214a84f16d) Thanks [@acao](https://github.com/acao)! - fix triple double quote comment syntax by disabling inline double quote js strings for now

## 1.3.1

### Patch Changes

- [#3519](https://github.com/graphql/graphiql/pull/3519) [`8188e3e6`](https://github.com/graphql/graphiql/commit/8188e3e6fd979bcf2fbdf9568deb0c88d0df99e2) Thanks [@acao](https://github.com/acao)! - bump ovsx

## 1.3.0

### Minor Changes

- [#3475](https://github.com/graphql/graphiql/pull/3475) [`98af5307`](https://github.com/graphql/graphiql/commit/98af53071bb27afc0afc82d66f539c1ac08315b3) Thanks [@XiNiHa](https://github.com/XiNiHa)! - Add Astro file support

## 1.2.3

### Patch Changes

- [#3490](https://github.com/graphql/graphiql/pull/3490) [`334224b4`](https://github.com/graphql/graphiql/commit/334224b4502fda9fd77684da63cac00b8a7c1ee7) Thanks [@acao](https://github.com/acao)! - - add ruby syntax support

  - add graphql syntax support in markdown codeblocks for js, ts, jsx, tsx, svelte, vue, ruby, rescript, reason, ocaml, php and python
  - make textmate injectors more performant and specific, eliminate redundant config

  Big thanks to [@RedCMD](https://github.com/RedCMD) and [@aeschli](https://github.com/aeschli) for your help!

## 1.2.2

### Patch Changes

- [#3269](https://github.com/graphql/graphiql/pull/3269) [`2fb7f1f5`](https://github.com/graphql/graphiql/commit/2fb7f1f5d8a69a5de572b783de7801d5993f758a) Thanks [@acao](https://github.com/acao)! - fix ovsx release

## 1.2.1

### Patch Changes

- [#3224](https://github.com/graphql/graphiql/pull/3224) [`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9) Thanks [@acao](https://github.com/acao)! - try removing some packages from pre.json

## 1.2.1-alpha.0

### Patch Changes

- [#3224](https://github.com/graphql/graphiql/pull/3224) [`5971d528`](https://github.com/graphql/graphiql/commit/5971d528b0608e76d9d109103f64857a790a99b9) Thanks [@acao](https://github.com/acao)! - try removing some packages from pre.json

## 1.2.0

### Minor Changes

- [#3106](https://github.com/graphql/graphiql/pull/3106) [`40690901`](https://github.com/graphql/graphiql/commit/40690901603a678ad6aa8e38f63b14e6b53d315c) Thanks [@hugo-vrijswijk](https://github.com/hugo-vrijswijk)! - Add syntax highlighting in Scala

### Patch Changes

- [#3133](https://github.com/graphql/graphiql/pull/3133) [`a8f21ad3`](https://github.com/graphql/graphiql/commit/a8f21ad3cf1c2ead95fa2c95372d01bafff8fee9) Thanks [@acao](https://github.com/acao)! - ci: test formatting fix with a changeset

## 1.1.0

### Minor Changes

- [#3019](https://github.com/graphql/graphiql/pull/3019) [`ae43add6`](https://github.com/graphql/graphiql/commit/ae43add68c39825580fc8fc63a0b4c55f9fb70ad) Thanks [@mjmahone](https://github.com/mjmahone)! - Adds syntax highlighting for arguments on fragment spreads as well as variable definitions on fragments.

## 1.0.6

### Patch Changes

- [#2926](https://github.com/graphql/graphiql/pull/2926) [`10e97bbe`](https://github.com/graphql/graphiql/commit/10e97bbe6c9ff81bae73b11ba81ac2b69eca2772) Thanks [@elijaholmos](https://github.com/elijaholmos)! - support cts and mts file extensions

## 1.0.5

### Patch Changes

- [#2849](https://github.com/graphql/graphiql/pull/2849) [`9b98c1b6`](https://github.com/graphql/graphiql/commit/9b98c1b63a184385d22a8457cfdfebf01387697f) Thanks [@acao](https://github.com/acao)! - docs typo bug - `/* GraphQL */` (not `/* GraphiQL */`) is the delimiter for `vscode-graphql-syntax` & `vscode-graphql` language support

## 1.0.4

### Patch Changes

- [#2573](https://github.com/graphql/graphiql/pull/2573) [`a358ac1d`](https://github.com/graphql/graphiql/commit/a358ac1d00082643e124085bca09992adeef212a) Thanks [@acao](https://github.com/acao)! - ## Enhancement

  Here we move vscode grammars and basic language support to a new [`GraphQL.vscode-graphql-syntax`](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql-syntax) extension. `GraphQL.vscode-graphql` now depends on this new syntax extension. This constitutes no breaking change for `vscode-graphql` users, as this extension will be installed automatically as an `extensionDependency` for `vscode-graphql`. Both extensions will now have independent release lifecycles, but vscode will keep them both up to date for you :)

  Firstly, this allows users to only install the syntax highlighting extension if they don't need LSP server features.

  Secondly, this subtle but important change allows alternative LSP servers and non-LSP graphql extensions to use (and contribute!) to our shared, graphql community syntax highlighting. In some ways, it acts as a shared tooling & annotation spec, though it is intended just for vscode, it perhaps can be used as a point of reference for others implementing (embedded) graphql syntax highlighting elsewhere!

  If your language and/or library and/or framework would like vscode highlighting, come [join the party](https://github.com/graphql/graphiql/tree/main/packages/vscode-graphql-syntax#contributing)!

  If you use relay, we would highly reccomend using the `relay-compiler lsp` extension for vscode [Relay Graphql](https://marketplace.visualstudio.com/items?itemName=meta.relay) (`meta.relay`). They will be [using the new standalone syntax extension](https://github.com/facebook/relay/pull/4032) very soon!

  Even non-relay users may want to try this extension as an alternative to our reference implementation, as relay's configuration has relative similarity with `graphql-config`'s format, and doesn't necessitate the use of relay client afaik. We are working hard to optimize and improve `graphql-language-service-server` as a typescript reference implementation, and have some exciting features coming soon, however it's hard to offer more than a brand new & highly performant graphql LSP server written in Rust based on the latest graphql spec with a (mostly) paid team and dedicated open source ecosystem community of co-maintainers! And their implementation appears to allow you to opt out of any relay-specific conventions if you need more flexibility.
