---
'vscode-graphql-syntax': patch
---

Add `text.html.vue` as inline injection target.

[This PR](https://github.com/vuejs/language-tools/pull/5856) broke tooling by changing the vue grammar scope from `source.vue` to `text.html.vue`. This adds `text.html.vue` as an additional injection target for GraphQL syntax highlighting so that it works in both cases.
