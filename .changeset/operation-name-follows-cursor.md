---
'@graphiql/react': minor
'graphiql': minor
---

The active operation now follows the editor cursor. As you move the cursor between operations in a multi-operation document, `operationName` updates to the operation the cursor sits in, so the Run button, the operation dropdown, and operation-aware plugins all reflect where you are editing. Previously `operationName` only changed on run-at-cursor or via the operation dropdown.

Two consequences if you embed GraphiQL: the `onEditOperationName` callback now fires when the cursor crosses into a different named operation, and a tab containing multiple operations shows the active operation name with a `+N` count of the others. Pinning an operation with the `operationName` prop still overrides cursor tracking.
