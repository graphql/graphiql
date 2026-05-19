---
'@graphiql/react': patch
---

Fix syntax highlighting and autocompletion when GraphiQL is loaded from a CDN such as esm.sh.

The monaco store previously imported `monaco-graphql/esm/monaco-editor.js`, a re-export module that both registers monaco-editor language contributions and re-exports the lean monaco-editor namespace. Some CDN bundlers (esm.sh's `?standalone` mode in particular) split that file in a way that leaves the consumer with two monaco-editor instances: one with the `graphql` and `json` languages registered, and one without. The lazily-loaded json/graphql tokenization runs against the unregistered instance and throws `Cannot set tokens provider for unknown language json`, breaking syntax highlighting and completion.

The store now imports the language contribution side effects and the lean monaco-editor entry directly, so there is no re-export module for the bundler to split. Behavior is unchanged for npm-installed consumers using a bundler (Vite, webpack, Rollup, Next.js); module deduplication already produced a single instance there.
