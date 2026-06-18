# `@graphiql/plugin-query-builder`

A first-party visual query builder plugin for GraphiQL. Build GraphQL queries by clicking through your schema instead of writing them by hand.

> **Alpha:** The plugin is in early development. Full capabilities — schema tree browsing, argument inputs, fragments, and unions/interfaces — are being added incrementally. See [#734](https://github.com/graphql/graphiql/issues/734) for the original feature request.

## Install

```bash
npm install @graphiql/plugin-query-builder
# or
yarn add @graphiql/plugin-query-builder
```

## Usage

```tsx
import { GraphiQL } from 'graphiql';
import { queryBuilderPlugin } from '@graphiql/plugin-query-builder';
import '@graphiql/plugin-query-builder/style.css';

const queryBuilder = queryBuilderPlugin();

function App() {
  return <GraphiQL plugins={[queryBuilder]} fetcher={fetcher} />;
}
```

## Known limitations

- **Aliases.** The tree addresses fields by their schema name, so a hand-written document that aliases the same field twice (`a: hero b: hero`) matches the first occurrence. Editing acts on that one; full alias-aware editing is not supported yet.
- **Explicit `null`.** The builder has no control for an explicit `null` argument, and treats an empty input as "remove this argument". A hand-written `arg: null` is therefore not preserved across an edit.

## License

MIT
