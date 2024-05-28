---
'graphql-language-service-server': minor
'vscode-graphql': minor
'graphql-language-service-cli': minor
---

Fix many schema and fragment lifecycle issues, not all of them, but many related to cacheing.
Note: this makes `cacheSchemaForLookup` enabled by default again for schema first contexts.

This fixes multiple cacheing bugs, upon addomg some in-depth integration test coverage for the LSP server.
It also solves several bugs regarding loading config types, and properly restarts the server and invalidates schema when there are config changes.

### Bugfix Summary

- configurable polling updates for network and other code first schema configuration, set to a 30s interval by default. powered by `schemaCacheTTL` which can be configured in the IDE settings (vscode, nvim) or in the graphql config file. (1)
- jump to definition in embedded files offset bug, for both fragments and code files with SDL strings
- cache invalidation for fragments (fragment lookup/autcoomplete data is more accurate, but incomplete/invalid fragments still do not autocomplete or validate, and remember fragment options always filter/validate by the `on` type!)
- schema cache invalidation for schema files - schema updates as you change the SDL files, and the generated file for code first by the `schemaCacheTTL` setting
- schema definition lookups & autocomplete crossing over into the wrong project

**Notes**

1. If possible, configuring for your locally running framework or a schema registry client to handle schema updates and output to a `schema.graphql` or `introspection.json` will always provide a better experience. many graphql frameworks have this built in! Otherwise, we must use this new lazy polling approach if you provide a url schema (this includes both introspection URLs and remote file URLs, and the combination of these).

### Known Bugs Fixed

- #3318
- #2357
- #3469
- #2422
- #2820
- many more!

### Test Improvements

- new, high level integration spec suite for the LSP with a matching test utility
- more unit test coverage
- **total increased test coverage of about 25% in the LSP server codebase.**
- many "happy paths" covered for both schema and code first contexts
- many bugs revealed (and their source)

### What's next?

Another stage of the rewrite is already almost ready. This will fix even more bugs and improve memory usage, eliminate redundant parsing and ensure that graphql config's loaders do _all_ of the parsing and heavy lifting, thus honoring all the configs as well. It also significantly reduces the code complexity.

There is also a plan to match Relay LSP's lookup config for either IDE (vscode, nvm, etc) settings as they provide, or by loading modules into your `graphql-config`!
