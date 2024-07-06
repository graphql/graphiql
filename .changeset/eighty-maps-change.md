---
'graphql-language-service-server': patch
'graphql-language-service-cli': patch
'vscode-graphql': patch
---

**Bugfixes**

debounce schema change events to fix codegen bugs to fix #3622

on mass file changes, network schema is overfetching because the schema cache is now invalidated on every watched schema file change

to address this, we debounce the new `onSchemaChange` event by 400ms

note that `schemaCacheTTL` can only be set in the extension settings or in the config file

**Code Improvements**

- Fixes flaky tests, and `schemaCacheTTL` setting not being passed to the cache
- Adds a test to validate network schema changes are reflected in the cache
