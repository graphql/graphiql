---
'@graphiql/react': major
'graphiql': major
---

Remove the `operationName` prop from `GraphiQL` and `GraphiQLProvider`. Each request now uses the operation selected in the active tab. Use the cursor, Run picker, or `useGraphiQLActions().setOperationName(name)` to select an operation; `onEditOperationName` still reports selection changes.
