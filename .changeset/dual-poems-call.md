---
'graphql-language-service-server': patch
'graphql-language-service-cli': patch
---

Fix error with LSP crash for CLI users #2230. `vscode-graphql` not impacted - rather, `nvim.coc`, maybe other clients who use CLI directly). recreation of #2546 by [@xuanduc987](https://github.com/xuanduc987, thank you!)

