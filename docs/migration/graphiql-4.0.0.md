# Upgrading `graphiql` from `3.x` to `4.0.0`

---

## `graphiql`

- Dropped support for **React 16/17**, added support for **React 19**
- Dropped **CommonJS** build output – now **ESM only**
- Improved UI of tabs
  - Changed tabs behavior – tabs are always visible (even if only one)
  - Updated tabs tooltip usage – now use HTML `title` attribute
- Removed **default export**
- Removed `disableTabs` option
- Improved Markdown handling – single newlines are ignored
- Added `onPrettifyQuery` callback for custom formatting
- ⚠️ Deprecate **UMD CDN build `index.umd.js`**
- Changed **CDN paths** and **style import**

> [!WARNING]
>
> ⚠️ **`index.umd.js` is deprecated**. Switch to the [ESM CDN example](../../examples/graphiql-cdn/index.html).

### UMD CDN path changes

```diff
-https://unpkg.com/graphiql/graphiql.js
-https://unpkg.com/graphiql/graphiql.min.js
+https://unpkg.com/graphiql/dist/index.umd.js  // ⚠️ deprecated

-https://unpkg.com/graphiql/graphiql.css
-https://unpkg.com/graphiql/graphiql.min.css
+https://unpkg.com/graphiql/dist/style.css
```

### Default export removed

```diff
-import GraphiQL from 'graphiql'
+import { GraphiQL } from 'graphiql'
```

### Style import changed

```diff
-import 'graphiql/graphiql.css'
+import 'graphiql/style.css'
```

### Toolbar API migration

#### `toolbar.additionalContent` → `<GraphiQL.Toolbar>`

**Before:**

```tsx
<GraphiQL toolbar={{ additionalContent: <button>My button</button> }} />
```

**After:**

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

---

#### `toolbar.additionalComponent` → `<GraphiQL.Toolbar>`

**Before:**

```jsx
<GraphiQL
  toolbar={{
    additionalComponent: function MyComponentWithAccessToContext() {
      return <button>My button</button>;
    },
  }}
/>
```

**After:**

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

---

#### Customizing default toolbar buttons

You can reorder or remove default toolbar buttons:

```tsx
<GraphiQL>
  <GraphiQL.Toolbar>
    {({ prettify, copy }) => (
      <>
        {copy} {/* Move copy button to the top */}
        {prettify} {/* Omit merge button */}
      </>
    )}
  </GraphiQL.Toolbar>
</GraphiQL>
```

---

## `@graphiql/react`

- Dropped support for **React 16/17**, added support for **React 19**
- Dropped **CommonJS** build output
- Improved UI of tabs
- Updated dependencies: `@radix-ui` and `@headlessui/react`
- Added `onPrettifyQuery` callback for custom formatting
- Improved Markdown handling (ignores single newlines)
- Style import changed:
  ```diff
  -import '@graphiql/react/dist/style.css'
  +import '@graphiql/react/style.css'
  ```

---

## `@graphiql/plugin-code-exporter`

- Dropped support for **React 16/17**, added support for **React 19**
- Dropped **CommonJS** build output
- Updated ESM-based CDN example:
  [code-exporter ESM CDN example](../../packages/graphiql-plugin-code-exporter/example/index.html)
- ⚠️ UMD build deprecated – migrate to ESM-based CDN
- Style import changed:
  ```diff
  -import '@graphiql/plugin-code-exporter/dist/style.css'
  +import '@graphiql/plugin-code-exporter/style.css'
  ```

---

## `@graphiql/plugin-explorer`

- Dropped support for **React 16/17**, added support for **React 19**
- Dropped **CommonJS** build output
- Improved styles for the explorer UI
- Updated ESM-based CDN example:
  [explorer ESM CDN example](../../examples/graphiql-cdn/index.html)
- ⚠️ UMD build deprecated – migrate to ESM-based CDN
- Style import changed:
  ```diff
  -import '@graphiql/plugin-explorer/dist/style.css'
  +import '@graphiql/plugin-explorer/style.css'
  ```
