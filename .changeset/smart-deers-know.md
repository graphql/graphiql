---
'monaco-graphql': patch
---

- `picomatch-browser` fork no longer uses `path`. these changes to remove node dependencies from `picomatch`, 99% of them are by another contributor, will eventually be merged into the actual `picomatch`
- no `onLanguage` for `initializeMode` - always instantiate the mode when this is called directly! Fixes some editor creation race condition issues
- introduce a demo using react + vite and minimal config, no workarounds! This will help us prototype for `@graphiql/react`
- use `schemaValidation: 'error'` by default. allow user to override `validate` if they want.
- always re-register providers on schema config changes. seems to fix some issues on lazy instantiation
