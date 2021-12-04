---
'graphql-language-service-interface': patch
---

fix a potential issue where field(arg: $| in codemirror-graphql might have autocompletion insert of $\$variable because of recent changes to completion for monaco-graphql/vscode-graphql
