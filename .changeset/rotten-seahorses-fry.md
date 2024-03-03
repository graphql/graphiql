---
'graphql-language-service-server': minor
'vscode-graphql': minor
'graphql-language-service-server-cli': minor
---

Fix many schema and fragment lifecycle issues, for all contexts except for schema updates for url schemas.
Note: this makes `cacheSchemaForLookup` enabled by default again for schema first contexts.

this fixes multiple cacheing bugs, on writing some in-depth integration coverage for the LSP server.
it also solves several bugs regarding loading config types, and properly restarts the server when there are config changes

### Bugfix Summary

- jump to definition in embedded files offset bug
- cache invalidation for fragments
- schema cache invalidation for schema files
- schema definition lookups & autocomplete crossing into the wrong workspace

### Known Bugs Fixed

- #3318
- #2357
- #3469
- #2422
- #2820
- many others to add here...

### Test Improvements

- new, high level integration spec suite for the LSP with a matching test utility
- more unit test coverage
- **total increased test coverage of about 25% in the LSP server codebase.**
- many "happy paths" covered for both schema and code first contexts
- many bugs revealed (and their source)
