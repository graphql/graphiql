---
'graphql-language-service-utils': minor
'graphql-language-service': major
'monaco-graphql': major
---

This introduces some big changes to `monaco-graphql`, and some exciting features, including multi-model support, multi-schema support, and variables json language feature support 🎉. 

see [the readme](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#monaco-graphql) to learn how to configure and use the new interface. 

## 🚨 BREAKING CHANGES!! 🚨

*  `monaco-graphql` 🚨  **no longer loads schemas using `fetch` introspection** 🚨, you must specify the schema in one of many ways statically or dynamically. specifying just a schema `uri` no longer works. see [the readme](https://github.com/graphql/graphiql/tree/main/packages/monaco-graphql#monaco-graphql)
* when specifying the language to an editor or model, **use `graphql` as the language id instead of `graphqlDev`**
  * the mode now extends the default basic language support from `monaco-editor` itself
  * when bundling, for syntax highlighting and basic language features, you must specify `graphql` in languages for your webpack or vite monaco plugins
* The exported mode api for configfuration been entirely rewritten. It is simple for now, but we will add more powerful methods to the `monaco.languages.api` over time :)

## New Features

this introduces many improvements:
- json language support, by mapping from each graphql model uri to a set of json variable model uris
  - we generate a json schema definition for the json variables on the fly
  - it updates alongside editor validation as you type
- less redundant schema loading - schema is loaded in main process instead of in the webworker
- web worker stability has been improved by contributors in previous patches, but removing remote schema loading vastly simplifies worker creation
- the editor now supports multiple graphql models, configurable against multiple schema configurations
* You can now use `intializeMode()` to initialize the language mode & worker with the schema, but you can still lazily load it, and fall back on default monaco editor basic languages support
