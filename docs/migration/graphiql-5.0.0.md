# Upgrading `graphiql` from `4.x` to `5.0.0`

You need to set up Monaco workers in your project:

- For **Vite** projects you must import:

  ```js
  import "graphiql/setup-workers/vite"
  ```
  
  > [!NOTE]
  >
  > See [Vite example](../../examples/graphiql-vite/src/App.jsx).

- For Webpack projects such as **Next.js** you must import:

  ```js
  import "graphiql/setup-workers/webpack"
  ```

  > [!NOTE]
  >
  > See [Next.js example](../../examples/graphiql-nextjs/src/app/page.tsx).

- For ESM-based CDN usages, you must use
  [`?worker` query](https://esm.sh/#web-worker) to load the module as a web
  worker:

  ```js /?worker/
  import createJSONWorker from "https://esm.sh/monaco-editor/esm/vs/language/json/json.worker.js?worker"
  import createGraphQLWorker from "https://esm.sh/monaco-graphql/esm/graphql.worker.js?worker"
  import createEditorWorker from "https://esm.sh/monaco-editor/esm/vs/editor/editor.worker.js?worker"

  globalThis.MonacoEnvironment = {
    getWorker(_workerId, label) {
      switch (label) {
        case "json":
          return createJSONWorker()
        case "graphql":
          return createGraphQLWorker()
      }
      return createEditorWorker()
    }
  }
  ```

  > [!NOTE]
  >
  > See [CDN example](../../examples/graphiql-cdn/index.html).

---

## `graphiql`

> [!WARNING]
>
> ⚠️ UMD build is removed. Switch to the [ESM CDN example](../../examples/graphiql-cdn/index.html).

- Migration from Codemirror to [Monaco Editor](https://github.com/microsoft/monaco-editor)
  - Replacing `codemirror-graphql` with [`monaco-graphql`](../../packages/monaco-graphql)
  - Clicking on a reference in the query editor now works by holding `Cmd` on macOS or `Ctrl` on Windows/Linux
- Support for comments in **Variables** and **Headers** editors
- Added new examples: [**GraphiQL x Vite**](../../examples/graphiql-vite) and [**GraphiQL x Next.js**](../../examples/graphiql-nextjs)
- Removed examples: **GraphiQL x Parcel** and **GraphiQL x Create React App**
- Removed props
  - `keyMap`. To use Vim or Emacs keybindings in Monaco, you can use community plugins. Monaco Vim: https://github.com/brijeshb42/monaco-vim. Monaco Emacs: https://github.com/aioutecism/monaco-emacs
  - `readOnly`
  - `validationRules`. Use custom GraphQL worker, see https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#custom-webworker-for-passing-non-static-config-to-worker.'
  - `query`
  - `variables`
  - `headers`
  - `response`
  > [!NOTE]
  >
  > If you used `query`, `variables` and `headers` in testing, you can use the new `initialQuery`, `initialVariables`
  > and `initialHeaders` props instead. These props will only be used for the first tab.
  > When opening more tabs, the query editor will start out empty.
- Added new props
  - `initialQuery`
  - `initialVariables`
  - `initialHeaders`
- feat: allow `children: ReactNode` for `<GraphiQL.Toolbar />` component
- Clicking on a reference in the Query editor now works by holding `Cmd` on macOS or `Ctrl` on Windows/Linux.

---

## `@graphiql/react`

- `usePrettifyEditors`, `useCopyQuery`, `useMergeQuery`, `useExecutionContext`, `usePluginContext`, `useSchemaContext`, `useStorageContext` hooks are deprecated.
  Use new `useGraphiQL` and `useGraphiQLActions` hooks instead. See updated [README](../../packages/graphiql-react/README.md#available-stores) for more details about them.
- fix `defaultQuery` with empty string does not result in an empty default query
- fix execute query shortcut in query editor, run it even there are no operations in query editor
- fix plugin store, save last opened plugin in storage
- fix `defaultQuery`, when is set will only be used for the first tab. When opening more tabs, the query editor will start out empty
- remove `useSynchronizeValue` hook

The `ToolbarMenu` component has changed.

- The `label` and `className` props were removed
- The `button` prop should now be a button element

  ```jsx
  <ToolbarMenu
    label="Options"
    button={
      <ToolbarButton label="Options">
        <SettingsIcon className="graphiql-toolbar-icon" aria-hidden="true" />
      </ToolbarButton>
    }
  >
    <ToolbarMenu.Item onSelect={() => console.log('Clicked!')}>
      Test
    </ToolbarMenu.Item>
  </ToolbarMenu>
  ```

## `@graphiql/plugin-code-exporter`

> [!WARNING]
>
> ⚠️ UMD build is removed. Switch to the [ESM CDN example](../../packages/graphiql-plugin-code-exporter/example/index.html).

---

## `@graphiql/plugin-explorer`

> [!WARNING]
>
> ⚠️ UMD build is removed. Switch to the [ESM CDN example](../../examples/graphiql-cdn/index.html).

---

## @graphiql/plugin-doc-explorer

- `useExplorerContext` hook is deprecated. Use new `useDocExplorer` and `useDocExplorerActions` hooks instead.
- The shortcut to focus on the Doc Explorer search input is now `Cmd/Ctrl+Alt+K`
  instead of the previous `Cmd/Ctrl+K`. This was changed because monaco-editor has
  a built-in `Cmd/Ctrl+K` command.
---

## @graphiql/plugin-history

- `useHistoryContext` hook is deprecated. Use new `useHistory` and `useHistoryActions` hooks instead.
