---
'vscode-graphql': major
'vscode-graphql-execution': major
---

pr: 4478

Update the extensions' bundled GraphQL.js runtime to 16.14.2. GraphQL.js is included in each extension rather than supplied as a peer dependency; updating the extension does not require installing or upgrading `graphql` in your project.
