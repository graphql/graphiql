# GraphiQL Monorepo

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql).

[![Build Status](https://travis-ci.org/graphql/graphiql.svg?branch=master)](https://travis-ci.org/graphql/graphiql)
[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)
[![npm](https://img.shields.io/npm/v/graphiql.svg)](https://www.npmjs.com/package/graphiql)

[![](resources/graphiql.png)](http://graphql.org/swapi-graphql)

## Intro

GraphiQL is the reference implementation of a GraphQL IDE, an official
project under the GraphQL Foundation.

This repository contains much of the code that powers GraphiQL, split into
modules that can be used to build custom/alternative editors. The code uses
the permissive MIT license. The main components in this monorepo are:

- [GraphiQL](packages/graphiql/README.md) - the GraphiQL IDE, implemented in React
- [GraphQL mode for CodeMirror](packages/codemirror-graphql/README.md) - provides CodeMirror with a parser mode for GraphQL along with a live linter and typeahead hinter powered by your GraphQL Schema

## Contributing

This is an open source project, and we welcome contributions. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.
