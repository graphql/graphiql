---
'@graphiql/react': minor
'graphiql': minor
---

Keep the active operation synchronized with the editor cursor in documents containing multiple operations. Operation-aware plugins use the same selection. The `onEditOperationName` callback fires when the cursor enters a different named operation, as well as when an operation is selected explicitly.
