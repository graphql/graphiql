# GraphiQL Monorepo

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql).

[![Build Status](https://travis-ci.org/graphql/graphiql.svg?branch=master)](https://travis-ci.org/graphql/graphiql)
[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)
[![npm](https://img.shields.io/npm/v/graphiql.svg)](https://www.npmjs.com/package/graphiql)

[![](packages/graphiql/resources/graphiql.png)](http://graphql.org/swapi-graphql)

## Intro

GraphiQL is the reference implementation of GraphQL IDE, an official project under the GraphQL Foundation.

This repository contains much of the code that powers GraphiQL, split into modules that can be used to build custom/alternative editors. The code uses the permissive MIT license.

The main components in this monorepo are:

- __[GraphiQL](packages/graphiql#readme)__ - the GraphiQL IDE, implemented in React, currently using [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) & [GraphQL Language Service](packages/graphql-language-service#readme).
- __[GraphQL mode for CodeMirror](packages/codemirror-graphql#readme)__ - provides CodeMirror with a parser mode for GraphQL along with a live linter and typeahead hinter powered by your GraphQL Schema
- __[GraphQL Language Service](packages/graphql-language-service#readme)__ - provides an interface for building GraphQL language services for IDEs.

Additionally, these components are dependents of the above packages, and are themselves used throughout the GraphQL Ecosystem:
- __[GraphQL Language Service Server](packages/graphql-language-service-server#readme)__ - server process backing the [GraphQL Language Service](packages/graphql-language-service#readme).
- __[GraphQL Language Service Interface](packages/graphql-language-service-interface#readme)__ - interface to the [GraphQL Language Service](packages/graphql-language-service#readme)
- __[GraphQL Language Service Parser](packages/graphql-language-service-parser#readme)__ - an online immutable parser for [GraphQL](http://graphql.org/), designed to be used as part of syntax-highlighting and code intelligence tools such as for the [GraphQL Language Service](packages/graphql-language-service#readme) and [codemirror-graphql](packages/codemirror-graphql#readme).
- __[GraphQL Language Service Types](packages/graphql-language-service-types#readme)__ - [Flow](https://flowtype.org/) type definitions for the [GraphQL Language Service](packages/graphql-language-service#readme).
- __[GraphQL Language Service Utilities](packages/graphql-language-service-utils#readme)__ - utilities to support the [GraphQL Language Service](packages/graphql-language-service#readme).


## Contributing

This is an open source project, and we welcome contributions. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.
