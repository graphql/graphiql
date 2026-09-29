---
'@graphiql/react': minor
'graphiql': minor
---

The operation being edited now follows the editor cursor. As you move the cursor between operations in a multi-operation document, `onEditOperationName` reports the operation the cursor sits in, and operation-aware plugins edit that operation. Previously the editing selection changed only on run-at-cursor or via the operation dropdown.

If you embed GraphiQL, `operationName` continues to override which operation is sent in a request. Cursor movement and run-at-cursor still update the editing selection and call `onEditOperationName` when the prop is supplied. The Run button shows the execution override so the request target stays visible. A tab containing multiple operations shows the editing operation name with a `+N` count of the others.

The Run button now offers an operation picker: in a document with multiple named operations, a dropdown on the Run button lets you choose which operation to run, and the menu marks which operation is currently active. The picker is hidden when `operationName` overrides execution.
