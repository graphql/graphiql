---
'graphiql': minor
---

Apply variable editor title text styles via class `variable-editor-title-text` instead of using inline-styles. This allows better customization of styles. An active element also has the class `active`. This allows overriding the inactive state color using the selector `.graphiql-container .variable-editor-title-text` and overriding the active state color using the selector `.graphiql-container .variable-editor-title-text.active`.
