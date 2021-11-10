---
'graphql-language-service-utils': minor
'monaco-graphql': minor
'graphiql': patch
'@graphiql/toolkit': patch
---

Add support for variables `json` diagnostics, code completion with additionalInsertText, and hover to `monaco-graphql` using the built in `JSONSchema` support in `monaco-graphql`. 🎉

See the `monaco-graphql` README for instructions on how to set this up in your project.

The utility allows users to generate `JSONSchema` definitions for the variables JSON on the fly which they feed to monaco's json language api when editing an operation's documents.

**BREAKING CHANGE!!** for `monaco-graphql` to api instantiation and using `graphql` language id instead of `graphqlDev` - it does not apply to `graphiql` or `@graphiql/toolkit` - they receive patches because the underling util has a new feature. These may be some of the last major breaking changes to `monaco-graphql` before we are able to ship the first `@graphiql/react` sdk, and thus be able to build towards a `graphqil@2.0.0` release.

the `monaco-graphql` mode is now instantiated using a new pattern:

```ts
import { initialize } from 'monaco-graphql'

const monacoGraphQLAPI = await instantiate({
  schemaConfig: { uri: 'http://myschema' },
  schemaLoader: mySchemaLoader,
  externalFragmentDefinitions: myFragmentDefinitionNodes ?? `myFragment {} AnotherFragment {}`,
  formattingOptions: {
    prettier: {
      printWidth: 120
    }
  }
});
```

There are now several additional methods:

* `monacoGraphQLAPI.onSchemaLoaded((api) => console.log(api.schema.schema, api.schema.schemaString))` for any behavior where you want to wait for the schema to be present.
* `await monacoGrapQLAPI.reloadSchema()` - forces a new schema request without config changes, for example in development environments
* `const JSONSchema = monacoGraphQLAPI.getJSONSChema()` for adding json features, see the readme for more details on how to add this to your implementation.
* `monacoGraphQLAPI.setGraphQLSchema(myGraphQLSchema)` was added by popular request

but most existing methods work just as before!

this also introduces improvements:
- less redundant schema loading - schema is loaded in main process instead of in the webworkers, providing a single source of truth and an EventEmitter
- web worker stability has been improved by contributors in previous patches, but waiting for the schema to be present seems to prevent most issues with unnecessary re-creation of webworkers
- language providers and webworkers are only called to action once the schema is present in the cache

