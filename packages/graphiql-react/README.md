[Changelog](https://github.com/graphql/graphiql/blob/main/packages/graphiql-react/CHANGELOG.md)
|
[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphiql_react.html)
| [NPM](https://www.npmjs.com/package/@graphiql/react)

# `@graphiql/react`

A React SDK for building integrated GraphQL developer experiences for the web.

## Purpose

This package contains a set of building blocks that allow its users to build
GraphQL IDEs with ease. It's the set of components that make up Graph*i*QL, the
first and official GraphQL IDE, owned and maintained by the GraphQL Foundation.

There are two kinds of building blocks that this package provides: Stateful
context providers for state management and simple UI components.

## Getting started

All the state for your GraphQL IDE lives in multiple contexts. The easiest way
to get started is by using the `GraphiQLProvider` component that renders all the
individual providers.

There is one required prop called `fetcher`. This is a function that performs
GraphQL request against a given endpoint. You can easily create a fetcher using
the method `createGraphiQLFetcher` from the `@graphiql/toolkit` package.

```jsx
import { GraphiQLProvider } from '@graphiql/react';
import { createGraphiQLFetcher } from '@graphiql/toolkit';

const fetcher = createGraphiQLFetcher({
  url: 'https://my.graphql.api/graphql',
});

function MyGraphQLIDE() {
  return (
    <GraphiQLProvider fetcher={fetcher}>
      <div className="graphiql-container">Hello GraphQL</div>
    </GraphiQLProvider>
  );
}
```

Inside the provider you can now use any UI component provided by
`@graphiql/react`. For example, you can render a query editor like this:

```jsx
import { QueryEditor } from '@graphiql/react';

function MyGraphQLIDE() {
  return (
    <GraphiQLProvider fetcher={fetcher}>
      <div className="graphiql-container">
        <QueryEditor />
      </div>
    </GraphiQLProvider>
  );
}
```

The package also ships the necessary CSS that all its UI components need. You
can import them from `@graphiql/react/dist/style.css`.

> **Note**: In order for these styles to apply, the UI components need to be
> rendered inside an element that has a class name `graphiql-container`.

By default, the UI components will try to use the
[Roboto](https://fonts.google.com/specimen/Roboto) font for regular text and the
[Fira Code](https://fonts.google.com/specimen/Fira+Code) font for mono-space
text. If you want to use the default fonts you can load them using these files:

- `@graphiql/react/font/roboto.css`
- `@graphiql/react/font/fira-code.css`.

You can of course use any other method to load these fonts (for example loading
them from Google Fonts).

Further details on how to use `@graphiql/react` can be found in the reference
implementation of a GraphQL IDE - Graph*i*QL - in the
[`graphiql` package](https://github.com/graphql/graphiql/blob/main/packages/graphiql/src/components/GraphiQL.tsx).

## Available contexts

There are multiple contexts that own different parts of the state that make up a
complete GraphQL IDE. For each context there is a provider component
(`<name>ContextProvider`) that makes sure the context is initialized and managed
properly. These components contains all the logic related to state management.
In addition, for each context there is also a hook (`use<name>Context`) that
allows you to consume its current value.

Here is a list of all contexts that come with `@graphiql/react`

- `StorageContext`: Provides a storage API that can be used to persist state in
  the browser (by default using `localStorage`)
- `EditorContext`: Manages all the editors and tabs
- `SchemaContext`: Fetches, validates and stores the GraphQL schema
- `ExecutionContext`: Executes GraphQL requests
- `HistoryContext`: Persists executed requests in storage
- `ExplorerContext`: Handles the state for the docs explorer

All context properties are documented using JSDoc comments. If you're using an
IDE like VSCode for development these descriptions will show up in auto-complete
tooltips. All these descriptions can also be found in the
[API Docs](https://graphiql-test.netlify.app/typedoc/modules/graphiql_react.html).

## Theming

All the components from `@graphiql/react` have been designed with customization
in mind. We achieve this using CSS variables.

All variables that are available for customization can be found in the
[`root.css` file](https://github.com/graphql/graphiql/blob/main/packages/graphiql-react/src/style/root.css).

### Colors

Colors are defined using the
[HSL format](https://en.wikipedia.org/wiki/HSL_and_HSV). All CSS variables for
colors are defined as a list of the three values that make up HSL (hue,
saturation and lightness).

This approach allows `@graphiql/react` to use transparent colors by passing the
value of the CSS variable in the `hsla` function. This enables us to provide
truly reusable UI elements where good contrasts are preserved regardless of the
elements background.

## Development

If you want to develop with `@graphiql/react` locally - in particular when
working on the `graphiql` package - all you need to do is run `yarn dev` in the
package folder in a separate terminal. This will build the package using Vite.
When using it in combination with `yarn start-graphiql` (running in the repo
root) this will give you auto-reloading when working on `graphiql` and
`@graphiql/react` simultaneously.
