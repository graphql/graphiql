---
'@graphiql/plugin-doc-explorer': patch
'@graphiql/plugin-history': patch
---

Fix degraded type declarations in published packages

Both packages import from `@graphiql/react` at build time but only declared it as a peer dependency. Yarn workspaces topologically orders builds via `dependencies`/`devDependencies`, not `peerDependencies`, so on a clean checkout these plugins built before `@graphiql/react` had emitted its `dist/*.d.ts`. `vite-plugin-dts` then ran `tsc` against unresolved `@graphiql/react` imports, fell back to `any` for any return type that flowed through `useGraphiQL`, and published `.d.ts` artifacts where hooks like `useDocExplorer` and `useDocExplorerActions` resolved to `() => any` instead of their real shapes.

Adding `@graphiql/react` as a `devDependency` matches the pattern already in `@graphiql/plugin-explorer` and `@graphiql/plugin-code-exporter` and lets the build run in topological order.
