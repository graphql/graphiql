---
'graphql-language-service-server': patch
'graphql-language-service-cli': patch
'vscode-graphql': patch
---

**Bugfixes**

debounce schema change events to fix codegen bugs to fix #3622

on mass file changes, network schema is overfetching because the schema cache is now invalidated on every watched schema file change

to address this, we debounce the new `onSchemaChange` event by 400ms

note that `schemaCacheTTL` can only be set in extension settings or graphql config at the top level - it will be ignored if configured per-project in the graphql config

**Code Improvements**

- Fixes flaky tests, and `schemaCacheTTL` setting not being passed to the cache
- Adds a test to validate network schema changes are reflected in the cache
