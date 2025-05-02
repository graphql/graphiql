# Upgrading `graphiql` from `3.x` to `4.0.0`

## `graphiql` changes

- New looks of tabs
- Drop CommonJS build output
- Drop support React 16/17
- Support React 19
- Changed UMD CDN paths, `dist/index.umd.js` and `dist/style.css` are minified
  ```diff
  -https://unpkg.com/graphiql/graphiql.js
  -https://unpkg.com/graphiql/graphiql.min.js
  +https://unpkg.com/graphiql/dist/index.umd.js
  -https://unpkg.com/graphiql/graphiql.css
  -https://unpkg.com/graphiql/graphiql.min.css
  +https://unpkg.com/graphiql/dist/style.css
  ```
- ⚠️ UMD CDN build `index.umd.js` is deprecated. Migrate to [ESM-based CDN](../../examples/graphiql-cdn/index.html)
- Add support for `onPrettifyQuery` callback to enable customized query formatting
- Show tabs even there is only one tab
- Remove default export
  ```diff
  -import GraphiQL from 'graphiql'
  +import { GraphiQL } from 'graphiql'
  ```
- Remove `disableTabs` option
- Respect a Markdown format - ignore single newline
- Replace `Tooltip`s in tabs with html `title="..."` attribute
- Style import was changed
  ```diff
  -graphiql/graphiql.css
  +graphiql/style.css
  ```
- Remove `toolbar.additionalContent` and `toolbar.additionalComponent` props in favor of `GraphiQL.Toolbar` render props

  ### Migration from `toolbar.additionalContent`

  #### Before

  ```jsx
  <GraphiQL toolbar={{ additionalContent: <button>My button</button> }} />
  ```

  #### After

  ```jsx
  <GraphiQL>
    <GraphiQL.Toolbar>
      {({ merge, prettify, copy }) => (
        <>
          {prettify}
          {merge}
          {copy}
          <button>My button</button>
        </>
      )}
    </GraphiQL.Toolbar>
  </GraphiQL>
  ```

  ### Migration from `toolbar.additionalComponent`

  #### Before

  ```jsx
  <GraphiQL
    toolbar={{
      additionalComponent: function MyComponentWithAccessToContext() {
        return <button>My button</button>;
      },
    }}
  />
  ```

  #### After

  ```jsx
  <GraphiQL>
    <GraphiQL.Toolbar>
      {({ merge, prettify, copy }) => (
        <>
          {prettify}
          {merge}
          {copy}
          <MyComponentWithAccessToContext />
        </>
      )}
    </GraphiQL.Toolbar>
  </GraphiQL>
  ```

  ***

  Additionally, you can sort default toolbar buttons in different order or remove unneeded buttons for you:

  ```jsx
  <GraphiQL>
    <GraphiQL.Toolbar>
      {({ prettify, copy }) => (
        <>
          {copy /* Copy button will be first instead of default last */}
          {/* Merge button is removed from toolbar */}
          {prettify}
        </>
      )}
    </GraphiQL.Toolbar>
  </GraphiQL>
  ```

## `@graphiql/react` changes

- New looks of tabs
- Drop CommonJS build output
- Drop support React 16/17
- Support React 19
- Update `@radix-ui` and `@headlessui/react` dependencies
- Add support for `onPrettifyQuery` callback to enable customized query formatting
- `style.css` import was changed
  ```diff
  -import '@graphiql/react/dist/style.css';
  +import '@graphiql/react/style.css';
  ```
- Respect a Markdown format - ignore single newline

## `@graphiql/plugin-code-exporter` changes

- Drop CommonJS build output
- Drop support React 16/17
- Support React 19
- ⚠️ UMD CDN build `index.umd.js` is deprecated. Migrate to [ESM-based CDN](../../packages/graphiql-plugin-code-exporter/example/index.html)
- [Updated CDN ESM-based example](../../packages/graphiql-plugin-code-exporter/example/index.html)
- `style.css` import was changed
  ```diff
  -import '@graphiql/plugin-code-exporter/dist/style.css';
  +import '@graphiql/plugin-code-exporter/style.css';
  ```

## `@graphiql/plugin-explorer` changes

- Drop CommonJS build output
- Drop support React 16/17
- Support React 19
- ⚠️ UMD CDN build `index.umd.js` is deprecated. Migrate to [ESM-based CDN](../../packages/graphiql-plugin-explorer/example/index.html)
- [Updated CDN ESM-based example](../../packages/graphiql-plugin-explorer/example/index.html)
- Improve explorer styles
- `style.css` import was changed
  ```diff
  -import '@graphiql/plugin-explorer/dist/style.css';
  +import '@graphiql/plugin-explorer/style.css';
  ```
