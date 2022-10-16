---
'graphql-language-service-server': patch
'vscode-graphql': patch
---

Workspaces support introduced a regression for no-config scenario. Reverting to fix bugs with no graphql config crashing the server.
