---
'graphql-language-service-server': patch
'vscode-graphql': patch
---

Temporarily revert svelte parsing until we can fix bundling issues with svelte2tsx. For now we return to using the vue parser to parse svelte files which will invariably cause some issues, such as being off by several characters
