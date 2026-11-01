## CodeMirror 6 Parcel Example

This example combines the current CodeMirror 6 GraphQL extension with Parcel 2.
Parcel compiles TypeScript; the separate type check uses TypeScript 7.

### Setup

Use Node.js 24 and pnpm. This example is outside the repository's pnpm workspace.
Run these commands from this directory:

```sh
pnpm --ignore-workspace install
pnpm types:check
pnpm start
```

Run `pnpm build` for production files in `dist`. From a repository checkout,
`pnpm build-demo` also copies them to `packages/graphiql/cm6/dist`.
