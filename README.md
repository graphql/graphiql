# GraphQL IDE Monorepo


[![Build Status](https://travis-ci.org/graphql/graphiql.svg?branch=master)](https://travis-ci.org/graphql/graphiql)
[![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/RfY2dvr)

[![](packages/graphiql/resources/graphiql.png)](https://graphiql-test.netlify.com/)

## Intro

GraphiQL is the reference implementation of this monorepo, GraphQL IDE, an official project under the GraphQL Foundation. The code uses the permissive MIT license.

The `graphql-language-service-interface` should be your go-to for language server protocol spec (LSP) implementations, which is now our first order IDE spec.

The purpose of this monorepo is to give folks a solid language service, and editor modes, and to show an example of how to use them with GraphiQL.


## [GraphiQL](packages/graphiql#readme)
[![NPM](https://img.shields.io/npm/v/graphiql.svg)](https://npmjs.com/graphiql)
[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql). We also have [a demo using our latest netlify build](http://graphiql-test.netlify.com) for the master branch.

The GraphiQL IDE, implemented in React, currently using [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) & [GraphQL Language Service](packages/graphql-language-service#readme).

### How To Setup/Implement GraphiQL
[![Edit graphiql-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/graphiql-example-nhzvc)
(requires no create react app configuration)

The [GraphiQL Readme](packages/graphiql#readme) explains some of the ways to implement GraphiQL, and we also have the [examples](examples) directory as well!

## [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme)
[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg)](https://npmjs.com/codemirror-graphql)

Provides CodeMirror with a parser mode for GraphQL along with a live linter and typeahead hinter powered by your GraphQL Schema


## [GraphQL Language Service](packages/graphql-language-service#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)

Provides an interface for building GraphQL language services for IDEs.


##  [GraphQL Language Service Server](packages/graphql-language-service-server#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)

Server process backing the [GraphQL Language Service](packages/graphql-language-service#readme).


## [GraphQL Language Service Interface](packages/graphql-language-service-interface#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-interface.svg)](https://npmjs.com/graphql-language-service-interface)

LSP Interface to the [GraphQL Language Service](packages/graphql-language-service#readme)


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


## Developing/Contributing

This repo is a yarn workspaces monorepo that also uses lerna for some convenience.
It requires node 11 and the latest yarn ideally.  `npm` commands _will_ fail.

As of December 2019 we are officially supporting windows OS for development tooling. If you encounter any bugs when using these or other npm scripts, pleas report them!

### Getting Started

1. `yarn` - install and link all packages
2. `yarn build` - cleans first, then builds everything but webpack bundles - `tsc --build`, `babel` etc
3. `yarn build-bundles` - builds webpack bundles that are used for releases
4. `yarn build-demo` - builds demo projects for netlify. we run this on CI to make sure webpack can consume our project in a standalone project.
5. `yarn test` - runs all of the above alongside linting and checks, jest mocha Cypress etc.
6. `yarn pretty` - autoformats
7. `yarn lint` - checks for linting issues
8. `yarn e2e` - just runs cypress headless, ala CI against minified bundle and a local schema server.
9. `yarn jest` - runs global jest commands across the entire monorepo. try `yarn jest --watch` or `yarn jest DocExplorer` for example :D

Learn more in [`CONTRIBUTING.md`](./CONTRIBUTING.md) documentation.

### Fielding Proposals!

The door is open for proposals for the new GraphiQL Plugin API, and other ideas on how to make the rest of the IDE ecosystem more performant, scaleable, interoperable and extensible.
Feel free to open a PR to create a document in the `/proposals/` directory. 
Eventually we hope to move these to a repo that serves this purpose.


## Community

- __Discord__ - Most discussion outside of github happens on our [Discord Server](https://discord.gg/eNuu9Cb)
- __Twitter__ - [@GraphiQL](https://twitter.com/@GraphiQL) and [#GraphiQL](https://twitter.com/hashtag/GraphiQL)
- __GitHub__ - Create feature requests and start discussions above
