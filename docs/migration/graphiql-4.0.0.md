# Upgrading `graphiql` from `3.x` to `4.0.0`

## `graphiql` changes

- new looks of tabs
- Drop CommonJS build output
- Drop support React 16/17
- Support React 19
- ⚠️ UMD CDN build `index.umd.js` is deprecated. Migrate to ESM-based CDN
- Add support for `onPrettifyQuery` callback to enable customized query formatting
- show tabs even there is only one tab
- remove default export
  ```diff
  -import GraphiQL from 'graphiql'
  +import { GraphiQL } from 'graphiql'
  ```
- remove `disableTabs` option
- respect a Markdown format - ignore single newline
- replace `Tooltip`s in tabs with html `title="..."` attribute

## `@graphiql/react` changes

- new looks of tabs
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
- respect a Markdown format - ignore single newline

## `@graphiql/plugin-code-exporter` changes

- Drop CommonJS build output
- Drop support React 16/17
- Support React 19
- ⚠️ UMD CDN build `index.umd.js` is deprecated. Migrate to ESM-based CDN
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
- ⚠️ UMD CDN build `index.umd.js` is deprecated. Migrate to ESM-based CDN
- [Updated CDN ESM-based example](../../packages/graphiql-plugin-explorer/example/index.html)
- improve explorer styles
- `style.css` import was changed
  ```diff
  -import '@graphiql/plugin-explorer/dist/style.css';
  +import '@graphiql/plugin-explorer/style.css';
  ```
