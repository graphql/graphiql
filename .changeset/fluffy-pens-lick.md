---
'monaco-graphql': patch
---

import only `editor.api` & basic features, add `monaco-graphql/lite`

- switch from exporting `edcore.js` to `editor.api.js` as recommended, and minimal features to get the editor working
  - `edcore` imports `editor.all` which contains many monaco-editor features we don't use
- dynamic import of `json` language mode only if the user supplies configuration for json validation
- update monaco examples to show minimal `typescript` implementation alongside `graphql`
- add new simplified `exports` with backwards compatibility:
  - `monaco-graphql/initializeMode`
  - `monaco-graphql/graphql.worker`
  - `monaco-graphql/monaco-editor`
- introduce `monaco-graphql/lite` for users who want the most minimum version possible, and to only import the features they need
