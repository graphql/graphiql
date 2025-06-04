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
