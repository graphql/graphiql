# vscode-graphql-syntax

## 1.0.5

### Patch Changes

- [#2849](https://github.com/graphql/graphiql/pull/2849)
  [`9b98c1b6`](https://github.com/graphql/graphiql/commit/9b98c1b63a184385d22a8457cfdfebf01387697f)
  Thanks [@acao](https://github.com/acao)! - docs typo bug - `/* GraphQL */`
  (not `/* GraphiQL */`) is the delimiter for `vscode-graphql-syntax` &
  `vscode-graphql` language support

## 1.0.4

### Patch Changes

- [#2573](https://github.com/graphql/graphiql/pull/2573)
  [`a358ac1d`](https://github.com/graphql/graphiql/commit/a358ac1d00082643e124085bca09992adeef212a)
  Thanks [@acao](https://github.com/acao)! - ## Enhancement

  Here we move vscode grammars and basic language support to a new
  [`GraphQL.vscode-graphql-syntax`](https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql-syntax)
  extension. `GraphQL.vscode-graphql` now depends on this new syntax extension.
  This constitutes no breaking change for `vscode-graphql` users, as this
  extension will be installed automatically as an `extensionDependency` for
  `vscode-graphql`. Both extensions will now have independent release
  lifecycles, but vscode will keep them both up to date for you :)

  Firstly, this allows users to only install the syntax highlighting extension
  if they don't need LSP server features.

  Secondly, this subtle but important change allows alternative LSP servers and
  non-LSP graphql extensions to use (and contribute!) to our shared, graphql
  community syntax highlighting. In some ways, it acts as a shared tooling &
  annotation spec, though it is intended just for vscode, it perhaps can be used
  as a point of reference for others implementing (embedded) graphql syntax
  highlighting elsewhere!

  If your language and/or library and/or framework would like vscode
  highlighting, come
  [join the party](https://github.com/graphql/graphiql/tree/main/packages/vscode-graphql-syntax#contributing)!

  If you use relay, we would highly reccomend using the `relay-compiler lsp`
  extension for vscode
  [Relay Graphql](https://marketplace.visualstudio.com/items?itemName=meta.relay)
  (`meta.relay`). They will be
  [using the new standalone syntax extension](https://github.com/facebook/relay/pull/4032)
  very soon!

  Even non-relay users may want to try this extension as an alternative to our
  reference implementation, as relay's configuration has relative similarity
  with `graphql-config`'s format, and doesn't necessitate the use of relay
  client afaik. We are working hard to optimize and improve
  `graphql-language-service-server` as a typescript reference implementation,
  and have some exciting features coming soon, however it's hard to offer more
  than a brand new & highly performant graphql LSP server written in Rust based
  on the latest graphql spec with a (mostly) paid team and dedicated open source
  ecosystem community of co-maintainers! And their implementation appears to
  allow you to opt out of any relay-specific conventions if you need more
  flexibility.
