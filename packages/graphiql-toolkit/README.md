[Changelog](https://github.com/graphql/graphiql/blob/main/packages/graphql-toolkit/CHANGELOG.md) | [API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphiql_toolkit.html) | [NPM](https://www.npmjs.com/package/@graphiql/toolkit) | [Discord](https://discord.gg/NP5vbPeUFp)

# `@graphiql/toolkit`

General purpose library as a dependency of GraphiQL.

A core dependency of the GraphiQL 2.0.0 initiative.

## Docs

- **[`createFetcher`](./docs/create-fetcher.md)** : a utility for creating a `fetcher` prop implementation for HTTP GET, POST including multipart, websockets fetcher
- more to come!

## Todo

- [x] Begin porting common type definitions used by GraphiQL and it's dependencies
- [x] `createGraphiQLFetcher` utility for an easier `fetcher`
- [ ] Migrate over general purpose `graphiql/src/utilities`
- [ ] Utility to generate json schema spec from `getQueryFacts` for monaco, vscode, etc
