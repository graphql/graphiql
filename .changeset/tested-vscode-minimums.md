---
'vscode-graphql': major
'vscode-graphql-execution': major
---

Require VS Code 1.100.3 or later for language features and inline execution. Earlier editors were advertised as supported but were not covered by packaged-extension tests. Upgrade VS Code to use these releases; installing a newer system Node does not upgrade the extension host.

The language extension also includes the Astro compiler's WebAssembly file in its VSIX, restoring embedded GraphQL completion in Astro files.
