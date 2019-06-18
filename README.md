# GraphQL IDE Monorepo


[![Build Status](https://travis-ci.org/graphql/graphiql.svg?branch=master)](https://travis-ci.org/graphql/graphiql)
[![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/RfY2dvr)

[![](packages/graphiql/resources/graphiql.png)](http://graphql.org/swapi-graphql)

## Intro

GraphiQL is the reference implementation of GraphQL IDE, an official project under the GraphQL Foundation.

This repository contains much of the code that powers GraphiQL, split into modules that can be used to build custom/alternative editors. The code uses the permissive MIT license.

## [GraphiQL](packages/graphiql#readme)
[![NPM](https://img.shields.io/npm/v/graphiql.svg)](https://npmjs.com/graphiql)
[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql).

The GraphiQL IDE, implemented in React, currently using [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) & [GraphQL Language Service](packages/graphql-language-service#readme).


## [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme)
[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg)](https://npmjs.com/codemirror-graphql)
[![CDNJS](https://img.shields.io/cdnjs/v/codemirror-graphql.svg)](https://cdnjs.com/libraries/codemirror-graphql)


Provides CodeMirror with a parser mode for GraphQL along with a live linter and typeahead hinter powered by your GraphQL Schema


## [GraphQL Language Service](packages/graphql-language-service#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)

Provides an interface for building GraphQL language services for IDEs.


##  [GraphQL Language Service Server](packages/graphql-language-service-server#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)

Server process backing the [GraphQL Language Service](packages/graphql-language-service#readme).


## [GraphQL Language Service Interface](packages/graphql-language-service-interface#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-interface.svg)](https://npmjs.com/graphql-language-service-interface)

Interface to the [GraphQL Language Service](packages/graphql-language-service#readme)


## [GraphQL Language Service Parser](packages/graphql-language-service-parser#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-parser.svg)](https://npmjs.com/graphql-language-service-parser)

An online immutable parser for [GraphQL](http://graphql.org/), designed to be used as part of syntax-highlighting and code intelligence tools such as for the [GraphQL Language Service](packages/graphql-language-service#readme) and [codemirror-graphql](packages/codemirror-graphql#readme).


## [GraphQL Language Service Types](packages/graphql-language-service-types#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-types.svg)](https://npmjs.com/graphql-language-service-types)

[Flow](https://flowtype.org/) type definitions for the [GraphQL Language Service](packages/graphql-language-service#readme).


## [GraphQL Language Service Utilities](packages/graphql-language-service-utils#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-utils.svg)](https://npmjs.com/graphql-language-service-utils)

Utilities to support the [GraphQL Language Service](packages/graphql-language-service#readme).


## Contributing

This is an open source project, and we welcome contributions. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.


## Community

- __Discord__ - Currently we are using a [Discord Community](https://discord.gg/eNuu9Cb) to preserve chat history. 
- __Twitter__ - [@GraphiQL](https://twitter.com/@GraphiQL)for official updates, and [#GraphiQL](https://twitter.com/hashtag/GraphiQL) for discussions!
- __Github__ - Create feature requests and start discussions using the Issues tab above!
