# GraphQL IDE Monorepo


[![Build Status](https://travis-ci.org/graphql/graphiql.svg?branch=master)](https://travis-ci.org/graphql/graphiql)
[![Discord](https://img.shields.io/discord/586999333447270440.svg)](https://discord.gg/RfY2dvr)

## Overview

GraphiQL is the reference implementation of this monorepo, GraphQL IDE, an official project under the GraphQL Foundation. The code uses the permissive MIT license.

Whether you want a simple GraphiQL IDE instance for your server, or a more advanced web or desktop GraphQL IDE experience for your framework or plugin, or you want to build an IDE extension or plugin, you've come to the right place!

The purpose of this monorepo is to give the GraphQL Community:
- a solid, to-specification official language service, 
- a codemirror mode
- an example of how to use this ecosystem with GraphiQL.
- examples of how to implement or extend GraphiQL



## [GraphiQL](packages/graphiql#readme)
[![NPM](https://img.shields.io/npm/v/graphiql.svg)](https://npmjs.com/graphiql)
[![CDNJS](https://img.shields.io/cdnjs/v/graphiql.svg)](https://cdnjs.com/libraries/graphiql)

[![](packages/graphiql/resources/graphiql.jpg)](https://graphiql-test.netlify.com/)

_/ˈɡrafək(ə)l/_ A graphical interactive in-browser GraphQL IDE. [Try the live demo](http://graphql.org/swapi-graphql). We also have [a demo using our latest netlify build](http://graphiql-test.netlify.com) for the master branch.

The GraphiQL IDE, implemented in React, currently using [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) & [GraphQL Language Service](packages/graphql-language-service#readme).

### How To Setup/Implement GraphiQL
[![Edit graphiql-example](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/graphiql-example-nhzvc)

(works with `create-react-app` without requiring additional configuration)

The [GraphiQL Readme](packages/graphiql#readme) explains some of the ways to implement GraphiQL, and we also have the [examples](examples) directory as well!

## [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme)
[![NPM](https://img.shields.io/npm/v/codemirror-graphql.svg)](https://npmjs.com/codemirror-graphql)

![](packages/codemirror-graphql/resources/example.gif)

Provides CodeMirror with a parser mode for GraphQL along with a live linter and typeahead hinter powered by your GraphQL Schema


## [GraphQL Language Service](packages/graphql-language-service#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)

Provides an interface for building GraphQL language services for IDEs.


##  [GraphQL Language Service Server](packages/graphql-language-service-server#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service.svg)](https://npmjs.com/graphql-language-service)

Server process backing the [GraphQL Language Service](packages/graphql-language-service#readme).


## [GraphQL Language Service Interface](packages/graphql-language-service-interface#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-interface.svg)](https://npmjs.com/graphql-language-service-interface)

Runtime agnostic Language Service used by [GraphQL mode for CodeMirror](packages/codemirror-graphql#readme) and [GraphQL Language Service Server](packages/graphql-language-service-server#readme)


## [GraphQL Language Service Parser](packages/graphql-language-service-parser#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-parser.svg)](https://npmjs.com/graphql-language-service-parser)

An online immutable parser for [GraphQL](http://graphql.org/), designed to be used as part of syntax-highlighting and code intelligence tools such as for the [GraphQL Language Service](packages/graphql-language-service#readme) and [codemirror-graphql](packages/codemirror-graphql#readme).


## [GraphQL Language Service Types](packages/graphql-language-service-types#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-types.svg)](https://npmjs.com/graphql-language-service-types)

[Flow](https://flowtype.org/) and Typescript type definitions for the [GraphQL Language Service](packages/graphql-language-service#readme).


## [GraphQL Language Service Utilities](packages/graphql-language-service-utils#readme)
[![NPM](https://img.shields.io/npm/v/graphql-language-service-utils.svg)](https://npmjs.com/graphql-language-service-utils)

Utilities to support the [GraphQL Language Service](packages/graphql-language-service#readme).


## Contributing

This is an open source project, and we welcome contributions. Please see
[CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute.


## Developing/Contributing

We welcome contributions and assistance! If you want to know where to start, check out our [Github Projects](https://github.com/graphql/graphiql/projects). If you want to add a new feature, note that GraphiQL is eventually going to support its own extension system, and we are rarely adding new features, so make sure you submit feature requests with that in mind.

This repo is a yarn workspaces monorepo that also uses lerna for some convenience.
It requires node 11 and the latest stable version of yarn. 
Running these commands with `npm` _will_ cause you problems.

As of December 2019 we are officially supporting Windows OS for development tooling. If you encounter any bugs when using these or other package.json scripts, please report them!

### Getting Started

1. `yarn` - install and link all packages
2. `yarn build` - cleans first, then builds everything but webpack bundles - `tsc --build`, `babel` etc
3. `yarn build-bundles` - builds webpack bundles that are used for releases
4. `yarn build-demo` - builds demo projects for netlify; we run this on CI to make sure webpack can consume our project in a standalone project.
5. `yarn test` - runs all of the above alongside linting and checks, jest mocha Cypress etc.
6. `yarn format` - autoformats with eslint --fix and prettier
7. `yarn lint` - checks for linting issues
8. `yarn e2e` - runs cypress headlessly against the minified bundle and a local schema server, like in CI.
9. `yarn jest` - runs global jest commands across the entire monorepo; try `yarn jest --watch` or `yarn jest DocExplorer` for example :D

Learn more in [`CONTRIBUTING.md`](./CONTRIBUTING.md) documentation.

## Initiatives

Lots of activity lately! These things are in progress currently:

- making web and IDE services 100% [LSP](https://langserver.org) specification complete
- a monaco editor mode
- extensions and themes to make GraphiQL a multipurpose tool for building GraphQL IDEs

### Fielding Proposals!

The door is open for proposals for the new GraphiQL Plugin API, and other ideas on how to make the rest of the IDE ecosystem more performant, scaleable, interoperable and extensible.
Feel free to open a PR to create a document in the `/proposals/` directory. 
Eventually we hope to move these to a repo that serves this purpose.


## Community

- __Discord__ - Most discussion outside of github happens on our [Discord Server](https://discord.gg/eNuu9Cb)
- __Twitter__ - [@GraphiQL](https://twitter.com/@GraphiQL) and [#GraphiQL](https://twitter.com/hashtag/GraphiQL)
- __GitHub__ - Create feature requests and start discussions above
