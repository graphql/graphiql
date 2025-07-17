```shell
pnpm install
```

```shell
pnpm dev

> graphiql-issue-4038@1.0.0 dev /Users/AndKiel/graphiql-issue-4038
> react-router dev

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
8:33:24 AM [vite] (ssr) Error when evaluating SSR module virtual:react-router/server-build: Cannot find package '/Users/AndKiel/graphiql-issue-4038/node_modules/.pnpm/@graphiql+react@0.35.1_@emotion+is-prop-valid@1.3.1_@types+node@22.15.34_@types+react-d_ab41ef91f1590d5987c2e54135e53055/node_modules/monaco-editor/index.js' imported from /Users/AndKiel/graphiql-issue-4038/node_modules/.pnpm/@graphiql+react@0.35.1_@emotion+is-prop-valid@1.3.1_@types+node@22.15.34_@types+react-d_ab41ef91f1590d5987c2e54135e53055/node_modules/@graphiql/react/dist/constants.js
```

```shell
pnpm build
pnpm start

Error: Cannot find package '/Users/AndKiel/graphiql-issue-4038/node_modules/.pnpm/@graphiql+react@0.35.4_@emotion+is-prop-valid@1.3.1_@types+node@22.15.34_@types+react-d_eacbdec10b067bb210951a38e2120f2e/node_modules/monaco-editor/index.js' imported from /Users/AndKiel/graphiql-issue-4038/node_modules/.pnpm/@graphiql+react@0.35.4_@emotion+is-prop-valid@1.3.1_@types+node@22.15.34_@types+react-d_eacbdec10b067bb210951a38e2120f2e/node_modules/@graphiql/react/dist/constants.js
```