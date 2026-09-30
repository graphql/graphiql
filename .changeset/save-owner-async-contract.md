---
'@graphiql/react': minor
'@graphiql/plugin-collections': patch
'graphiql': patch
---

Give each Save action one owner. A host `onSaveQuery` overrides the Collections handler, and a second plugin save handler is rejected. Save handlers can return a promise so the saved marker updates only after a successful write and tracks the submitted query while editing continues. Collections waits for its storage adapter before completing linked and dialog saves.
