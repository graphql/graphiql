---
'graphql-language-service-server': patch
---

Move `debounce-promise` from `devDependencies` to `dependencies`. It is imported at runtime in `MessageProcessor.ts`, so it must be a regular dependency. Previously the package only resolved it via hoisting, which fails under strict installs (e.g. `pnpm` v11), causing `graphql-lsp` to crash with `Cannot find module 'debounce-promise'`.
