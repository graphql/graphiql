---
'monaco-graphql': patch
---

Fix hover crashing on the first line of a query

`GraphQLWorker.doHover` was passing 0-indexed positions to `getRange`, which expects a 1-indexed `SourceLocation` (per the GraphQL spec). On the first line this caused `Expected Parser stream to be available` to be logged and hover to return `null`. On other lines it returned the range of the previous line's last token rather than the token under the cursor. Use `getTokenAtPosition` to compute the actual token range instead.
