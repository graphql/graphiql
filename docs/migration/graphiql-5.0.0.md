# Upgrading `graphiql` from `4.x` to `5.0.0-rc`

---

## `graphiql`

- Migration from Codemirror to
  [Monaco Editor](https://github.com/microsoft/monaco-editor)
  - Replacing `codemirror-graphql` with
    [`monaco-graphql`](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql)
  - Clicking on a reference in the query editor now works by holding `Cmd` on macOS or `Ctrl` on Windows/Linux
- Support for comments in **Variables** and **Headers** editors
- Added new examples: [**GraphiQL x Vite**](https://github.com/graphql/graphiql/tree/graphiql-5/examples/graphiql-vite) and [**GraphiQL x
  Next.js**](https://github.com/graphql/graphiql/tree/graphiql-5/examples/graphiql-nextjs)
- Removed examples: **GraphiQL x Parcel** and **GraphiQL x Create React App**
- UMD build is removed. Use the ESM-based CDN instead.
- Removed props
  - `keyMap`. To use Vim or Emacs keybindings in Monaco, you can use community plugins. Monaco Vim: https://github.com/brijeshb42/monaco-vim. Monaco Emacs: https://github.com/aioutecism/monaco-emacs
  - `readOnly`
  - `validationRules`. Use custom GraphQL worker, see https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#custom-webworker-for-passing-non-static-config-to-worker.'

## `@graphiql/react`

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
