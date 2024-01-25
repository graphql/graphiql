---
'graphql-language-service-server': patch
'vscode-graphql': patch
---

fix svelte parsing, re-load config only on config changes

- fix esbuild bundling of `typescript` for `svelte2tsx`!
- confirm with manual testing of the vsix extension bundle ✅
- ensure that the server only attemps to parse opened/saved files when the server is activated or the file is a config file
